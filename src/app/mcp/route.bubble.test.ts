// src/app/mcp/route.bubble.test.ts - combinatorial via query params
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetJSON, mockLimiterConsume } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(async () => null as unknown),
  mockLimiterConsume: vi.fn(async () => ({
    success: true,
    remaining: 59,
    retryAfterSeconds: 0,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  limiterForScope: () => ({ consume: mockLimiterConsume }),
  clientIpFromRequest: () => "1.2.3.4",
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: mockGetJSON,
  setWithTTL: vi.fn(async () => {}),
  delKey: vi.fn(async () => {}),
  getOAuthValkey: vi.fn(async () => null),
  oauthKeys: {
    state: (s: string) => `oauth:state:${s}`,
    code: (c: string) => `oauth:code:${c}`,
    at: (t: string) => `oauth:at:${t}`,
    rt: (t: string) => `oauth:rt:${t}`,
    magicPending: (s: string) => `oauth:magic:pending:${s}`,
  },
}));

import { POST } from "@/app/mcp/route";

function getFilter(url: URL) {
  return url.searchParams.get("filter");
}
function getSearch(url: URL) {
  return url.searchParams.get("search");
}

beforeEach(() => {
  mockGetJSON.mockResolvedValue({
    scseId: "scse-1",
    scseExp: Math.floor(Date.now() / 1000) + 3600,
    user: { email: "a@b.com", name: "Alice" },
    client_id: "searchpoint-mcp-static",
    scope: "openid",
  });
  mockLimiterConsume.mockResolvedValue({
    success: true,
    remaining: 59,
    retryAfterSeconds: 0,
  });
});

describe("POST /mcp query bubble sort combinatorial", () => {
  it("search doang via body, no query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "search_file", arguments: { search: "laporan" } },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const url = (fm.mock.calls[0] as unknown as [URL])[0];
    expect(getSearch(url)).toBe("laporan");
    expect(getFilter(url)).toBeNull();
  });

  it("search + kind via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request("https://example.com/mcp?kind=video", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "search_file", arguments: { search: "laporan" } },
      }),
    });
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'video'",
    );
  });

  it("search + kind + author via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=video&author=satriyo",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "laporan" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'video' and created_by eq 'satriyo'",
    );
  });

  it("search + kind + author + type via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=video&author=satriyo&type=pdf",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "laporan" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'video' and created_by eq 'satriyo'",
    );
  });

  it("search + kind + author + type + updated via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=video&author=satriyo&type=pdf&updated_after=2023-01-01T00:00:00Z",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "laporan" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'pdf' and kind eq 'video' and created_by eq 'satriyo' and updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + kind + author + type + updated gte+lte full via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=document&author=satriyo%40hyperjump.tech&type=pdf,docx&updated_after=2023-01-01T00:00:00Z&updated_before=2023-12-31T00:00:00Z",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "laporan" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension in ('pdf','docx') and kind eq 'document' and created_by eq 'satriyo@hyperjump.tech' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + author via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request("https://example.com/mcp?author=satriyo", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "search_file", arguments: { search: "hello" } },
      }),
    });
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'satriyo'",
    );
  });

  it("search + author + updated via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?author=satriyo&updated_after=2023-01-01T00:00:00Z&updated_before=2023-12-31T00:00:00Z",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "hello" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "created_by eq 'satriyo' and updated_at gte '2023-01-01T00:00:00Z' and updated_at lte '2023-12-31T00:00:00Z'",
    );
  });

  it("search + updated via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?updated_after=2023-01-01T00:00:00Z",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "hello" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("search + source via body (query source not yet exposed, but via body)", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search_file",
          arguments: { search: "hello", source: "onedrive" },
        },
      }),
    });
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "source eq 'onedrive'",
    );
  });

  it("search + kind + updated via query", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=image&updated_after=2023-01-01T00:00:00Z",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_file", arguments: { search: "hello" } },
        }),
      },
    );
    await POST(req);
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "kind eq 'image' and updated_at gte '2023-01-01T00:00:00Z'",
    );
  });

  it("tool arg precedence over query for kind/author/type", async () => {
    const fm = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", value: [] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fm);
    const req = new Request(
      "https://example.com/mcp?kind=video&author=satriyo&type=pdf",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "search_file",
            arguments: {
              search: "hello",
              kind: "document",
              author: "bob",
              type: ["docx"],
            },
          },
        }),
      },
    );
    await POST(req);
    // tool args win
    expect(getFilter((fm.mock.calls[0] as unknown as [URL])[0])).toBe(
      "extension eq 'docx' and kind eq 'document' and created_by eq 'bob'",
    );
  });

  it("invalid kind via query returns 400", async () => {
    const req = new Request("https://example.com/mcp?kind=audio", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("invalid date via query returns 400", async () => {
    const req = new Request(
      "https://example.com/mcp?updated_after=01-01-2023",
      {
        method: "POST",
        headers: { authorization: "Bearer at-valid" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {},
        }),
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("invalid type via query returns 400", async () => {
    const req = new Request("https://example.com/mcp?type=invalid!", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
