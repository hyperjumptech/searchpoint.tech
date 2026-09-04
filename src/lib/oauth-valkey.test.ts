import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { OAUTH_ISSUER: "https://example.com", VALKEY_URL: undefined },
}));

import {
  oauthKeys,
  getOAuthValkey,
  setWithTTL,
  getJSON,
  takeJSON,
  delKey,
} from "@/lib/oauth-valkey";

describe("oauthKeys", () => {
  it("builds at key", () => {
    expect(oauthKeys.at("abc")).toBe("oauth:at:abc");
  });

  it("builds state key", () => {
    expect(oauthKeys.state("s1")).toBe("oauth:state:s1");
  });

  it("builds code key", () => {
    expect(oauthKeys.code("c1")).toBe("oauth:code:c1");
  });

  it("builds rt key", () => {
    expect(oauthKeys.rt("r1")).toBe("oauth:rt:r1");
  });

  it("builds magicPending key", () => {
    expect(oauthKeys.magicPending("m1")).toBe("oauth:magic:pending:m1");
  });
});

describe("getOAuthValkey", () => {
  it("returns null when VALKEY_URL is not set", async () => {
    const client = await getOAuthValkey();
    expect(client).toBeNull();
  });
});

describe("memory fallback", () => {
  beforeEach(async () => {
    // clean possible leftover keys
    await delKey(oauthKeys.state("fallback-test"));
    await delKey(oauthKeys.code("fallback-test"));
  });

  it("setWithTTL + getJSON round-trips in memory", async () => {
    const key = oauthKeys.state("fallback-test");
    await setWithTTL(key, { foo: "bar" }, 60);
    const got = await getJSON<{ foo: string }>(key);
    expect(got).toEqual({ foo: "bar" });
  });

  it("delKey removes value", async () => {
    const key = oauthKeys.code("fallback-test");
    await setWithTTL(key, { x: 1 }, 60);
    expect(await getJSON(key)).toEqual({ x: 1 });
    await delKey(key);
    expect(await getJSON(key)).toBeNull();
  });

  it("getJSON returns null for missing key", async () => {
    expect(await getJSON("oauth:missing:xyz")).toBeNull();
  });

  it("setWithTTL handles primitive values", async () => {
    const key = "oauth:primitive:test";
    await setWithTTL(key, "hello", 60);
    expect(await getJSON<string>(key)).toBe("hello");
    await delKey(key);
  });

  it("setWithTTL expires after TTL via timer", async () => {
    vi.useFakeTimers();
    const key = "oauth:ttl:test";
    await setWithTTL(key, { v: 1 }, 1);
    expect(await getJSON(key)).toEqual({ v: 1 });
    vi.advanceTimersByTime(1100);
    // allow timer callback to run: need to flush microtasks
    await Promise.resolve();
    expect(await getJSON(key)).toBeNull();
    vi.useRealTimers();
    await delKey(key);
  });
});

describe("takeJSON (atomic consume)", () => {
  beforeEach(async () => {
    await delKey(oauthKeys.code("take-test"));
  });

  it("returns value and deletes key on first call", async () => {
    const key = oauthKeys.code("take-test");
    await setWithTTL(key, { code: 1 }, 60);
    expect(await takeJSON<{ code: number }>(key)).toEqual({ code: 1 });
  });

  it("returns null on second call (one-time)", async () => {
    const key = oauthKeys.code("take-test");
    await setWithTTL(key, { code: 1 }, 60);
    await takeJSON(key);
    expect(await takeJSON(key)).toBeNull();
  });

  it("returns null for missing key", async () => {
    expect(await takeJSON("oauth:missing:take")).toBeNull();
  });
});

describe("memory fallback cap", () => {
  it("evicts oldest key when exceeding 5000 keys", async () => {
    vi.useFakeTimers();
    await setWithTTL("cap:oldest", "old", 60);
    for (let i = 0; i < 5000; i++) {
      await setWithTTL(`cap:k${i}`, i, 60);
    }
    expect(await getJSON("cap:oldest")).toBeNull();
    expect(await getJSON("cap:k4999")).toBe(4999);
    vi.useRealTimers();
    await delKey("cap:oldest");
    for (let i = 0; i < 5000; i++) {
      await delKey(`cap:k${i}`);
    }
  });
});
