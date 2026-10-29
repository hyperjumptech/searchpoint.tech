import { NextResponse } from "next/server";

/** Dynamic client registration is intentionally disabled in static-client mode. */
export function POST(_request?: Request) {
  return NextResponse.json(
    {
      error: "unauthorized_client",
      error_description: "Dynamic client registration is disabled",
    },
    { status: 400 },
  );
}
