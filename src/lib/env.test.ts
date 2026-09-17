import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

  it("keeps server-only configuration out of the shared env module", async () => {
    vi.resetModules();
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@localhost:5432/searchpoint",
    );
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");

    const { env } = await import("./env");

    expect("DATABASE_URL" in env).toBe(false);
    expect("MCP_ADMIN_USERNAME" in env).toBe(false);
    expect("MCP_ADMIN_PASSWORD" in env).toBe(false);
    expect(env.APP_NAME).toBe("SearchPoint");
    expect(env.OAUTH_SCOPES).toBe("openid profile email search magic");
  });

  it("parses optional server-only configuration in the server module", async () => {
    vi.resetModules();
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@localhost:5432/searchpoint",
    );
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");

    const { env } = await import("./env.server");

    expect(env.DATABASE_URL).toBe(
      "postgres://user:pass@localhost:5432/searchpoint",
    );
    expect(env.MCP_ADMIN_USERNAME).toBe("admin");
    expect(env.MCP_ADMIN_PASSWORD).toBe("secret");
  });
});
