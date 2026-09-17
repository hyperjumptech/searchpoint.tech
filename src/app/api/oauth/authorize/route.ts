import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { deriveIssuer } from "@/lib/oauth";
import { getStaticClient } from "@/lib/oauth-static-client";
import { oauthKeys, setWithTTL } from "@/lib/oauth-valkey";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const client_id = url.searchParams.get("client_id");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const response_type = url.searchParams.get("response_type");
  const code_challenge = url.searchParams.get("code_challenge");
  const code_challenge_method = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") ?? "search";
  const resource = url.searchParams.get("resource");

  if (response_type !== "code")
    return NextResponse.json(
      { error: "unsupported_response_type" },
      { status: 400 },
    );
  if (!code_challenge || code_challenge_method !== "S256")
    return NextResponse.json(
      { error: "invalid_request", error_description: "S256 required" },
      { status: 400 },
    );
  if (!state)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  // Loopback http allowed for local MCP clients (RFC 8252 native-app convention).
  let loopbackHttp = false;
  if (redirect_uri?.startsWith("http://")) {
    try {
      loopbackHttp = ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(redirect_uri).hostname,
      );
    } catch {
      loopbackHttp = false;
    }
  }
  if (
    !redirect_uri ||
    redirect_uri.includes("#") ||
    !(redirect_uri.startsWith("https://") || loopbackHttp)
  )
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if (!client_id || !redirect_uri)
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  let client;
  try {
    client = await getStaticClient(client_id);
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503 },
    );
  }
  if (!client || !client.enabled || client.revoked)
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  if (client.redirectUri !== redirect_uri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri not allowed",
      },
      { status: 400 },
    );
  }

  const requestedScope = scope.split(/[\s,]+/).filter(Boolean);
  const allowedScope = client.scopes;
  if (requestedScope.some((s) => !allowedScope.includes(s))) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req);
  const base = issuer.replace(/\/$/, "");
  // use trimmed base for callback origin to avoid double slash; store original redirect_uri as-is
  const issuerForCallback = base;

  const isMagic =
    url.searchParams.get("idp") === "magic" || scope.includes("magic");

  await setWithTTL(
    oauthKeys.state(state),
    {
      client_id,
      client_name: client.name,
      redirect_uri,
      code_challenge,
      scope,
      resource,
      magic: isMagic || undefined,
      createdAt: Date.now(),
      credentialVersion: client.credentialVersion,
    },
    600,
  );

  // If magic requested, redirect to React magic UI (same layout as consent).
  // If user is already authenticated (valid SCSE_ID cookie), skip the magic
  // email form and go directly to the callback — same as Entra's "already
  // logged in" fast-path.
  if (isMagic) {
    const rawCookie = req.headers.get("cookie") ?? "";
    let scseId: string | null = null;
    const m = rawCookie.match(/SCSE_ID=([^;]+)/);
    if (m) {
      try {
        scseId = decodeURIComponent(m[1]);
      } catch {
        scseId = m[1];
      }
    }
    if (scseId) {
      try {
        const backendBase =
          env.BACKEND_BASE_URL ?? "https://api.searchpoint.hyperjump.tech";
        const meRes = await fetch(new URL("/v1/auth/me", backendBase), {
          headers: {
            Cookie: `SCSE_ID=${scseId}`,
            "User-Agent": "frontend-oauth",
          },
        });
        if (meRes.ok) {
          const callbackUrl = `${issuerForCallback}/api/oauth/callback?state=${encodeURIComponent(state)}`;
          return NextResponse.redirect(callbackUrl, 302);
        }
      } catch {
        // fall through to magic UI
      }
    }
    const magicUi = new URL("/oauth/magic", issuerForCallback);
    magicUi.searchParams.set("state", state);
    return NextResponse.redirect(magicUi.toString(), 302);
  }

  const returnTo = `${issuerForCallback}/api/oauth/callback?state=${encodeURIComponent(state)}`;
  const entraUrl = new URL("/v1/auth/", env.AUTH_BASE_URL);
  entraUrl.searchParams.set("return_to", returnTo);
  return NextResponse.redirect(entraUrl.toString(), 302);
}
