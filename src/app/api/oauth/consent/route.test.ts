import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTakeJSON, mockSetWithTTL, mockRecordConsent } = vi.hoisted(() => ({
  mockTakeJSON: vi.fn(),
  mockSetWithTTL: vi.fn(),
  mockRecordConsent: vi.fn(async () => {}),
}));
vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: vi.fn(async () => null),
  takeJSON: mockTakeJSON,
  setWithTTL: mockSetWithTTL,
  delKey: vi.fn(async () => {}),
  getOAuthValkey: vi.fn(async () => null),
  oauthKeys: {
    state: (s: string) => `oauth:state:${s}`,
    code: (c: string) => `oauth:code:${c}`,
    at: (t: string) => `oauth:at:${t}`,
    rt: (t: string) => `oauth:rt:${t}`,
    magicPending: (s: string) => `oauth:magic:pending:${s}`,
    consent: (c: string, e: string) => `oauth:consent:${c}:${e}`,
  },
}));

vi.mock("@/lib/oauth-consent", () => ({
  recordConsent: mockRecordConsent,
}));

vi.mock("@/lib/env", () => ({
  env: {
    OAUTH_ISSUER: undefined as string | undefined,
    AUTH_BASE_URL: "https://auth.example.com",
    VALKEY_URL: undefined,
  },
}));

import { POST } from "@/app/api/oauth/consent/route";

const storedState = {
  client_id: "searchpoint-mcp-static",
  redirect_uri: "https://cb.example/cb",
  code_challenge: "challenge123",
  scope: "openid email search",
  resource: undefined as string | undefined,
  email: "a@b.com",
};

function postReq(body: unknown) {
  return new Request("https://example.com/api/oauth/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/oauth/consent", () => {
  beforeEach(() => {
    mockTakeJSON.mockReset();
    mockSetWithTTL.mockClear();
    mockRecordConsent.mockClear();
  });

  it("returns 400 on malformed JSON", async () => {
    const req = new Request("https://example.com/api/oauth/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
  });

  it("returns 400 when state is missing", async () => {
    const res = await POST(postReq({}) as unknown as Request);
    expect(res.status).toBe(400);
  });

  it("returns 400 invalid_grant when state unknown", async () => {
    mockTakeJSON.mockResolvedValue(null);
    const res = await POST(postReq({ state: "bad" }) as unknown as Request);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "invalid_grant",
    );
  });

  it("records consent and returns callback redirect on allow", async () => {
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    const res = await POST(postReq({ state: "s1" }) as unknown as Request);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { redirect: string };
    expect(j.redirect).toMatch(/\/api\/oauth\/callback\?state=s1$/);
    expect(mockRecordConsent).toHaveBeenCalledWith(
      "searchpoint-mcp-static",
      "a@b.com",
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:state:s1",
      expect.objectContaining({ email: "a@b.com", consented: true }),
      600,
    );
  });

  it("returns access_denied redirect on deny", async () => {
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    const res = await POST(
      postReq({ state: "s1", deny: true }) as unknown as Request,
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as { redirect: string };
    const loc = new URL(j.redirect);
    expect(loc.origin + loc.pathname).toBe("https://cb.example/cb");
    expect(loc.searchParams.get("error")).toBe("access_denied");
    expect(loc.searchParams.get("state")).toBe("s1");
    expect(mockRecordConsent).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing from state", async () => {
    const noEmail = { ...storedState, email: undefined as string | undefined };
    mockTakeJSON.mockResolvedValue(noEmail as unknown as never);
    const res = await POST(postReq({ state: "s1" }) as unknown as Request);
    expect(res.status).toBe(400);
  });
});
