import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetJSON } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: mockGetJSON,
  takeJSON: vi.fn(async () => null),
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

import { GET } from "@/app/api/oauth/magic-ui/route";

describe("GET /api/oauth/magic-ui", () => {
  beforeEach(() => {
    mockGetJSON.mockReset();
  });

  it("returns 200 HTML page containing the state", async () => {
    // Setup
    mockGetJSON.mockResolvedValue({ client_id: "c" } as unknown as never);
    const req = new Request("https://example.com/api/oauth/magic-ui?state=s1");

    // Act
    const res = await GET(req as unknown as Request);
    const html = await res.text();

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Sign in to SearchPoint");
    expect(html).toContain('value="s1"');
  });

  it("returns 400 when state param missing", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/magic-ui");

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("returns 400 when state unknown", async () => {
    // Setup
    mockGetJSON.mockResolvedValue(null);
    const req = new Request("https://example.com/api/oauth/magic-ui?state=bad");

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });
});
