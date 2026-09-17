import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import { isLoginBypassEnabled } from "@/lib/is-login-bypass-enabled";

const applySecurityHeaders = (response: Response) => {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.microsoft.com; connect-src 'self' https://*.microsoft.com;",
  );
  return response;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const scseId = request.cookies.get("SCSE_ID");
  const bypassLogin = isLoginBypassEnabled();
  const isAuthenticated = Boolean(scseId || bypassLogin);

  if (
    pathname === "/admin/mcp" ||
    pathname === "/api/admin/mcp" ||
    pathname.startsWith("/api/admin/mcp/")
  ) {
    if (!isAdminBasicAuthValid(request)) {
      return applySecurityHeaders(unauthorizedBasicAuthResponse());
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applySecurityHeaders(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    );
  }

  // OAuth endpoints are public: discovery, token exchange, and the MCP
  // resource. Defense-in-depth bypass in case the matcher ever changes.
  if (
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/api/oauth/") ||
    pathname === "/mcp" ||
    pathname.startsWith("/mcp/")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    const host = request.nextUrl.search
      ? `${rawHost}${request.nextUrl.search}`
      : rawHost;
    requestHeaders.set("x-hostname", host);
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
    );
  }

  // Allow public routes without authentication
  if (
    pathname === "/landing" ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/oauth/")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    const host = request.nextUrl.search
      ? `${rawHost}${request.nextUrl.search}`
      : rawHost;
    requestHeaders.set("x-hostname", host);
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
    );
  }

  // If accessing /login while authenticated or running locally, redirect to root
  if (pathname === "/login" && isAuthenticated) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", request.url)),
    );
  }

  // If accessing root / while not authenticated, redirect to /landing
  if (pathname === "/" && !isAuthenticated) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/landing", request.url)),
    );
  }

  // If accessing any other protected route without cookie, redirect to login
  if (pathname !== "/login" && !isAuthenticated) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  // Redirect empty search query to homepage
  if (pathname === "/search") {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (q.trim() === "") {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/", request.url)),
      );
    }
  }

  // Add pathname to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const host = request.nextUrl.search
    ? `${rawHost}${request.nextUrl.search}`
    : rawHost;
  requestHeaders.set("x-hostname", host);

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
  );
}

export const config = {
  matcher: [
    "/",
    "/landing",
    "/login",
    "/oauth/:path*",
    "/logout",
    "/search",
    "/image",
    "/docs/:path*",
    "/admin/mcp",
    "/api/admin/mcp/:path*",
    // /api is intentionally omitted. Desktop auto-update and the curation
    // model manifest must stay reachable without a session cookie. Those
    // handlers apply their own per-IP rate limits.
  ],
};
