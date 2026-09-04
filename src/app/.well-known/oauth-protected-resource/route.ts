import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { deriveIssuer } from "@/lib/oauth";

export async function GET(req: Request) {
  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req);
  const base = issuer.replace(/\/$/, "");
  const resource = env.MCP_RESOURCE_URL ?? `${base}/mcp`;
  return NextResponse.json({
    resource,
    authorization_servers: [base],
    scopes_supported: ["openid", "search"],
    bearer_methods_supported: ["header"],
  });
}
