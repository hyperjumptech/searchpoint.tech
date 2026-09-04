import { NextResponse } from "next/server";

import { sendMagicLink } from "@/actions/send-magic-link";
import { env } from "@/lib/env";
import { deriveIssuer } from "@/lib/oauth";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";
import { clientIpFromRequest, limiterForScope } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limiter = limiterForScope("oauth");
  const rl = await limiter.consume(clientIpFromRequest(req));
  if (!rl.success)
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );

  let body: { email?: unknown; state?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const state = typeof body.state === "string" ? body.state : "";
  if (!email || !state)
    return NextResponse.json(
      { success: false, error: "invalid_request" },
      { status: 400 },
    );

  const stateData = await getJSON(oauthKeys.state(state));
  if (!stateData)
    return NextResponse.json(
      { success: false, error: "invalid_grant" },
      { status: 400 },
    );

  const issuer = (env.OAUTH_ISSUER ?? deriveIssuer(req)).replace(/\/$/, "");
  const returnTo = `${issuer}/api/oauth/callback?state=${encodeURIComponent(state)}`;
  const result = await sendMagicLink(email, returnTo);
  if (!result.success)
    return NextResponse.json(
      { success: false, error: result.error ?? "Failed to send magic link" },
      { status: 400 },
    );
  return NextResponse.json({ success: true });
}
