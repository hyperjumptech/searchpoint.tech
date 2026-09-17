import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const requestWithAuthorization = (authorization?: string) =>
  new Request("https://example.com/admin/mcp", {
    headers: authorization ? { authorization } : undefined,
  });

const validAuthorization = () =>
  `Basic ${Buffer.from("admin:secret").toString("base64")}`;

describe("admin basic auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects a missing authorization header", async () => {
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");
    const { isAdminBasicAuthValid } = await import("./admin-basic-auth");

    expect(isAdminBasicAuthValid(requestWithAuthorization())).toBe(false);
  });

  it("rejects malformed base64", async () => {
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");
    const { isAdminBasicAuthValid } = await import("./admin-basic-auth");

    expect(
      isAdminBasicAuthValid(requestWithAuthorization("Basic not base64")),
    ).toBe(false);
  });

  it("rejects the wrong username and password", async () => {
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");
    const { isAdminBasicAuthValid } = await import("./admin-basic-auth");

    expect(
      isAdminBasicAuthValid(
        requestWithAuthorization(
          `Basic ${Buffer.from("other:secret").toString("base64")}`,
        ),
      ),
    ).toBe(false);
    expect(
      isAdminBasicAuthValid(
        requestWithAuthorization(
          `Basic ${Buffer.from("admin:wrong").toString("base64")}`,
        ),
      ),
    ).toBe(false);
  });

  it("accepts the configured credentials", async () => {
    vi.stubEnv("MCP_ADMIN_USERNAME", "admin");
    vi.stubEnv("MCP_ADMIN_PASSWORD", "secret");
    const { isAdminBasicAuthValid } = await import("./admin-basic-auth");

    expect(
      isAdminBasicAuthValid(requestWithAuthorization(validAuthorization())),
    ).toBe(true);
  });

  it("rejects access when credentials are not configured", async () => {
    const { isAdminBasicAuthValid } = await import("./admin-basic-auth");

    expect(
      isAdminBasicAuthValid(requestWithAuthorization(validAuthorization())),
    ).toBe(false);
  });

  it("creates a basic auth challenge response", async () => {
    const { unauthorizedBasicAuthResponse } =
      await import("./admin-basic-auth");
    const response = unauthorizedBasicAuthResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Basic realm="MCP admin"',
    );
  });
});
