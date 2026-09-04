import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockTakeJSON, mockSetWithTTL, mockGenerateToken } = vi.hoisted(() => ({
  mockTakeJSON: vi.fn(),
  mockSetWithTTL: vi.fn(async () => {}),
  mockGenerateToken: vi.fn(() => "generated-code-123"),
}));

const { mockHasConsent, mockClientLabel, mockEnv } = vi.hoisted(() => ({
  mockHasConsent: vi.fn(async () => true),
  mockClientLabel: vi.fn(() => "Open WebUI (StartGPT SMDV)"),
  mockEnv: {
    BACKEND_BASE_URL: "https://api.searchpoint.hyperjump.tech",
    OAUTH_ISSUER: undefined as string | undefined,
    AUTH_BASE_URL: "https://api.searchpoint.hyperjump.tech",
    VALKEY_URL: undefined,
    OAUTH_CONSENT_ALWAYS: false as boolean,
  },
}));

vi.mock("@/lib/oauth-consent", () => ({
  CONSENT_TTL_SEC: 30 * 24 * 3600,
  clientLabel: mockClientLabel,
  hasConsent: mockHasConsent,
  describeScopes: vi.fn(() => ({ visible: [], unknown: [] })),
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
  },
}));

vi.mock("@/lib/oauth", () => ({
  generateToken: mockGenerateToken,
  pkceVerify: vi.fn(() => true),
  calcTTL: vi.fn(() => ({ atTtl: 3600, rtTtl: 7 * 24 * 3600 })),
  deriveIssuer: vi.fn((req: Request) => new URL(req.url).origin),
  timingSafeEqualStr: vi.fn(() => true),
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined as unknown as { value: string } | undefined,
  }),
}));

import { GET } from "@/app/api/oauth/callback/route";

const storedState = {
  client_id: "searchpoint-mcp-static",
  redirect_uri: "https://cb.example/cb",
  code_challenge: "challenge123",
  scope: "openid",
  resource: undefined as string | undefined,
};

describe("GET /api/oauth/callback", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTakeJSON.mockReset();
    mockSetWithTTL.mockClear();
    mockGenerateToken.mockClear();
    mockGenerateToken.mockReturnValue("generated-code-123");
    mockHasConsent.mockClear();
    mockHasConsent.mockResolvedValue(true);
    mockEnv.OAUTH_CONSENT_ALWAYS = false;
    fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ value: { email: "a@b.com", name: "Alice" } }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    // re-stub fetch mock restoration breaks hoisted but vitest restore doesn't affect stubGlobal
  });

  it("exchanges SCSE_ID for code via ?session", async () => {
    // Setup
    mockTakeJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:state:s1") return storedState as unknown as never;
      return null as unknown as never;
    });

    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
      {
        headers: { cookie: "SCSE_ID=fakeJwt" },
      },
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/code=generated-code-123/);
    expect(location).toMatch(/state=s1/);
    expect(location.startsWith("https://cb.example/cb")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "SCSE_ID=fakeJwt" }),
      }),
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:code:generated-code-123",
      expect.objectContaining({
        scseId: "fakeJwt",
        client_id: "searchpoint-mcp-static",
        redirect_uri: "https://cb.example/cb",
        code_challenge: "challenge123",
      }),
      600,
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:magic:pending:s1",
      {
        status: "done",
        redirect: expect.stringMatching(
          /^https:\/\/cb\.example\/cb\?code=generated-code-123&state=s1$/,
        ),
      },
      900,
    );
  });

  it("exchanges SCSE_ID for code via Cookie header", async () => {
    // Setup
    mockTakeJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:state:s1") return storedState as unknown as never;
      return null as unknown as never;
    });

    const req = new Request("https://example.com/api/oauth/callback?state=s1", {
      headers: { cookie: "SCSE_ID=cookieJwt; other=1" },
    });

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/code=/);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "SCSE_ID=cookieJwt" }),
      }),
    );
  });

  it("returns 400 when state is missing", async () => {
    // Setup
    const req = new Request(
      "https://example.com/api/oauth/callback?session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("returns 400 invalid_grant when state not found", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue(null);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=bad&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("rejects state replay: second callback with same state fails", async () => {
    // Setup — takeJSON consumes: first call returns state, second returns null
    mockTakeJSON
      .mockResolvedValueOnce(storedState as unknown as never)
      .mockResolvedValueOnce(null as unknown as never);
    const firstReq = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const first = await GET(firstReq as unknown as Request);
    expect(first.status).toBe(302);
    const secondReq = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );
    const second = await GET(secondReq as unknown as Request);
    const j = (await second.json()) as Record<string, unknown>;

    // Assert
    expect(second.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("returns 400 when SCSE_ID is missing", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    const req = new Request("https://example.com/api/oauth/callback?state=s1");

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
    expect(j.error_description).toMatch(/SCSE_ID/);
  });

  it("returns 401 when /v1/auth/me fails", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    fetchMock.mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }),
    );
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=badJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_grant");
  });

  it("preserves existing query params in redirect_uri", async () => {
    // Setup
    const stateWithResource = {
      ...storedState,
      redirect_uri: "https://cb.example/cb?foo=bar",
    };
    mockTakeJSON.mockResolvedValue(stateWithResource as unknown as never);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("foo")).toBe("bar");
    expect(loc.searchParams.get("code")).toBe("generated-code-123");
    expect(loc.searchParams.get("state")).toBe("s1");
  });

  it("redirects to consent page when interactive flow and no prior consent", async () => {
    // Setup — /v1/auth/me returns email; hasConsent false
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    mockHasConsent.mockResolvedValue(false);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert — 302 to the React consent page, state re-stored with email
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toMatch(/\/oauth\/consent\?state=s1$/);
    expect(mockHasConsent).toHaveBeenCalledWith(
      "searchpoint-mcp-static",
      "a@b.com",
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:state:s1",
      expect.objectContaining({ email: "a@b.com" }),
      600,
    );
    // No code issued
    expect(mockSetWithTTL).not.toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:code:/),
      expect.anything(),
      expect.anything(),
    );
  });

  it("skips consent page when consent already granted", async () => {
    // Setup — hasConsent true (default)
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert — straight to redirect with code
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/code=generated-code-123/);
    expect(mockSetWithTTL).not.toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:consent:/),
      expect.anything(),
      expect.anything(),
    );
  });

  it("shows consent page when OAUTH_CONSENT_ALWAYS forces it", async () => {
    // Setup — consent already granted (hasConsent true) but flag forces screen
    mockEnv.OAUTH_CONSENT_ALWAYS = true;
    mockTakeJSON.mockResolvedValue(storedState as unknown as never);
    mockHasConsent.mockResolvedValue(true);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert — consent screen shown despite prior grant
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/\/oauth\/consent\?state=s1$/);
    expect(mockHasConsent).not.toHaveBeenCalled();
  });

  it("completes the flow when consent was just given, even under OAUTH_CONSENT_ALWAYS", async () => {
    // Setup — state carries consented=true (set by POST /api/oauth/consent).
    // The flag is true but the explicit in-flow consent must let it finish,
    // otherwise the flow loops forever between consent and callback.
    mockEnv.OAUTH_CONSENT_ALWAYS = true;
    mockTakeJSON.mockResolvedValue({
      ...storedState,
      consented: true,
    } as unknown as never);
    mockHasConsent.mockResolvedValue(false);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert — straight to redirect with code, no consent page
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/code=generated-code-123/);
    expect(mockHasConsent).not.toHaveBeenCalled();
    expect(mockSetWithTTL).not.toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:state:s1$/),
      expect.objectContaining({ email: expect.any(String) }),
      expect.anything(),
    );
  });

  it("shows consent page for magic flows (like any interactive flow)", async () => {
    // Setup — magic state should still go through consent (same as Entra)
    mockTakeJSON.mockResolvedValue({
      ...storedState,
      magic: true,
    } as unknown as never);
    mockHasConsent.mockResolvedValue(false);
    const req = new Request(
      "https://example.com/api/oauth/callback?state=s1&session=fakeJwt",
    );
    // Act
    const res = await GET(req as unknown as Request);

    // Assert — consent page for magic too
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/\/oauth\/consent\?state=s1$/);
    expect(mockHasConsent).toHaveBeenCalledWith(
      "searchpoint-mcp-static",
      "a@b.com",
    );
  });
});
