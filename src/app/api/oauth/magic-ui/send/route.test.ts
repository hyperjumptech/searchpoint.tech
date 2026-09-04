import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetJSON, mockLimiterConsume } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
  mockLimiterConsume: vi.fn(async () => ({
    success: true,
    remaining: 59,
    retryAfterSeconds: 0,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  limiterForScope: vi.fn(() => ({ consume: mockLimiterConsume })),
  clientIpFromRequest: vi.fn(() => "1.2.3.4"),
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

import { POST } from "@/app/api/oauth/magic-ui/send/route";

describe("POST /api/oauth/magic-ui/send", () => {
  const realFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetJSON.mockReset();
    mockGetJSON.mockResolvedValue({ client_id: "c" } as unknown as never);
    mockLimiterConsume.mockResolvedValue({
      success: true,
      remaining: 59,
      retryAfterSeconds: 0,
    });
    fetchMock = vi.fn(
      async () => new Response(null, { status: 200 }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.unstubAllGlobals();
  });

  it("sends magic link via backend and returns success", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/magic-ui/send", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", state: "s1" }),
      headers: { "content-type": "application/json" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"return_to"'),
      }),
    );
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/v1/auth/magic-link");
  });

  it("returns 400 for empty email", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/magic-ui/send", {
      method: "POST",
      body: JSON.stringify({ email: "", state: "s1" }),
      headers: { "content-type": "application/json" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for unknown state", async () => {
    // Setup
    mockGetJSON.mockResolvedValue(null);
    const req = new Request("https://example.com/api/oauth/magic-ui/send", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", state: "bad" }),
      headers: { "content-type": "application/json" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.success).toBe(false);
    expect(j.error).toBe("invalid_grant");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when backend send fails", async () => {
    // Setup
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
      }) as Response,
    );
    const req = new Request("https://example.com/api/oauth/magic-ui/send", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", state: "s1" }),
      headers: { "content-type": "application/json" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.success).toBe(false);
    expect(j.error).toBe("rate limited");
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    // Setup
    mockLimiterConsume.mockResolvedValue({
      success: false,
      remaining: 0,
      retryAfterSeconds: 30,
    });
    const req = new Request("https://example.com/api/oauth/magic-ui/send", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", state: "s1" }),
      headers: { "content-type": "application/json" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(j.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
