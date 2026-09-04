import { NextResponse } from "next/server";

import { timingSafeEqualStr } from "@/lib/oauth";
import { hashSecret } from "@/lib/oauth-dcr";
import { resolveClient } from "@/lib/oauth-dcr-store";
import { delKey, oauthKeys } from "@/lib/oauth-valkey";

export async function POST(req: Request) {
  const p = new URLSearchParams(await req.text());

  // client auth: prefer Basic, fallback to body (same pattern as /token)
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

  const client = await resolveClient(client_id ?? "");
  if (!client) {
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

  const token = p.get("token");
  if (token) {
    await delKey(oauthKeys.at(token));
    await delKey(oauthKeys.rt(token));
  }
  return new NextResponse(null, { status: 200 });
}
