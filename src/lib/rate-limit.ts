import { createClient, type RedisClientType } from "redis";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

// In-memory: sliding window. Valkey: shared fixed window (INCR + PEXPIRE in
// one Lua script so a crash cannot leave a key without TTL).

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function createMemoryRateLimiter(config: RateLimitConfig) {
  const maxKeys = config.maxKeys ?? 10_000;
  const buckets = new Map<string, number[]>();

  function pruneExpired(now: number) {
    const windowStart = now - config.windowMs;
    for (const [key, timestamps] of buckets) {
      const live = timestamps.filter((timestamp) => timestamp > windowStart);
      if (live.length === 0) {
        buckets.delete(key);
      } else if (live.length !== timestamps.length) {
        buckets.set(key, live);
      }
    }
  }

  function evictOldest(keepKey: string) {
    while (buckets.size > maxKeys) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined || oldest === keepKey) {
        break;
      }
      buckets.delete(oldest);
    }
  }

  return {
    size() {
      return buckets.size;
    },
    consume(key: string, now = Date.now()): RateLimitResult {
      pruneExpired(now);

      const windowStart = now - config.windowMs;
      const timestamps = (buckets.get(key) ?? []).filter(
        (timestamp) => timestamp > windowStart,
      );

      if (timestamps.length >= config.limit) {
        buckets.delete(key);
        buckets.set(key, timestamps);
        evictOldest(key);
        const retryAfterMs = timestamps[0] + config.windowMs - now;
        return {
          success: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      timestamps.push(now);
      buckets.delete(key);
      buckets.set(key, timestamps);
      evictOldest(key);
      return {
        success: true,
        remaining: config.limit - timestamps.length,
        retryAfterSeconds: 0,
      };
    },
  };
}

export type ValkeyStore = {
  hit(key: string, windowMs: number): Promise<number>;
  pTTL(key: string): Promise<number>;
};

const VALKEY_HIT_SCRIPT = `
local n = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return n
`;

export function createValkeyRateLimiter(
  store: ValkeyStore,
  config: RateLimitConfig & { prefix: string },
) {
  return {
    async consume(ip: string): Promise<RateLimitResult> {
      const key = `${config.prefix}:${ip}`;
      try {
        const count = await store.hit(key, config.windowMs);
        if (count > config.limit) {
          const ttlMs = await store.pTTL(key);
          const retryAfterMs = ttlMs > 0 ? ttlMs : config.windowMs;
          return {
            success: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
          };
        }
        return {
          success: true,
          remaining: config.limit - count,
          retryAfterSeconds: 0,
        };
      } catch {
        // Fail open so desktop auto-update still works if Valkey is down.
        return {
          success: true,
          remaining: config.limit,
          retryAfterSeconds: 0,
        };
      }
    },
  };
}

export type PublicRateLimiter = {
  consume(
    key: string,
    now?: number,
  ): RateLimitResult | Promise<RateLimitResult>;
};

const UPDATER_LIMIT = {
  limit: env.UPDATER_RATE_LIMIT,
  windowMs: 60_000,
  maxKeys: 10_000,
};

const MANIFEST_LIMIT = {
  limit: env.MANIFEST_RATE_LIMIT,
  windowMs: 60_000,
  maxKeys: 10_000,
};

export const updaterRateLimiter = createMemoryRateLimiter(UPDATER_LIMIT);

export const curationManifestRateLimiter =
  createMemoryRateLimiter(MANIFEST_LIMIT);

let valkeyClient: RedisClientType | null = null;
let valkeyReady: Promise<RedisClientType> | null = null;
let valkeyUpdater: PublicRateLimiter | null = null;
let valkeyManifest: PublicRateLimiter | null = null;

async function connectedValkey(): Promise<RedisClientType> {
  if (!env.VALKEY_URL) {
    throw new Error("VALKEY_URL is not set");
  }
  if (!valkeyClient) {
    valkeyClient = createClient({ url: env.VALKEY_URL });
    valkeyClient.on("error", () => {
      // Connection errors are handled by fail-open consume().
    });
  }
  if (!valkeyClient.isOpen) {
    valkeyReady ??= valkeyClient.connect().then(
      () => valkeyClient!,
      (error: unknown) => {
        valkeyReady = null;
        throw error;
      },
    );
    await valkeyReady;
  }
  return valkeyClient;
}

function valkeyStore(): ValkeyStore {
  return {
    async hit(key: string, windowMs: number) {
      const client = await connectedValkey();
      const count = await client.eval(VALKEY_HIT_SCRIPT, {
        keys: [key],
        arguments: [String(windowMs)],
      });
      return Number(count);
    },
    async pTTL(key: string) {
      const client = await connectedValkey();
      return client.pTTL(key);
    },
  };
}

export function limiterForScope(
  scope: "updater" | "manifest",
): PublicRateLimiter {
  if (!env.VALKEY_URL) {
    return scope === "updater"
      ? updaterRateLimiter
      : curationManifestRateLimiter;
  }

  if (scope === "updater") {
    valkeyUpdater ??= createValkeyRateLimiter(valkeyStore(), {
      ...UPDATER_LIMIT,
      prefix: "rl:updater",
    });
    return valkeyUpdater;
  }

  valkeyManifest ??= createValkeyRateLimiter(valkeyStore(), {
    ...MANIFEST_LIMIT,
    prefix: "rl:manifest",
  });
  return valkeyManifest;
}

export async function applyPublicApiRateLimit(
  request: NextRequest,
  limiter: PublicRateLimiter,
  now = Date.now(),
): Promise<NextResponse | null> {
  const result = await limiter.consume(clientIpFromRequest(request), now);
  if (result.success) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}

function stripIpv4Port(ip: string): string {
  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;
  const match = ip.match(ipv4WithPort);
  return match?.[1] ?? ip;
}

function lastForwardedForIp(header: string): string | null {
  const hops = header.split(",");
  for (let i = hops.length - 1; i >= 0; i--) {
    const hop = hops[i]?.trim();
    if (hop) {
      return stripIpv4Port(hop);
    }
  }
  return null;
}

export function clientIpFromRequest(request: NextRequest): string {
  // Caddy sets both to {remote_host} and overwrites whatever the browser
  // sent. Prefer X-Real-IP: it is always a single address. X-Forwarded-For
  // is the fallback; if a chain is present, use the rightmost hop.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return stripIpv4Port(realIp);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const forwardedIp = lastForwardedForIp(forwarded);
    if (forwardedIp) {
      return forwardedIp;
    }
  }

  return "unknown";
}
