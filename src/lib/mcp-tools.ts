// src/lib/mcp-tools.ts
import { z } from "zod";

import { env } from "@/lib/env";

export type ToolOutcome =
  | { status: "ok"; text: string }
  | { status: "isError"; text: string }
  | { status: "unknownTool" }
  | { status: "invalidParams"; message: string };

const EXT_RE = /^[a-z0-9]{1,10}$/;
const BACKEND_TIMEOUT_MS = 15_000;

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

const searchSchema = z.object({
  search: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Full-text query. Minimal search: only send this. Omit for filter-only browse. Backend requires search OR filter, else returns [].",
    ),
  extension: z
    .array(z.string().min(1))
    .optional()
    .describe(
      "Filter by extension without dot (e.g. pdf, docx). Only include if user explicitly mentions an extension. Do NOT send ['*'] — omit for all extensions.",
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
});

const getSchema = z.object({ id: z.string().min(1) });

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

  // Normalize extension: ignore wildcard ["*"] (means all), drop empty/*, lowercase
  const rawExt = a.extension ?? [];
  const extAll = rawExt.map((e) => e.toLowerCase().trim());
  const ext = extAll.filter((e) => e !== "*" && e !== "");
  if (
    rawExt.length &&
    extAll.some((e) => e !== "*" && e !== "" && !EXT_RE.test(e))
  )
    return { status: "invalidParams", message: "extension: invalid extension" };

  // Minimal filter: only extension + source. Owner is implicit via SCSE_ID.
  const parts: string[] = [];
  if (ext.length)
    parts.push(`extension in (${ext.map((e) => `'${e}'`).join(",")})`);
  // source=unknown is backend placeholder — never filter on it for minimal search
  if (a.source && a.source !== "unknown") parts.push(`source eq '${a.source}'`);

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

  // _source.id from search is already URL-encoded (e.g. shared%2Fiseng%2Ffile.pdf).
  // It contains %2F for slashes and literal @. new URL() preserves existing % encodings,
  // so pass it raw to avoid double-encoding %2F → %252F. Only encode ids that have
  // no existing % encodings (e.g. "d 1" → "d%201").
  const rawId = parsed.data.id;
  const encodedId = rawId.includes("%") ? rawId : encodeURIComponent(rawId);
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

const searchFileTool: ToolDef = {
  name: "search_file",
  description:
    "Search the user's documents. Minimal: only send {search:'q3'} — owner is implicit via SCSE_ID cookie, no need to send owner_email. Backend needs search OR filter, else []. Optional filters: extension (e.g. ['pdf']), source (shared folder/onedrive/sharepoint/teams/apple notes), mode (broad/exact). Pagination via page (1-based) + limit (default 10). Omit extension ['*'] and source unknown — they mean 'all' and are ignored. Returns JSON hits under value[]._source (use _source.id with get_file) and pagination under meta.pagination.",
  inputSchema: z.toJSONSchema(searchSchema),
  execute: execSearchFile,
};

const getFileTool: ToolDef = {
  name: "get_file",
  description:
    "Get full metadata for one document by ID. Use an `id` from search_file results. Returns a not-found error if the file does not exist or you lack access.",
  inputSchema: z.toJSONSchema(getSchema),
  execute: execGetFile,
};

export const MCP_TOOLS: ToolDef[] = [searchFileTool, getFileTool];

export function toolsList(): Array<{
  name: string;
  description: string;
  inputSchema: object;
}> {
  return MCP_TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
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
