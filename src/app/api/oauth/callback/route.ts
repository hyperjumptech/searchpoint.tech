import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { hasConsent } from "@/lib/oauth-consent";
import { generateToken } from "@/lib/oauth";
import { oauthKeys, setWithTTL, takeJSON } from "@/lib/oauth-valkey";

type StateData = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource?: string;
  magic?: boolean;
  consented?: boolean;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  if (!state) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // One-time consumption: a second callback with the same state fails here.
  const stateData = await takeJSON<StateData>(oauthKeys.state(state));
  if (!stateData) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  // ?session= comes from the backend magic-link confirm redirect. It lands in Referer/history only on the user's own callback hop; cookie is set by the same redirect, so prefer cookie when both present.
  let scseId: string | null = url.searchParams.get("session");

  if (!scseId) {
    const rawCookie = req.headers.get("cookie") ?? "";
    const match = rawCookie.match(/SCSE_ID=([^;]+)/);
    if (match) {
      try {
        scseId = decodeURIComponent(match[1]);
      } catch {
        scseId = match[1];
      }
    }
  }

  if (!scseId) {
    try {
      const cookieStore = await cookies();
      scseId = cookieStore.get("SCSE_ID")?.value ?? null;
    } catch {
      // cookies() may throw outside Next request context (tests)
    }
  }

  if (!scseId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "missing SCSE_ID" },
      { status: 400 },
    );
  }

  // Validate via GET /v1/auth/me with Cookie SCSE_ID
  const backendBase =
    env.BACKEND_BASE_URL ?? "https://api.searchpoint.hyperjump.tech";
  const meUrl = new URL("/v1/auth/me", backendBase);
  let meRes: Response;
  try {
    meRes = await fetch(meUrl, {
      headers: {
        Cookie: `SCSE_ID=${scseId}`,
        "User-Agent": "frontend-oauth",
      },
    });
  } catch {
    return NextResponse.json({ error: "invalid_grant" }, { status: 401 });
  }

  if (!meRes.ok) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 401 });
  }

  let me: { value?: { email?: string; name?: string } };
  try {
    me = (await meRes.json()) as typeof me;
  } catch {
    me = {};
  }

  const user = {
    email: me.value?.email,
    name: me.value?.name,
  };

  // Consent gate: for any interactive flow (including magic) when the
  // user hasn't already granted. Consent identity (email) is only known here
  // (from /v1/auth/me), so we redirect to the React consent page, which reads
  // the re-stored state (with email) and renders the UI.
  if (!stateData.consented && user.email) {
    // OAUTH_CONSENT_ALWAYS forces the consent screen on every interactive flow
    // (skip the persisted-grant shortcut) — dev/testing only. The consented
    // marker (set by the consent POST handler) still lets the flow complete.
    const granted = env.OAUTH_CONSENT_ALWAYS
      ? false
      : await hasConsent(stateData.client_id, user.email);
    if (!granted) {
      // Re-store state with email so the consent page can display and the
      // consent POST handler can record consent (state was consumed above).
      await setWithTTL(
        oauthKeys.state(state),
        { ...stateData, email: user.email },
        600,
      );
      const issuer = env.OAUTH_ISSUER ?? new URL(req.url).origin;
      const base = issuer.replace(/\/$/, "");
      return NextResponse.redirect(
        `${base}/oauth/consent?state=${encodeURIComponent(state)}`,
        302,
      );
    }
  }

  // Determine iss and scseExp; try to decode JWT payload
  let iss: "entra" | "searchpoint" = "searchpoint";
  let scseExp = Math.floor(Date.now() / 1000) + 3600;

  try {
    const parts = scseId.split(".");
    if (parts.length === 3) {
      const payloadB64 = parts[1];
      // base64url decode
      const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
      const payload = JSON.parse(json) as {
        iss?: string;
        exp?: number;
        email?: string;
        preferred_username?: string;
      };
      if (typeof payload.exp === "number") scseExp = payload.exp;
      if (payload.iss === "entra" || payload.iss === "searchpoint") {
        iss = payload.iss;
      } else if (payload.iss && payload.iss.includes("entra")) {
        iss = "entra";
      }
    }
  } catch {
    // keep defaults
  }

  const code = generateToken();

  await setWithTTL(
    oauthKeys.code(code),
    {
      scseId,
      scseExp,
      user,
      client_id: stateData.client_id,
      redirect_uri: stateData.redirect_uri,
      code_challenge: stateData.code_challenge,
      scope: stateData.scope,
      resource: stateData.resource,
      iss,
    },
    600,
  );

  const redirect = new URL(stateData.redirect_uri);
  redirect.searchParams.set("code", code);
  redirect.searchParams.set("state", state);

  await setWithTTL(
    oauthKeys.magicPending(state),
    { status: "done", redirect: redirect.toString() },
    900,
  );

  return NextResponse.redirect(redirect.toString(), 302);
}
