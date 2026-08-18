import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyPublicApiRateLimit,
  clientIpFromRequest,
  createMemoryRateLimiter,
  createValkeyRateLimiter,
  limiterForScope,
  updaterRateLimiter,
} from "@/lib/rate-limit";

describe("createMemoryRateLimiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests under the limit", () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 3, windowMs: 60_000 });

    // Act
    const first = limiter.consume("1.1.1.1", 1_000);
    const second = limiter.consume("1.1.1.1", 2_000);

    // Assert
    expect(first).toEqual({
      success: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(second).toEqual({
      success: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
  });

  it("blocks the request that exceeds the limit", () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.consume("2.2.2.2", 1_000);
    limiter.consume("2.2.2.2", 2_000);

    // Act
    const blocked = limiter.consume("2.2.2.2", 3_000);

    // Assert
    expect(blocked).toEqual({
      success: false,
      remaining: 0,
      retryAfterSeconds: 58,
    });
  });

  it("tracks keys independently", () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.consume("a", 1_000);

    // Act
    const otherKey = limiter.consume("b", 1_000);

    // Assert
    expect(otherKey.success).toBe(true);
  });

  it("allows traffic again after the window elapses", () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.consume("3.3.3.3", 1_000);

    // Act
    const afterWindow = limiter.consume("3.3.3.3", 11_001);

    // Assert
    expect(afterWindow.success).toBe(true);
    expect(afterWindow.remaining).toBe(0);
  });

  it("drops expired keys so the store does not grow", () => {
    // Setup
    const limiter = createMemoryRateLimiter({
      limit: 1,
      windowMs: 1_000,
      maxKeys: 50,
    });
    limiter.consume("a", 0);

    // Act
    limiter.consume("b", 1_500);

    // Assert
    expect(limiter.size()).toBe(1);
  });

  it("evicts the oldest key when maxKeys is exceeded", () => {
    // Setup
    const limiter = createMemoryRateLimiter({
      limit: 1,
      windowMs: 60_000,
      maxKeys: 2,
    });
    limiter.consume("a", 1_000);
    limiter.consume("b", 2_000);

    // Act
    limiter.consume("c", 3_000);
    const bStillLimited = limiter.consume("b", 4_000);
    const aAfterEviction = limiter.consume("a", 4_000);

    // Assert
    expect(bStillLimited.success).toBe(false);
    expect(aAfterEviction.success).toBe(true);
    expect(limiter.size()).toBeLessThanOrEqual(2);
  });
});

describe("clientIpFromRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers x-real-ip over x-forwarded-for", () => {
    // Setup
    const request = new NextRequest("http://localhost/api/updater", {
      headers: {
        "x-real-ip": "203.0.113.50",
        "x-forwarded-for": "8.8.8.8",
      },
    });

    // Act
    const ip = clientIpFromRequest(request);

    // Assert
    expect(ip).toBe("203.0.113.50");
  });

  it("falls back to the last x-forwarded-for hop when x-real-ip is missing", () => {
    // Setup
    const request = new NextRequest("http://localhost/api/updater", {
      headers: { "x-forwarded-for": "1.1.1.1, 203.0.113.50" },
    });

    // Act
    const ip = clientIpFromRequest(request);

    // Assert
    expect(ip).toBe("203.0.113.50");
  });

  it("ignores a spoofed leftmost x-forwarded-for hop", () => {
    // Setup
    const request = new NextRequest("http://localhost/api/updater", {
      headers: {
        "x-forwarded-for": "8.8.8.8, 10.0.0.1, 198.51.100.20",
      },
    });

    // Act
    const ip = clientIpFromRequest(request);

    // Assert
    expect(ip).toBe("198.51.100.20");
  });

  it("strips an ipv4 port from the last forwarded hop", () => {
    // Setup
    const request = new NextRequest("http://localhost/api/updater", {
      headers: { "x-forwarded-for": "198.51.100.20:54321" },
    });

    // Act
    const ip = clientIpFromRequest(request);

    // Assert
    expect(ip).toBe("198.51.100.20");
  });

  it("uses unknown when no client ip headers are present", () => {
    // Setup
    const request = new NextRequest("http://localhost/api/updater");

    // Act
    const ip = clientIpFromRequest(request);

    // Assert
    expect(ip).toBe("unknown");
  });
});

describe("applyPublicApiRateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null while the client is under the limit", async () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 60_000 });
    const request = new NextRequest("http://localhost/api/updater", {
      headers: { "x-forwarded-for": "8.8.8.8" },
    });

    // Act
    const result = await applyPublicApiRateLimit(request, limiter, 1_000);

    // Assert
    expect(result).toBeNull();
  });

  it("returns a 429 with Retry-After when the client is over the limit", async () => {
    // Setup
    const limiter = createMemoryRateLimiter({ limit: 1, windowMs: 30_000 });
    const request = new NextRequest("http://localhost/api/updater", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    });
    await applyPublicApiRateLimit(request, limiter, 1_000);

    // Act
    const response = await applyPublicApiRateLimit(request, limiter, 2_000);

    // Assert
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("29");
    expect(await response?.json()).toEqual({ error: "Too many requests" });
  });
});

describe("createValkeyRateLimiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests under the limit using an atomic hit", async () => {
    // Setup
    const store = {
      hit: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
      pTTL: vi.fn(),
    };
    const limiter = createValkeyRateLimiter(store, {
      limit: 3,
      windowMs: 60_000,
      prefix: "rl:updater",
    });

    // Act
    const first = await limiter.consume("10.0.0.1");
    const second = await limiter.consume("10.0.0.1");

    // Assert
    expect(first).toEqual({
      success: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(second).toEqual({
      success: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
    expect(store.hit).toHaveBeenCalledWith("rl:updater:10.0.0.1", 60_000);
    expect(store.hit).toHaveBeenCalledTimes(2);
  });

  it("blocks when the count exceeds the limit", async () => {
    // Setup
    const store = {
      hit: vi.fn().mockResolvedValue(4),
      pTTL: vi.fn().mockResolvedValue(15_000),
    };
    const limiter = createValkeyRateLimiter(store, {
      limit: 3,
      windowMs: 60_000,
      prefix: "rl:updater",
    });

    // Act
    const blocked = await limiter.consume("10.0.0.2");

    // Assert
    expect(blocked).toEqual({
      success: false,
      remaining: 0,
      retryAfterSeconds: 15,
    });
  });

  it("fails open when Valkey is unavailable", async () => {
    // Setup
    const store = {
      hit: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      pTTL: vi.fn(),
    };
    const limiter = createValkeyRateLimiter(store, {
      limit: 3,
      windowMs: 60_000,
      prefix: "rl:updater",
    });

    // Act
    const result = await limiter.consume("10.0.0.3");

    // Assert
    expect(result).toEqual({
      success: true,
      remaining: 3,
      retryAfterSeconds: 0,
    });
  });
});

describe("limiterForScope", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the in-memory limiter when VALKEY_URL is unset", () => {
    // Act
    const limiter = limiterForScope("updater");

    // Assert
    expect(limiter).toBe(updaterRateLimiter);
  });
});
