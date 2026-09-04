import { createClient, type RedisClientType } from "redis";

import { env } from "@/lib/env";

let client: RedisClientType | null = null;

// ponytail: dev fallback only — multi-replica prod requires VALKEY_URL
const memory = new Map<string, string>();
const MEMORY_MAX_KEYS = 5000;

export async function getOAuthValkey(): Promise<RedisClientType | null> {
  if (!env.VALKEY_URL) return null;
  if (!client)
    client = createClient({ url: env.VALKEY_URL }) as RedisClientType;
  if (!client.isOpen) await client.connect();
  return client;
}

export const oauthKeys = {
  state: (s: string) => `oauth:state:${s}`,
  code: (c: string) => `oauth:code:${c}`,
  at: (t: string) => `oauth:at:${t}`,
  rt: (t: string) => `oauth:rt:${t}`,
  magicPending: (s: string) => `oauth:magic:pending:${s}`,
  consent: (clientId: string, email: string) =>
    `oauth:consent:${clientId}:${email}`,
  client: (id: string) => `oauth:client:${id}`,
  clientByToken: (tokenId: string) => `oauth:client:bytoken:${tokenId}`,
};

export async function setWithTTL(key: string, value: unknown, ttlSec: number) {
  const c = await getOAuthValkey();
  if (!c) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    memory.set(key, JSON.stringify(value));
    setTimeout(() => memory.delete(key), ttlSec * 1000).unref?.();
    return;
  }
  await c.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function setPersistent(key: string, value: unknown) {
  const c = await getOAuthValkey();
  if (!c) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    memory.set(key, JSON.stringify(value));
    // no setTimeout — key persists until process exits
    return;
  }
  await c.set(key, JSON.stringify(value));
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const c = await getOAuthValkey();
  if (!c) {
    const v = memory.get(key);
    return v ? (JSON.parse(v) as T) : null;
  }
  const v = await c.get(key);
  return v ? (JSON.parse(v) as T) : null;
}

export async function delKey(key: string) {
  const c = await getOAuthValkey();
  if (!c) {
    memory.delete(key);
    return;
  }
  await c.del(key);
}

// Atomic read-and-delete: getDel on Redis, get+delete on memory fallback.
// Used for one-time oauth artifacts (state, code, refresh_token).
export async function takeJSON<T>(key: string): Promise<T | null> {
  const c = await getOAuthValkey();
  if (!c) {
    const v = memory.get(key);
    memory.delete(key);
    return v ? (JSON.parse(v) as T) : null;
  }
  const v = await c.getDel(key);
  return v ? (JSON.parse(v) as T) : null;
}
