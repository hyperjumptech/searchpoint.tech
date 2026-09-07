import { afterEach, describe, expect, it, vi } from "vitest";

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("parses OAuth vars from process.env", async () => {
    vi.resetModules();
    vi.stubEnv("OAUTH_ISSUER", "https://test.example.com");
    const { env } = await import("./env");
    expect(env.OAUTH_ISSUER).toBe("https://test.example.com");
  });

  it("falls back to OAuth defaults when vars unset", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    const { env } = await import("./env");
    expect(env.OAUTH_SCOPES).toBe("openid profile email search magic");
    expect(env.OAUTH_ISSUER).toBeUndefined();
  });
});
