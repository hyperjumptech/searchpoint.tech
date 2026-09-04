import { createHash } from "crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockTakeJSON,
  mockSetWithTTL,
  mockDelKey,
  mockGenerateToken,
  mockPkceVerify,
  mockCalcTTL,
  mockResolveClient,
  mockHashSecret,
  mockLimiterConsume,
  mockLimiterForScope,
} = vi.hoisted(() => ({
  mockTakeJSON: vi.fn(),
  mockSetWithTTL: vi.fn(async () => {}),
  mockDelKey: vi.fn(async () => {}),
  mockGenerateToken: vi.fn(() => "token-1"),
  mockPkceVerify: vi.fn(() => true),
  mockCalcTTL: vi.fn(() => ({ atTtl: 3600, rtTtl: 604800 as number | null })),
  mockResolveClient: vi.fn(),
  mockHashSecret: vi.fn((secret: string) => `hash(${secret})`),
  mockLimiterConsume: vi.fn(async () => ({
    success: true,
    remaining: 59,
    retryAfterSeconds: 0,
  })),
  mockLimiterForScope: vi.fn(() => ({
    consume: vi.fn(async () => ({
      success: true,
      remaining: 59,
      retryAfterSeconds: 0,
    })),
  })),
}));

// Must mock before imports
vi.mock("@/lib/oauth-dcr-store", () => ({
  resolveClient: mockResolveClient,
}));

vi.mock("@/lib/oauth-dcr", () => ({
  hashSecret: mockHashSecret,
  resolveRegisteredToken: vi.fn(() => null),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: vi.fn(async () => null),
  takeJSON: mockTakeJSON,
  setWithTTL: mockSetWithTTL,
  delKey: mockDelKey,
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
  pkceVerify: mockPkceVerify,
  calcTTL: mockCalcTTL,
  deriveIssuer: vi.fn((req: Request) => new URL(req.url).origin),
  timingSafeEqualStr: vi.fn((a: string, b: string) => a === b),
}));

vi.mock("@/lib/env", () => ({
  env: {
    OAUTH_ISSUER: undefined as string | undefined,
    VALKEY_URL: undefined,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  limiterForScope: vi.fn(() => ({ consume: mockLimiterConsume })),
  clientIpFromRequest: vi.fn(() => "1.2.3.4"),
}));

import { POST } from "@/app/api/oauth/token/route";

const CLIENT_ID = "searchpoint-mcp-a1b2c3";
const CLIENT_SECRET = "secret123";
const DEFAULT_CLIENT = {
  id: CLIENT_ID,
  secretHash: "hash(secret123)",
  redirectUris: ["https://cb.example/cb"],
  tokenEndpointAuthMethod: "client_secret_post",
};

function makeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

function makeCodeData(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    scseId: "scse-jwt-123",
    scseExp: now + 3600,
    user: { email: "a@b.com", name: "Alice" },
    client_id: CLIENT_ID,
    redirect_uri: "https://cb.example/cb",
    code_challenge: makeChallenge("verifier123"),
    scope: "openid",
    resource: undefined as string | undefined,
    iss: "searchpoint" as const,
    ...overrides,
  };
}

describe("POST /api/oauth/token", () => {
  beforeEach(() => {
    mockTakeJSON.mockReset();
    mockSetWithTTL.mockClear();
    mockDelKey.mockClear();
    mockGenerateToken.mockReset();
    mockGenerateToken.mockReturnValue("at-generated-123");
    mockPkceVerify.mockReset();
    mockPkceVerify.mockReturnValue(true);
    mockCalcTTL.mockReset();
    mockCalcTTL.mockReturnValue({ atTtl: 3600, rtTtl: 604800 });
    mockResolveClient.mockReset();
    mockResolveClient.mockResolvedValue(DEFAULT_CLIENT);
    mockHashSecret.mockClear();
    mockLimiterConsume.mockReset();
    mockLimiterConsume.mockResolvedValue({
      success: true,
      remaining: 59,
      retryAfterSeconds: 0,
    });
    mockLimiterForScope.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // re-setup hoisted mocks that were cleared by restoreAllMocks for rate-limit
    // need to re-mock limiterForScope consume after restore? but hoisted mock remains?
  });

  it("issues at for code (searchpoint with refresh_token)", async () => {
    // Setup
    const verifier = "verifier123";
    const codeData = makeCodeData({
      code_challenge: makeChallenge(verifier),
      iss: "searchpoint",
    });
    mockTakeJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:code:c123") return codeData as unknown as never;
      return null as unknown as never;
    });
    mockGenerateToken
      .mockReturnValueOnce("at-token-abc")
      .mockReturnValueOnce("rt-token-xyz");
    mockCalcTTL.mockReturnValue({ atTtl: 3600, rtTtl: 604800 });

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });

    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
        "x-real-ip": "1.2.3.4",
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j.access_token).toBe("at-token-abc");
    expect(j.refresh_token).toBe("rt-token-xyz");
    expect(j.token_type).toBe("Bearer");
    expect(j.expires_in).toBe(3600);
    expect(j.scope).toBe("openid");
    expect(mockPkceVerify).toHaveBeenCalledWith(
      verifier,
      codeData.code_challenge,
    );
    expect(mockCalcTTL).toHaveBeenCalledWith("searchpoint", codeData.scseExp);
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:at:at-token-abc",
      expect.objectContaining({ scseId: codeData.scseId, user: codeData.user }),
      3600,
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:rt:rt-token-xyz",
      expect.objectContaining({ scseId: codeData.scseId }),
      604800,
    );
    // code consumed atomically via takeJSON — no separate del needed
    expect(mockTakeJSON).toHaveBeenCalledWith("oauth:code:c123");
    expect(mockDelKey).not.toHaveBeenCalled();
  });

  it("issues at without rt for entra", async () => {
    // Setup
    const verifier = "verifier123";
    const codeData = makeCodeData({
      code_challenge: makeChallenge(verifier),
      iss: "entra",
    });
    mockTakeJSON.mockResolvedValue(codeData as unknown as never);
    mockCalcTTL.mockReturnValue({ atTtl: 3600, rtTtl: null });
    mockGenerateToken.mockReturnValueOnce("at-entra-123");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c456",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j.access_token).toBe("at-entra-123");
    expect(j.refresh_token).toBeUndefined();
    expect(j.expires_in).toBe(3600);
    // ensure rt not stored
    const rtCalls = (
      mockSetWithTTL.mock.calls as unknown as Array<[string, unknown, number]>
    ).filter((call) => String(call[0]).startsWith("oauth:rt:"));
    expect(rtCalls.length).toBe(0);
  });

  it("rejects bad verifier", async () => {
    // Setup
    const verifier = "bad-verifier";
    const codeData = makeCodeData({
      code_challenge: makeChallenge("verifier123"),
    });
    mockTakeJSON.mockResolvedValue(codeData as unknown as never);
    mockPkceVerify.mockReturnValue(false);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
    // failed PKCE consumed the code — nothing left to retry
    expect(mockTakeJSON).toHaveBeenCalledWith("oauth:code:c123");
    expect(mockDelKey).not.toHaveBeenCalled();
  });

  it("rejects invalid code", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue(null);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "badcode",
      code_verifier: "verifier123",
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("rejects missing code or verifier with invalid_request", async () => {
    // Setup
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "",
      code_verifier: "",
      client_id: CLIENT_ID,
    });
    // remove empty to simulate missing
    body.delete("code");
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("rejects missing redirect_uri with invalid_request", async () => {
    // Setup
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier123",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
    expect(mockTakeJSON).not.toHaveBeenCalled();
  });

  it("rejects redirect_uri mismatch", async () => {
    // Setup
    const verifier = "verifier123";
    const codeData = makeCodeData({
      code_challenge: makeChallenge(verifier),
      redirect_uri: "https://cb.example/cb",
    });
    mockTakeJSON.mockResolvedValue(codeData as unknown as never);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: "https://evil.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("authenticates client via client_secret_post", async () => {
    // Setup
    const verifier = "verifier123";
    const codeData = makeCodeData({ code_challenge: makeChallenge(verifier) });
    mockTakeJSON.mockResolvedValue(codeData as unknown as never);
    mockGenerateToken
      .mockReturnValueOnce("at-post-123")
      .mockReturnValueOnce("rt-post-456");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j.access_token).toBe("at-post-123");
    expect(mockHashSecret).toHaveBeenCalledWith(CLIENT_SECRET);
  });

  it("rejects unknown client", async () => {
    // Setup
    mockResolveClient.mockResolvedValue(null);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier",
      client_id: "unknown",
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader("unknown", CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
  });

  it("rejects wrong client_secret", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: CLIENT_ID,
      secretHash: "hash(sekret-lain)",
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
    } as never);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
  });

  it("rejects invalid_client when client_id not in registry", async () => {
    // Setup
    mockResolveClient.mockResolvedValue(null);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier",
      client_id: "bad-client",
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader("bad-client", CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
  });

  it("rejects invalid_client when secret hash mismatch", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: CLIENT_ID,
      secretHash: "hash(sekret-lain)",
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
    } as never);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier",
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, "wrong-secret"),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
  });

  it("issues new at for valid refresh_token (magic only)", async () => {
    // Setup
    const now = Math.floor(Date.now() / 1000);
    const rtData = {
      scseId: "scse-jwt-rt",
      scseExp: now + 7 * 24 * 3600,
      user: { email: "a@b.com", name: "Alice" },
      client_id: CLIENT_ID,
      scope: "openid",
      resource: undefined,
    };
    mockTakeJSON.mockResolvedValue(rtData as unknown as never);
    mockCalcTTL.mockReturnValue({ atTtl: 3600, rtTtl: 604800 });
    mockGenerateToken.mockReturnValueOnce("at-refresh-123");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: "rt-valid",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(200);
    expect(j.access_token).toBe("at-refresh-123");
    expect(j.token_type).toBe("Bearer");
    expect(j.expires_in).toBe(3600);
    expect(j.scope).toBe("openid");
    expect(mockCalcTTL).toHaveBeenCalledWith("searchpoint", rtData.scseExp);
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:at:at-refresh-123",
      expect.objectContaining({ scseId: rtData.scseId }),
      3600,
    );
  });

  it("rejects invalid refresh_token", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue(null);

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: "bad-rt",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("rejects expired refresh_token", async () => {
    // Setup
    const rtData = {
      scseId: "scse-jwt-rt",
      scseExp: Math.floor(Date.now() / 1000) - 10,
      user: { email: "a@b.com" },
      client_id: CLIENT_ID,
      scope: "openid",
    };
    mockTakeJSON.mockResolvedValue(rtData as unknown as never);

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: "rt-expired",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_grant");
  });

  it("rejects invalid_request when refresh_token missing", async () => {
    // Setup
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("returns unsupported_grant_type for unknown grant", async () => {
    // Setup
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("unsupported_grant_type");
  });

  it("rate limits with 429 temporarily_unavailable", async () => {
    // Setup
    mockLimiterConsume.mockResolvedValue({
      success: false,
      remaining: 0,
      retryAfterSeconds: 42,
    });

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: "verifier",
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
        "x-real-ip": "9.9.9.9",
      },
    });

    // Act
    const res = await POST(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(429);
    expect(j.error).toBe("temporarily_unavailable");
    expect(res.headers.get("retry-after")).toBe("42");
  });

  it("allows request when rate limiter succeeds", async () => {
    // Setup - ensure limiter is called and success path continues
    const verifier = "verifier123";
    const codeData = makeCodeData({ code_challenge: makeChallenge(verifier) });
    mockTakeJSON.mockResolvedValue(codeData as unknown as never);
    mockGenerateToken.mockReturnValueOnce("at-ok").mockReturnValueOnce("rt-ok");
    mockLimiterConsume.mockResolvedValue({
      success: true,
      remaining: 58,
      retryAfterSeconds: 0,
    });

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: "c123",
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
        "x-real-ip": "1.2.3.4",
      },
    });

    // Act
    const res = await POST(req as unknown as Request);

    // Assert
    expect(res.status).toBe(200);
    expect(mockLimiterConsume).toHaveBeenCalled();
  });
});
