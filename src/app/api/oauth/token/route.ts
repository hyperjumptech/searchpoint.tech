import { NextResponse } from "next/server";

import {
  calcTTL,
  generateToken,
  pkceVerify,
  timingSafeEqualStr,
} from "@/lib/oauth";
import { hashSecret } from "@/lib/oauth-dcr";
import { resolveClient } from "@/lib/oauth-dcr-store";
import { getJSON, oauthKeys, setWithTTL, takeJSON } from "@/lib/oauth-valkey";
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
  iss: "entra" | "searchpoint";
};

type RtData = {
  scseId: string;
  scseExp: number;
  user: unknown;
  client_id: string;
  scope: string;
  resource?: string;
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

  // Public clients (PKCE, e.g. oh-my-pi) may not send client_id at token time.
  // Fall back to the client_id stored in the code / refresh token.
  if (!client_id) {
    if (grant === "authorization_code") {
      const codeParam = p.get("code");
      if (codeParam) {
        try {
          const peek = await getJSON<CodeData>(oauthKeys.code(codeParam));
          if (peek?.client_id) client_id = peek.client_id;
        } catch {}
      }
    } else if (grant === "refresh_token") {
      const rtParam = p.get("refresh_token");
      if (rtParam) {
        try {
          const peek = await getJSON<RtData>(oauthKeys.rt(rtParam));
          if (peek?.client_id) client_id = peek.client_id;
        } catch {}
      }
    }
  }

  let client = client_id ? await resolveClient(client_id) : null;
  if (!client && client_id) {
    // Fallback for synthetic public clients (e.g. oh-my-pi magic flow with no prior DCR)
    // where client_id is the registration token.
    const { resolveRegisteredToken } = await import("@/lib/oauth-dcr");
    const reg = resolveRegisteredToken(client_id);
    if (reg) {
      client = {
        id: reg.token,
        redirectUris: [reg.redirectUri],
        scope: "openid profile email search magic",
        tokenEndpointAuthMethod: "none",
      } as unknown as NonNullable<Awaited<ReturnType<typeof resolveClient>>>;
    }
  }
  if (!client) {
    console.log("[token] invalid_client final", { client_id });
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
  if (client.tokenEndpointAuthMethod !== "none") {
    const secretOk =
      client.secretHash &&
      timingSafeEqualStr(hashSecret(client_secret ?? ""), client.secretHash);
    if (!secretOk) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }
  }

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
