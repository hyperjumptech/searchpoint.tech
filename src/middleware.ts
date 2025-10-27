// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const scseId = request.cookies.get("SCSE_ID");

  // If accessing /login and cookie exists, redirect to root
  if (pathname === "/login" && scseId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing protected routes without cookie, redirect to login
  if (pathname !== "/login" && !scseId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    // Add other routes as needed
  ],
};
