import { NextResponse } from "next/server";

import { logout } from "@/actions/token";

export async function GET() {
  await logout();

  return NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 },
  );
}
