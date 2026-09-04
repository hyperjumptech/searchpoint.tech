import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { handleMcpRequest } from "@/lib/mcp-protocol";
import { deriveIssuer } from "@/lib/oauth";
import { clientIpFromRequest, limiterForScope } from "@/lib/rate-limit";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

export async function POST(req: Request) {
  const limiter = limiterForScope("oauth");
  const rl = await limiter.consume(clientIpFromRequest(req));
  if (!rl.success)
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );

  const at = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const issuer = (env.OAUTH_ISSUER ?? deriveIssuer(req)).replace(/\/$/, "");
  const challenge = (reason: string) =>
    new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="${reason}", resource_metadata="${issuer}/.well-known/oauth-protected-resource"`,
      },
    });

  if (!at) return challenge("invalid_request");
  const data = await getJSON<{
    scseId: string;
    scseExp: number;
    user: unknown;
    client_id: string;
    scope: string;
    resource?: string;
  }>(oauthKeys.at(at));
  if (
    !data ||
    !data.scseId ||
    typeof data.scseExp !== "number" ||
    data.scseExp < Math.floor(Date.now() / 1000)
  )
    return challenge("invalid_token");

  const raw = await req.text();
  let outcome;
  try {
    outcome = await handleMcpRequest(raw, data.scseId);
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: "Internal error" },
    });
  }
  if (outcome.body === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(outcome.body, { status: outcome.httpStatus });
}

// MCP Streamable HTTP: server without SSE support MUST answer GET with 405.
// Clients health-check with POST initialize, not GET.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
