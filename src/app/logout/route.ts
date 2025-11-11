import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { fetcher } from "@/lib/fetcher";

export async function GET() {
  const response = await fetcher("/v1/auth/logout", {
    method: "POST",
  });

  // Forward the headers to the browser
  const redirectResponse = NextResponse.redirect(
    new URL("/login", env.APP_BASE_URL),
  );
  response?.headers?.forEach((value, key) => {
    redirectResponse.headers.set(key, value);
  });

  return redirectResponse;
}
