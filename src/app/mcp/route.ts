import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { handleMcpRequest } from "@/lib/mcp-protocol";
import { deriveIssuer } from "@/lib/oauth";
import { clientIpFromRequest, limiterForScope } from "@/lib/rate-limit";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

const ALLOWED_KINDS = new Set(["video", "document", "image"] as const);
export type McpKind = "video" | "document" | "image";

function parseKind(
  req: Request,
):
  | { kind: McpKind | undefined }
  | { error: ReturnType<typeof NextResponse.json> } {
  const raw = new URL(req.url).searchParams.get("kind");
  if (raw === null || raw === "") return { kind: undefined };
  if (!ALLOWED_KINDS.has(raw as McpKind)) {
    return {
      error: NextResponse.json(
        {
          error: "invalid_kind",
          message: `kind must be one of video, document, image`,
          received: raw,
        },
        { status: 400 },
      ),
    };
  }
  return { kind: raw as McpKind };
}

function parseAuthor(req: Request): string | undefined {
  const raw = new URL(req.url).searchParams.get("author");
  if (raw === null) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  return trimmed;
}

const EXT_RE = /^[a-z0-9]{1,10}$/;

function parseType(
  req: Request,
):
  | { type: string[] | undefined }
  | { error: ReturnType<typeof NextResponse.json> } {
  const url = new URL(req.url);
  const keys = ["type", "extension", "types", "ext"];
  const collected: string[] = [];
  for (const key of keys) {
    const all = url.searchParams.getAll(key);
    for (const raw of all) {
      // support comma-separated: ?type=pdf,docx or ?type=pdf&type=docx
      for (const part of raw.split(",")) {
        const trimmed = part.toLowerCase().trim();
        if (trimmed === "") continue;
        collected.push(trimmed);
      }
    }
  }
  if (collected.length === 0) return { type: undefined };
  // validate each non-wildcard
  const invalid = collected.filter((e) => e !== "*" && !EXT_RE.test(e));
  if (invalid.length) {
    return {
      error: NextResponse.json(
        {
          error: "invalid_type",
          message: `type must be alphanumeric 1-10 chars (or "*")`,
          received: invalid,
        },
        { status: 400 },
      ),
    };
  }
  // dedupe while preserving order, keep "*" as sentinel for "all" handled later
  return { type: collected };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/;

function isValidIsoDate(v: string): boolean {
  return ISO_DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
}

function parseDate(
  req: Request,
  keys: string[],
):
  | { value: string | undefined }
  | { error: ReturnType<typeof NextResponse.json> } {
  for (const key of keys) {
    const raw = new URL(req.url).searchParams.get(key);
    if (raw === null) continue;
    const trimmed = raw.trim();
    if (trimmed === "") return { value: undefined };
    if (!isValidIsoDate(trimmed)) {
      return {
        error: NextResponse.json(
          {
            error: "invalid_date",
            message: `Invalid date for ${key}, expected YYYY-MM-DD or 2023-01-01T00:00:00Z`,
            received: raw,
            key,
          },
          { status: 400 },
        ),
      };
    }
    return { value: trimmed };
  }
  return { value: undefined };
}

function parseQuery(req: Request):
  | {
      kind: McpKind | undefined;
      author: string | undefined;
      updated_after: string | undefined;
      updated_before: string | undefined;
      type: string[] | undefined;
    }
  | { error: ReturnType<typeof NextResponse.json> } {
  const k = parseKind(req);
  if ("error" in k) return k;
  const author = parseAuthor(req);
  const t = parseType(req);
  if ("error" in t) return t;

  const gteKeys = [
    "updated_after",
    "updated_at_gte",
    "date_gte",
    "gte",
    "from",
    "date_from",
  ];
  const lteKeys = [
    "updated_before",
    "updated_at_lte",
    "date_lte",
    "lte",
    "to",
    "date_to",
  ];

  const gteRes = parseDate(req, gteKeys);
  if ("error" in gteRes) return gteRes;
  const lteRes = parseDate(req, lteKeys);
  if ("error" in lteRes) return lteRes;

  return {
    kind: k.kind,
    author,
    updated_after: gteRes.value,
    updated_before: lteRes.value,
    type: t.type,
  };
}

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

  const parsedQuery = parseQuery(req);
  if ("error" in parsedQuery) return parsedQuery.error;

  const raw = await req.text();
  let outcome;
  try {
    outcome = await handleMcpRequest(raw, data.scseId, {
      kind: parsedQuery.kind,
      author: parsedQuery.author,
      updated_after: parsedQuery.updated_after,
      updated_before: parsedQuery.updated_before,
      type: parsedQuery.type,
    });
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
