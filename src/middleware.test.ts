import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "@/middleware";

function requestFor(pathname: string) {
  return new NextRequest(`https://example.com${pathname}`);
}

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
