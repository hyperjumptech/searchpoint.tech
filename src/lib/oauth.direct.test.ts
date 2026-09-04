import { describe, it, expect, afterEach, vi } from "vitest";

import { deriveIssuer, generateToken, timingSafeEqualStr } from "@/lib/oauth";

describe("generateToken (direct)", () => {
  it("produces 43-char base64url tokens", () => {
    expect(generateToken()).toHaveLength(43);
    expect(generateToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("produces unique tokens", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateToken());
    expect(seen.size).toBe(1000);
  });
});

describe("timingSafeEqualStr (direct)", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqualStr("secret-value", "secret-value")).toBe(true);
  });

  it("returns false for different same-length strings", () => {
    expect(timingSafeEqualStr("secret-valuX", "secret-value")).toBe(false);
  });

  it("returns false for length mismatch", () => {
    expect(timingSafeEqualStr("short", "a-much-longer-string")).toBe(false);
    expect(timingSafeEqualStr("", "x")).toBe(false);
  });
});

describe("deriveIssuer (direct)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers OAUTH_ISSUER env and trims trailing slash", async () => {
    vi.stubEnv("OAUTH_ISSUER", "https://issuer.example.com/");
    const req = new Request("https://web.example.com/mcp", {
      headers: { "x-forwarded-host": "fwd.example.com" },
    });
    expect(deriveIssuer(req)).toBe("https://issuer.example.com");
  });

  it("uses x-forwarded-host when env unset", async () => {
    vi.stubEnv("OAUTH_ISSUER", "");
    const req = new Request("https://web.example.com/mcp", {
      headers: { "x-forwarded-host": "fwd.example.com, inner.example.com" },
    });
    expect(deriveIssuer(req)).toBe("https://fwd.example.com");
  });

  it("falls back to request origin", async () => {
    vi.stubEnv("OAUTH_ISSUER", "");
    const req = new Request("https://web.example.com/mcp");
    expect(deriveIssuer(req)).toBe("https://web.example.com");
  });
});
