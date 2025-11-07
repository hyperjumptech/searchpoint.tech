import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { fetcher } from "@/lib/fetcher";

export async function GET() {
  await fetcher("/v1/auth/logout", {
    method: "POST",
  });

  return NextResponse.redirect(new URL("/login", env.APP_BASE_URL));
}
