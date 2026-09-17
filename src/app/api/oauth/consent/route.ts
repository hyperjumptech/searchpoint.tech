import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { recordConsent } from "@/lib/oauth-consent";
import { oauthKeys, setWithTTL, takeJSON } from "@/lib/oauth-valkey";

type StateData = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource?: string;
  credentialVersion?: number;
  email?: string;
  consented?: boolean;
};

export async function POST(req: Request) {
  let body: { state?: unknown; deny?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "JSON body required" },
      { status: 400 },
    );
  }
  const state = typeof body.state === "string" ? body.state : "";
  const isDeny = body.deny === true;
  if (!state)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const stateData = await takeJSON<StateData>(oauthKeys.state(state));
  if (!stateData)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  if (isDeny) {
    const target = new URL(stateData.redirect_uri);
    target.searchParams.set("error", "access_denied");
    target.searchParams.set("state", state);
    return NextResponse.json({ redirect: target.toString() });
  }

  const email = stateData.email;
  if (!email)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  await recordConsent(stateData.client_id, email);

  // Re-store state so the callback can complete the flow; it was consumed by
  // takeJSON above. consented=true tells the callback to skip the consent gate
  // even when OAUTH_CONSENT_ALWAYS is set (which otherwise loops forever).
  await setWithTTL(
    oauthKeys.state(state),
    {
      client_id: stateData.client_id,
      redirect_uri: stateData.redirect_uri,
      code_challenge: stateData.code_challenge,
      scope: stateData.scope,
      resource: stateData.resource,
      credentialVersion: stateData.credentialVersion,
      email,
      consented: true,
    },
    600,
  );

  const base = (env.OAUTH_ISSUER ?? new URL(req.url).origin).replace(/\/$/, "");
  const redirect = `${base}/api/oauth/callback?state=${encodeURIComponent(state)}`;
  return NextResponse.json({ redirect });
}
