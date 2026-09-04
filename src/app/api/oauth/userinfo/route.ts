import { NextResponse } from "next/server";

import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

type AtData = {
  user: { email?: string; name?: string };
};

export async function GET(req: Request) {
  const unauthorized = () =>
    NextResponse.json(
      { error: "invalid_token" },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
      },
    );

  const at = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!at) return unauthorized();
  const data = await getJSON<AtData>(oauthKeys.at(at));
  if (!data || !data.user) return unauthorized();
  return NextResponse.json({
    sub: data.user.email,
    email: data.user.email,
    name: data.user.name,
  });
}
