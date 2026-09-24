// src/lib/mcp-tools.ts
import { z } from "zod";

import { env } from "@/lib/env";
import { sharedToolDefs } from "@/lib/mcp-contract";

export type ToolOutcome =
  | { status: "ok"; text: string }
  | { status: "isError"; text: string }
  | { status: "unknownTool" }
  | { status: "invalidParams"; message: string };

const EXT_RE = /^[a-z0-9]{1,10}$/;
const BACKEND_TIMEOUT_MS = 15_000;

const KINDS = ["video", "document", "image"] as const;
export type Kind = (typeof KINDS)[number];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/;
const dateStringSchema = z
  .string()
  .refine(
    (v) => v === "" || (ISO_DATE_RE.test(v) && !Number.isNaN(Date.parse(v))),
    {
      message: "Invalid date, expected YYYY-MM-DD or 2023-01-01T00:00:00Z",
    },
  );

const SOURCES = [
  "shared folder",
  "apple notes",
  "onedrive",
  "onedrive-business",
  "onedrive-personal",
  "sharepoint",
  "teams",
  "unknown",
] as const;

const searchSchema = z
  .object({
    search: z
      .string()
      .min(1)
      .describe("Full-text query. This parameter is required."),
    type: z
      .array(z.string())
      .optional()
      .describe(
        "Optional filter by type/extension without dot (e.g. pdf, docx). Empty values are ignored. Do NOT send ['*'] — omit for all types. Tool param is `type`, backend filter key is `extension`.",
      ),
    kind: z
      .enum(KINDS)
      .optional()
      .describe(
        "Filter by kind (video/document/image). Only include if user explicitly mentions a kind. Omit for all kinds.",
      ),
    author: z
      .string()
      .trim()
      .optional()
      .describe(
        "Optional filter by author (free text, e.g. 'satriyo' or 'satriyo@hyperjump.tech'). Empty values are ignored. Maps to backend `created_by`.",
      ),
    updated_after: dateStringSchema
      .optional()
      .describe(
        "Filter updated_at gte (e.g. 2023-01-01T00:00:00Z or 2023-01-01). Only include if user explicitly mentions a start date.",
      ),
    updated_before: dateStringSchema
      .optional()
      .describe(
        "Filter updated_at lte (e.g. 2023-01-01T00:00:00Z or 2023-01-01). Only include if user explicitly mentions an end date.",
      ),
    source: z
      .enum(SOURCES)
      .optional()
      .describe(
        "Filter by source (shared folder/onedrive/sharepoint/teams/apple notes). Only include if user explicitly mentions a source. Omit for minimal search — do NOT default to 'unknown'.",
      ),
    mode: z
      .enum(["broad", "exact"])
      .optional()
      .describe("Search mode: broad (default, typo-tolerant) or exact."),
    page: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Page number starting at 1. Converted to offset=(page-1)*limit. Omit for first page.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results, default 10."),
  })
  .strict();

const getSchema = z.object({ id: z.string().min(1) }).strict();

function invalidParams(error: z.ZodError): ToolOutcome {
  const issue = error.issues[0];
  const path = issue?.path.join(".");
  return {
    status: "invalidParams",
    message: path
      ? `${path}: ${issue.message}`
      : (issue?.message ?? "Invalid parameters"),
  };
}

async function backendFetch(
  url: URL,
  scseId: string,
): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: "GET",
      headers: { Cookie: `SCSE_ID=${scseId}`, "User-Agent": "frontend-mcp" },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

async function execSearchFile(
  args: unknown,
  scseId: string,
): Promise<ToolOutcome> {
  void scseId; // owner scoping is automatic via SCSE_ID cookie (allow_list server-side)
  const parsed = searchSchema.safeParse(args);
  if (!parsed.success) return invalidParams(parsed.error);
  const a = parsed.data;

  const rawType = a.type ?? [];
  const extAll = rawType.map((e) => e.toLowerCase().trim());
  const ext = extAll.filter((e) => e !== "*" && e !== "");
  if (
    rawType.length &&
    extAll.some((e) => e !== "*" && e !== "" && !EXT_RE.test(e))
  )
    return { status: "invalidParams", message: "type: invalid type" };

  // Minimal filter: type (maps to backend `extension`) + kind + author + source + date. Owner is implicit via SCSE_ID.
  const parts: string[] = [];
  if (ext.length === 1) parts.push(`extension eq '${ext[0]}'`);
  else if (ext.length > 1)
    parts.push(`extension in (${ext.map((e) => `'${e}'`).join(",")})`);
  if (a.kind) parts.push(`kind eq '${a.kind}'`);
  if (a.author) {
    const author = a.author.trim();
    if (author) parts.push(`created_by eq '${author.replace(/'/g, "''")}'`);
  }
  // source=unknown is backend placeholder — never filter on it for minimal search
  if (a.source && a.source !== "unknown") parts.push(`source eq '${a.source}'`);
  const gte = a.updated_after;
  const lte = a.updated_before;
  if (gte) parts.push(`updated_at gte '${gte}'`);
  if (lte) parts.push(`updated_at lte '${lte}'`);

  const url = new URL("/v1/files", env.BACKEND_BASE_URL);
  if (a.search) url.searchParams.set("search", a.search);
  if (parts.length) url.searchParams.set("filter", parts.join(" and "));
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("mode", a.mode ?? "broad");
  // page is 1-based → offset; limit default 10
  const limit = a.limit ?? 10;
  const page = a.page ?? 1;
  const offset = (page - 1) * limit;
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await backendFetch(url, scseId);
  if (!res) return { status: "isError", text: "Backend unavailable." };
  if (res.status === 200) return { status: "ok", text: await res.text() };
  if (res.status === 401)
    return {
      status: "isError",
      text: "Session expired — please re-authenticate.",
    };
  if (res.status === 400) return { status: "isError", text: await res.text() };
  return { status: "isError", text: `Backend error (${res.status})` };
}

async function execGetFile(
  args: unknown,
  scseId: string,
): Promise<ToolOutcome> {
  const parsed = getSchema.safeParse(args);
  if (!parsed.success) return invalidParams(parsed.error);

  // _source.id from search is already URL-encoded when the path contains
  // reserved characters (e.g. shared%2Fiseng%2Ffile.pdf). Pass those through
  // so %2F is not encoded again as %252F. Fresh ids still need encoding for
  // spaces, but @ must stay literal: encodeURIComponent turns it into %40,
  // chi keeps that in the route param, and the stored document id uses @.
  const rawId = parsed.data.id;
  const encodedId = rawId.includes("%")
    ? rawId
    : encodeURIComponent(rawId).replaceAll("%40", "@");
  const url = new URL(`/v1/files/${encodedId}`, env.BACKEND_BASE_URL);
  const res = await backendFetch(url, scseId);
  if (!res) return { status: "isError", text: "Backend unavailable." };
  if (res.status === 200) return { status: "ok", text: await res.text() };
  if (res.status === 401)
    return {
      status: "isError",
      text: "Session expired — please re-authenticate.",
    };
  if (res.status === 404)
    return {
      status: "isError",
      text: "File not found or you do not have access.",
    };
  return { status: "isError", text: `Backend error (${res.status})` };
}

type ToolDef = {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: unknown, scseId: string) => Promise<ToolOutcome>;
};

const TOOL_EXECUTORS: Record<
  string,
  (args: unknown, scseId: string) => Promise<ToolOutcome>
> = {
  search_file: execSearchFile,
  get_file: execGetFile,
};

export const MCP_TOOLS: ToolDef[] = sharedToolDefs().map((def) => ({
  ...def,
  execute: TOOL_EXECUTORS[def.name],
}));

export function toolsList(): Array<{
  name: string;
  description: string;
  inputSchema: object;
}> {
  return sharedToolDefs();
}

export async function callTool(
  name: string,
  args: unknown,
  scseId: string,
): Promise<ToolOutcome> {
  const tool = MCP_TOOLS.find((t) => t.name === name);
  if (!tool) return { status: "unknownTool" };
  return tool.execute(args, scseId);
}
