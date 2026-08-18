// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLoginBypassEnabled } from "@/lib/is-login-bypass-enabled";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const scseId = request.cookies.get("SCSE_ID");
  const bypassLogin = isLoginBypassEnabled();

  // Allow public routes without authentication
  if (pathname.startsWith("/docs/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // If accessing /login while authenticated or running locally, redirect to root
  if (pathname === "/login" && (scseId || bypassLogin)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing protected routes without cookie, redirect to login
  if (pathname !== "/login" && !scseId && !bypassLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect empty search query to homepage
  if (pathname === "/search") {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (q.trim() === "") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Add pathname to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/logout",
    "/search",
    "/image",
    "/docs/:path*",
    // Add other routes as needed
  ],
};
