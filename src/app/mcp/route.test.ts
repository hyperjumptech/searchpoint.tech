import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("@/lib/mcp-allowlist", () => ({}));
vi.mock("@/lib/oauth-static-client", () => ({
  getStaticClient: vi.fn(async () => ({
    clientId: "searchpoint-mcp-static",
    name: "Test",
    redirectUri: "https://client.example/callback",
    scopes: ["search"],
    enabled: true,
    revoked: false,
    credentialVersion: 1,
  })),
}));

import { GET, POST } from "@/app/mcp/route";

describe("POST /mcp", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    mockGetJSON.mockReset();
    mockGetJSON.mockResolvedValue(null);
    mockLimiterConsume.mockReset();
    mockLimiterConsume.mockResolvedValue({
      success: true,
      remaining: 59,
      retryAfterSeconds: 0,
    });
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.unstubAllGlobals();
  });

  it("returns 401 without bearer with oauth-protected-resource metadata", async () => {
    // Setup
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toMatch(
      /oauth-protected-resource/,
    );
  });

  it("returns 401 for unknown token", async () => {
    // Setup
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-unknown" },
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(401);
    expect(mockGetJSON).toHaveBeenCalledWith("oauth:at:at-unknown");
  });

  it("returns 401 for expired scseExp", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) - 10,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-expired" },
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(401);
  });

  it("returns 401 when scseExp is not a number", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: "1756400000",
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-malformed" },
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(401);
  });

  it("returns 401 when scseId is missing", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-noid" },
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(401);
  });

  it("answers initialize without touching backend", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const mockFetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18" },
      }),
    });

    // Act
    const res = await POST(req);
    const body = (await res.json()) as {
      result?: { protocolVersion: string; serverInfo: { name: string } };
    };

    // Assert
    expect(res.status).toBe(200);
    expect(body.result?.protocolVersion).toBe("2025-06-18");
    expect(body.result?.serverInfo.name).toBe("searchpoint-mcp");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("runs tools/call end-to-end with the mapped SCSE_ID cookie", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const mockFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            value: { data: { id: "d1", name: "a.pdf" } },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", mockFetch);
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "get_file", arguments: { id: "d1" } },
      }),
    });

    // Act
    const res = await POST(req);
    const body = (await res.json()) as {
      result?: { isError: boolean; content: Array<{ text: string }> };
    };

    // Assert
    expect(res.status).toBe(200);
    expect(body.result?.isError).toBe(false);
    expect(body.result?.content[0].text).toContain('"name":"a.pdf"');
    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      URL,
      { headers: Record<string, string>; method: string },
    ];
    expect(url.pathname).toBe("/v1/files/d1");
    expect(init.method).toBe("GET");
    expect(init.headers.Cookie).toBe("SCSE_ID=scse-1");
    expect(init.headers["User-Agent"]).toBe("frontend-mcp");
  });

  it("maps backend network failure to isError tool result (no 502)", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_file", arguments: { id: "d1" } },
      }),
    });

    // Act
    const res = await POST(req);
    const body = (await res.json()) as {
      result?: { isError: boolean; content: Array<{ text: string }> };
    };

    // Assert
    expect(res.status).toBe(200);
    expect(body.result?.isError).toBe(true);
    expect(body.result?.content[0].text).toBe("Backend unavailable.");
  });

  it("returns 202 for notifications/initialized without a body", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-valid" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("returns 405 for GET without auth or backend", async () => {
    // Setup

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(405);
    expect(mockGetJSON).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    // Setup
    mockLimiterConsume.mockResolvedValue({
      success: false,
      remaining: 0,
      retryAfterSeconds: 30,
    });
    const req = new Request("https://example.com/mcp", {
      method: "POST",
      headers: { authorization: "Bearer at-limited" },
      body: "{}",
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(429);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.error).toBe("temporarily_unavailable");
    expect(res.headers.get("retry-after")).toBe("30");
    expect(mockGetJSON).not.toHaveBeenCalled();
  });
});
