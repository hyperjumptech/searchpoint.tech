// src/lib/mcp-protocol.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

const { mockCallTool } = vi.hoisted(() => ({
  mockCallTool: vi.fn(),
}));

vi.mock("@/lib/mcp-tools", () => ({
  toolsList: () => [
    { name: "search_file", description: "d", inputSchema: { type: "object" } },
    { name: "get_file", description: "d", inputSchema: { type: "object" } },
  ],
  callTool: mockCallTool,
}));

import { handleMcpRequest } from "@/lib/mcp-protocol";

// All tests authenticate as this SCSE session id (passed through to callTool).
// All tests target request/response (200) flows, never 202 notifications —
// narrow the union here so `res.body` accesses typecheck.
const handle = async (raw: string) => {
  const r = await handleMcpRequest(raw, "scse-9");
  if (r.body === null) throw new Error("unexpected notification");
  return r;
};

afterEach(() => {
  mockCallTool.mockReset();
});

describe("handleMcpRequest", () => {
  it("initialize echoes a supported protocolVersion", async () => {
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26" },
      }),
    );
    expect(res.httpStatus).toBe(200);
    expect(res.body).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "searchpoint-mcp", version: "0.1.0" },
      },
    });
  });

  it("initialize falls back to latest for unknown versions", async () => {
    for (const params of [{ protocolVersion: "1999-01-01" }, {}, undefined]) {
      const res = await handle(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "abc",
          method: "initialize",
          params,
        }),
      );
      const result = res.body.result as Record<string, unknown>;
      expect(result.protocolVersion).toBe("2025-06-18");
    }
  });

  it("ping returns empty result", async () => {
    const res = await handle(
      JSON.stringify({ jsonrpc: "2.0", id: 7, method: "ping" }),
    );
    expect(res.body).toEqual({ jsonrpc: "2.0", id: 7, result: {} });
  });

  it("tools/list returns both tools", async () => {
    const res = await handle(
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    );
    const tools = (res.body.result as { tools: Array<{ name: string }> }).tools;
    expect(tools.map((t) => t.name)).toEqual(["search_file", "get_file"]);
  });

  it("tools/call ok path wraps text content with isError false", async () => {
    mockCallTool.mockResolvedValueOnce({
      status: "ok",
      text: '{"status":"ok"}',
    });
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_file", arguments: { id: "d1" } },
      }),
    );
    expect(mockCallTool).toHaveBeenCalledWith(
      "get_file",
      { id: "d1" },
      "scse-9",
    );
    expect(res.body.result).toEqual({
      content: [{ type: "text", text: '{"status":"ok"}' }],
      isError: false,
    });
  });

  it("tools/call isError path flags isError true", async () => {
    mockCallTool.mockResolvedValueOnce({
      status: "isError",
      text: "File not found or you do not have access.",
    });
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "get_file", arguments: { id: "x" } },
      }),
    );
    expect((res.body.result as { isError: boolean }).isError).toBe(true);
  });

  it("unknown tool name is a -32601 protocol error", async () => {
    mockCallTool.mockResolvedValueOnce({ status: "unknownTool" });
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "rm_rf", arguments: {} },
      }),
    );
    expect(res.body.error).toMatchObject({ code: -32601 });
    expect((res.body.error as { message: string }).message).toContain("rm_rf");
  });

  it("invalid params from tools surface as -32602", async () => {
    mockCallTool.mockResolvedValueOnce({
      status: "invalidParams",
      message: "id: required",
    });
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "get_file", arguments: {} },
      }),
    );
    expect(res.body.error).toMatchObject({
      code: -32602,
      message: "id: required",
    });
  });

  it("notifications (no id) return 202 with no body, even unknown ones", async () => {
    for (const method of [
      "notifications/initialized",
      "notifications/whatever",
    ]) {
      const res = await handleMcpRequest(
        JSON.stringify({ jsonrpc: "2.0", method }),
        "scse-9",
      );
      expect(res.httpStatus).toBe(202);
      expect(res.body).toBeNull();
    }
  });

  it("unknown request method is -32601 with id echoed", async () => {
    const res = await handle(
      JSON.stringify({ jsonrpc: "2.0", id: "x1", method: "resources/list" }),
    );
    expect(res.body.error).toMatchObject({ code: -32601 });
    expect(res.body.id).toBe("x1");
  });

  it("malformed JSON is -32700 with id null", async () => {
    const res = await handle("{not json");
    expect(res.body.error).toMatchObject({ code: -32700 });
    expect(res.body.id).toBeNull();
  });

  it("batch array and non-object bodies are -32600", async () => {
    const batch = await handle(
      JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }]),
    );
    expect(batch.body.error).toMatchObject({ code: -32600 });
    const scalar = await handle(JSON.stringify(42));
    expect(scalar.body.error).toMatchObject({ code: -32600 });
  });

  it("internal tool crash is -32603", async () => {
    mockCallTool.mockRejectedValueOnce(new Error("boom"));
    const res = await handle(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "get_file", arguments: { id: "d" } },
      }),
    );
    expect(res.body.error).toMatchObject({ code: -32603 });
  });
});
