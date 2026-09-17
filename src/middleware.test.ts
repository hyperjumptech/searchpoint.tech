import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.hoisted(() => {
  process.env.MCP_ADMIN_USERNAME = "admin";
  process.env.MCP_ADMIN_PASSWORD = "secret";
});

import { config, middleware } from "@/middleware";

function requestFor(pathname: string) {
  return new NextRequest(`https://example.com${pathname}`);
}

function adminRequestFor(pathname: string, authorization?: string) {
  return new NextRequest(`https://example.com${pathname}`, {
    headers: authorization ? { authorization } : undefined,
  });
}

const adminAuthorization = `Basic ${Buffer.from("admin:secret").toString(
  "base64",
)}`;

function isLoginRedirect(res: ReturnType<typeof middleware>) {
  return res.status === 307 && res.headers.get("location")?.includes("/login");
}

describe("middleware oauth bypass", () => {
  it("allows discovery without SCSE_ID", () => {
    const res = middleware(
      requestFor("/.well-known/oauth-authorization-server"),
    );
    expect(isLoginRedirect(res)).toBe(false);
  });

  it("allows protected-resource metadata without SCSE_ID", () => {
    const res = middleware(requestFor("/.well-known/oauth-protected-resource"));
    expect(isLoginRedirect(res)).toBe(false);
  });

  it("allows /api/oauth/token without SCSE_ID", () => {
    const res = middleware(requestFor("/api/oauth/token"));
    expect(isLoginRedirect(res)).toBe(false);
  });

  it("allows /mcp without SCSE_ID", () => {
    const res = middleware(requestFor("/mcp"));
    expect(isLoginRedirect(res)).toBe(false);
  });

  it("allows /mcp/ subpaths without SCSE_ID", () => {
    const res = middleware(requestFor("/mcp/tools/list"));
    expect(isLoginRedirect(res)).toBe(false);
  });

  it("still redirects unknown paths without SCSE_ID", () => {
    const res = middleware(requestFor("/search"));
    expect(isLoginRedirect(res)).toBe(true);
  });

  it("does not bypass paths that merely start with mcp", () => {
    const res = middleware(requestFor("/mcp-notes"));
    expect(isLoginRedirect(res)).toBe(true);
  });
});

describe("middleware admin basic auth", () => {
  it("protects the admin page and API routes", () => {
    expect(middleware(adminRequestFor("/admin/mcp")).status).toBe(401);
    expect(middleware(adminRequestFor("/api/admin/mcp")).status).toBe(401);
  });

  it("protects admin API descendants", () => {
    expect(
      middleware(adminRequestFor("/api/admin/mcp/applications")).status,
    ).toBe(401);
    expect(
      middleware(
        adminRequestFor("/api/admin/mcp/applications", adminAuthorization),
      ).status,
    ).toBe(200);
  });

  it("matches the admin API route and its descendants", () => {
    expect(config.matcher).toContain("/admin/mcp");
    expect(config.matcher).toContain("/api/admin/mcp/:path*");
  });

  it("keeps security headers on unauthorized admin responses", () => {
    const response = middleware(adminRequestFor("/api/admin/mcp"));

    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Basic realm="MCP admin"',
    );
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
  });

  it("allows configured admin credentials through", () => {
    expect(
      middleware(adminRequestFor("/admin/mcp", adminAuthorization)).status,
    ).toBe(200);
    expect(
      middleware(adminRequestFor("/api/admin/mcp", adminAuthorization)).status,
    ).toBe(200);
  });

  it("keeps public OAuth and MCP routes unprotected", () => {
    expect(middleware(requestFor("/mcp")).status).toBe(200);
    expect(middleware(requestFor("/api/oauth/token")).status).toBe(200);
  });
});
