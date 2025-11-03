import { NextResponse } from "next/server";

import { logout } from "@/actions/token";

export async function GET(request: Request) {
  await logout();
  const url = new URL("/", request.url);

  return NextResponse.redirect(url);
}
