import { NextResponse } from "next/server";

import { logout } from "@/actions/token";
import { env } from "@/lib/env";

export async function GET() {
  await logout();
  const url = new URL("/", env.APP_BASE_URL);

  return NextResponse.redirect(url);
}
