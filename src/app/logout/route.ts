import { NextResponse } from "next/server";

import { logout } from "@/actions/token";

export async function GET(request: Request) {
  await logout();

  // WORKAROUND - This must be handled by environment variables
  const host = request.headers.get("x-forwarded-host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  return NextResponse.redirect(`${protocol}://${host}/`);
}
