import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { deriveIssuer } from "@/lib/oauth";

export async function GET(req: Request) {
  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req);
  const base = issuer.replace(/\/$/, "");
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    revocation_endpoint: `${base}/api/oauth/revoke`,
    userinfo_endpoint: `${base}/api/oauth/userinfo`,
    jwks_uri: `${base}/.well-known/jwks.json`,
    registration_endpoint: `${base}/api/oauth/register`,
    scopes_supported: ["openid", "profile", "email", "search", "magic"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    revocation_endpoint_auth_methods_supported: ["client_secret_basic"],
  });
}
