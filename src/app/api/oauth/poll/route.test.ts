import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetJSON } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
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

import { GET } from "@/app/api/oauth/poll/route";

describe("GET /api/oauth/poll", () => {
  beforeEach(() => {
    mockGetJSON.mockReset();
  });

  it("returns pending then done (legacy string)", async () => {
    // pending case
    mockGetJSON.mockResolvedValueOnce(null);
    const req1 = new Request("https://example.com/api/oauth/poll?state=s1");
    let res = await GET(req1 as unknown as Request);
    expect((await res.json()).status).toBe("pending");

    // legacy "done" string case
    mockGetJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:magic:pending:s1") return "done" as unknown as never;
      return null as unknown as never;
    });
    const req2 = new Request("https://example.com/api/oauth/poll?state=s1");
    res = await GET(req2 as unknown as Request);
    expect(await res.json()).toEqual({ status: "done" });
  });

  it("returns 400 when state is missing", async () => {
    const req = new Request("https://example.com/api/oauth/poll");
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("returns pending when magicPending not done", async () => {
    mockGetJSON.mockResolvedValue(null);
    const req = new Request("https://example.com/api/oauth/poll?state=s2");
    const res = await GET(req as unknown as Request);
    expect((await res.json()).status).toBe("pending");
  });

  it("returns done with redirect when magicPending holds the done object", async () => {
    mockGetJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:magic:pending:s1")
        return {
          status: "done",
          redirect: "https://cb.example/cb?code=c1&state=s1",
        } as unknown as never;
      return null as unknown as never;
    });
    const req = new Request("https://example.com/api/oauth/poll?state=s1");
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.status).toBe("done");
    expect(j.redirect).toBe("https://cb.example/cb?code=c1&state=s1");
  });
});
