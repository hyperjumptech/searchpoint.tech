import { NextResponse } from "next/server";

import { calcTTL, generateToken, pkceVerify } from "@/lib/oauth";
import { verifyStaticClientSecret } from "@/lib/oauth-static-client";
import { getStaticClient } from "@/lib/oauth-static-client";
import { oauthKeys, setWithTTL, takeJSON } from "@/lib/oauth-valkey";
import { clientIpFromRequest, limiterForScope } from "@/lib/rate-limit";

type CodeData = {
  scseId: string;
  scseExp: number;
  user: unknown;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource?: string;
  credentialVersion: number;
  iss: "entra" | "searchpoint";
};

type RtData = {
  scseId: string;
  scseExp: number;
  user: unknown;
  client_id: string;
  scope: string;
  resource?: string;
  credentialVersion: number;
};

export async function POST(req: Request) {
  // Rate limit 60/min per IP via Valkey or in-memory
  const ip = clientIpFromRequest(req);
  const limiter = limiterForScope("oauth");
  const rl = await limiter.consume(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  const form = await req.text();
  const p = new URLSearchParams(form);
  const grant = p.get("grant_type");

  // client auth: prefer Basic, fallback to body
  let client_id = p.get("client_id");
  let client_secret = p.get("client_secret");
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const dec = Buffer.from(auth.slice(6), "base64").toString();
      const idx = dec.indexOf(":");
      if (idx === -1) {
        client_id = dec;
        client_secret = "";
      } else {
        client_id = dec.slice(0, idx);
        client_secret = dec.slice(idx + 1);
      }
    } catch {
      // ignore decode errors, will fail client_id check below
    }
  }

  if (!client_id) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  let client;
  try {
    client = client_id ? await getStaticClient(client_id) : null;
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503 },
    );
  }
  if (!client) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
  let secretOk = false;
  try {
    secretOk = Boolean(
      client_secret &&
      (await verifyStaticClientSecret(client_id, client_secret)),
    );
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503 },
    );
  }
  if (!client.enabled || client.revoked || !secretOk)
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });

  if (grant === "authorization_code") {
    const code = p.get("code");
    const verifier = p.get("code_verifier");
    const redirect_uri = p.get("redirect_uri");
    if (!code || !verifier || !redirect_uri) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    // Consume the code atomically first: replay or a failed PKCE burns it.
    const data = await takeJSON<CodeData>(oauthKeys.code(code));
    if (!data) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (data.client_id !== client_id) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if ((data.credentialVersion ?? 1) !== client.credentialVersion)
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    if (!pkceVerify(verifier, data.code_challenge)) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (redirect_uri !== data.redirect_uri) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }

    const { atTtl, rtTtl } = calcTTL(data.iss, data.scseExp);
    const at = generateToken();
    await setWithTTL(
      oauthKeys.at(at),
      {
        scseId: data.scseId,
        scseExp: data.scseExp,
        user: data.user,
        client_id: data.client_id,
        scope: data.scope,
        resource: data.resource,
        credentialVersion: client.credentialVersion,
      },
      atTtl,
    );

    let rt: string | undefined;
    if (data.iss === "searchpoint" && rtTtl) {
      rt = generateToken();
      await setWithTTL(
        oauthKeys.rt(rt),
        {
          scseId: data.scseId,
          scseExp: data.scseExp,
          user: data.user,
          client_id: data.client_id,
          scope: data.scope,
          credentialVersion: client.credentialVersion,
        },
        rtTtl,
      );
    }

    return NextResponse.json({
      access_token: at,
      token_type: "Bearer",
      expires_in: atTtl,
      ...(rt ? { refresh_token: rt } : {}),
      scope: data.scope,
    });
  }

  if (grant === "refresh_token") {
    const rt = p.get("refresh_token");
    if (!rt) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const data = await takeJSON<RtData>(oauthKeys.rt(rt));
    if (!data) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (data.client_id !== client_id) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    if ((data.credentialVersion ?? 1) !== client.credentialVersion)
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    if (data.scseExp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    const { atTtl } = calcTTL("searchpoint", data.scseExp);
    const at = generateToken();
    await setWithTTL(
      oauthKeys.at(at),
      {
        scseId: data.scseId,
        scseExp: data.scseExp,
        user: data.user,
        client_id: data.client_id,
        scope: data.scope,
        resource: data.resource,
        credentialVersion: client.credentialVersion,
      },
      atTtl,
    );
    return NextResponse.json({
      access_token: at,
      token_type: "Bearer",
      expires_in: atTtl,
      scope: data.scope,
    });
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400 },
  );
}
