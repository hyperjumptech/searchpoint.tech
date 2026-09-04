import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetJSON } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(async () => null as unknown),
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

import { GET } from "@/app/api/oauth/userinfo/route";

describe("GET /api/oauth/userinfo", () => {
  beforeEach(() => {
    mockGetJSON.mockReset();
    mockGetJSON.mockResolvedValue(null);
  });

  it("returns sub email name for valid bearer token", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/api/oauth/userinfo", {
      headers: { authorization: "Bearer at-valid" },
    });

    // Act
    const res = await GET(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j).toEqual({ sub: "a@b.com", email: "a@b.com", name: "Alice" });
    expect(mockGetJSON).toHaveBeenCalledWith("oauth:at:at-valid");
  });

  it("returns 401 without authorization header", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/userinfo");

    // Act
    const res = await GET(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_token");
    expect(res.headers.get("www-authenticate")).toBe(
      'Bearer error="invalid_token"',
    );
  });

  it("returns 401 for unknown token", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/userinfo", {
      headers: { authorization: "Bearer at-unknown" },
    });

    // Act
    const res = await GET(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_token");
    expect(res.headers.get("www-authenticate")).toBe(
      'Bearer error="invalid_token"',
    );
  });

  it("returns 401 when stored data has no user", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: undefined,
      client_id: "searchpoint-mcp-static",
      scope: "openid",
    });
    const req = new Request("https://example.com/api/oauth/userinfo", {
      headers: { authorization: "Bearer at-nouser" },
    });

    // Act
    const res = await GET(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_token");
    expect(res.headers.get("www-authenticate")).toBe(
      'Bearer error="invalid_token"',
    );
  });
});
