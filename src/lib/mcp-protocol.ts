// src/lib/mcp-protocol.ts
import { callTool, toolsList } from "@/lib/mcp-tools";

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST_PROTOCOL_VERSION = "2025-06-18";
const SERVER_NAME = "searchpoint-mcp";
const SERVER_VERSION = "0.1.0";

type Json = Record<string, unknown>;

export type McpOutcome =
  | { httpStatus: 200; body: Json }
  | { httpStatus: 202; body: null };

function rpcError(id: unknown, code: number, message: string): Json {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function rpcResult(id: unknown, result: unknown): Json {
  return { jsonrpc: "2.0", id, result };
}

export async function handleMcpRequest(
  raw: string,
  scseId: string,
  opts?: {
    kind?: string;
    author?: string;
    updated_after?: string;
    updated_before?: string;
    type?: string[];
  },
): Promise<McpOutcome> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { httpStatus: 200, body: rpcError(null, -32700, "Parse error") };
  }

  if (
    Array.isArray(parsed) ||
    parsed === null ||
    typeof parsed !== "object" ||
    (parsed as Json).jsonrpc !== "2.0" ||
    typeof (parsed as Json).method !== "string"
  ) {
    const id =
      !Array.isArray(parsed) &&
      parsed !== null &&
      typeof parsed === "object" &&
      "id" in (parsed as Json)
        ? (parsed as Json).id
        : null;
    return { httpStatus: 200, body: rpcError(id, -32600, "Invalid Request") };
  }

  const msg = parsed as Json;
  const method = msg.method as string;
  // Notification (no id) — including notifications/initialized: nothing to answer.
  if (!("id" in msg)) return { httpStatus: 202, body: null };
  const id = msg.id;

  switch (method) {
    case "initialize": {
      const requested = (msg.params as Json | undefined)?.protocolVersion;
      const version =
        typeof requested === "string" &&
        SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : LATEST_PROTOCOL_VERSION;
      return {
        httpStatus: 200,
        body: rpcResult(id, {
          protocolVersion: version,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        }),
      };
    }
    case "ping":
      return { httpStatus: 200, body: rpcResult(id, {}) };
    case "tools/list":
      return { httpStatus: 200, body: rpcResult(id, { tools: toolsList() }) };
    case "tools/call": {
      const params = (msg.params ?? {}) as Json;
      const name = typeof params.name === "string" ? params.name : "";
      try {
        // Merge optional kind/author/date/type from query into search_file args if not already set
        let args: unknown = params.arguments;
        const hasDateOpts = Boolean(
          opts?.updated_after || opts?.updated_before,
        );
        const hasTypeOpts = Boolean(opts?.type && opts.type.length);
        if (
          name === "search_file" &&
          (opts?.kind || opts?.author || hasDateOpts || hasTypeOpts)
        ) {
          if (args && typeof args === "object" && !Array.isArray(args)) {
            const rec = args as Record<string, unknown>;
            const patch: Record<string, unknown> = {};
            if (opts?.kind && rec.kind === undefined) patch.kind = opts.kind;
            if (opts?.author && rec.author === undefined)
              patch.author = opts.author;
            if (
              opts?.type &&
              rec.type === undefined &&
              rec.extension === undefined
            )
              patch.type = opts.type;
            if (
              opts?.updated_after &&
              rec.updated_after === undefined &&
              rec.updated_at_gte === undefined &&
              rec.date_gte === undefined
            )
              patch.updated_after = opts.updated_after;
            if (
              opts?.updated_before &&
              rec.updated_before === undefined &&
              rec.updated_at_lte === undefined &&
              rec.date_lte === undefined
            )
              patch.updated_before = opts.updated_before;
            if (Object.keys(patch).length) args = { ...rec, ...patch };
          } else if (args === undefined || args === null) {
            const patch: Record<string, unknown> = {};
            if (opts?.kind) patch.kind = opts.kind;
            if (opts?.author) patch.author = opts.author;
            if (opts?.type) patch.type = opts.type;
            if (opts?.updated_after) patch.updated_after = opts.updated_after;
            if (opts?.updated_before)
              patch.updated_before = opts.updated_before;
            if (Object.keys(patch).length) args = patch;
          } else if (typeof args === "object" && Array.isArray(args)) {
            // no-op: invalid args shape will be rejected by zod
          } else {
            // primitive args: wrap with patch if needed (will still fail zod cleanly)
          }
        }
        const outcome = await callTool(name, args, scseId);
        if (outcome.status === "unknownTool")
          return {
            httpStatus: 200,
            body: rpcError(id, -32602, `Unknown tool: ${name}`),
          };
        if (outcome.status === "invalidParams")
          return {
            httpStatus: 200,
            body: rpcError(id, -32602, outcome.message),
          };
        return {
          httpStatus: 200,
          body: rpcResult(id, {
            content: [{ type: "text", text: outcome.text }],
            isError: outcome.status === "isError",
          }),
        };
      } catch {
        return {
          httpStatus: 200,
          body: rpcError(id, -32603, "Internal error"),
        };
      }
    }
    default:
      return {
        httpStatus: 200,
        body: rpcError(id, -32601, "Method not found"),
      };
  }
}
