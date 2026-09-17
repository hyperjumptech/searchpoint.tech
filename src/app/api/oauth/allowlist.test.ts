import { afterEach, describe, expect, it, vi } from "vitest";

const { mockTakeJSON, mockSetWithTTL, mockGetStaticClient } = vi.hoisted(
  () => ({
    mockTakeJSON: vi.fn(),
    mockSetWithTTL: vi.fn(async () => {}),
    mockGetStaticClient: vi.fn(async () => ({
      clientId: "client-1",
      name: "Test",
      redirectUri: "https://client.example/callback",
      scopes: ["search"],
      enabled: true,
      revoked: false,
      credentialVersion: 1,
    })),
  }),
);

vi.mock("@/lib/oauth-dcr-store", () => ({
  resolveClient: vi.fn(async () => ({
    id: "client-1",
    secretHash: undefined,
    redirectUris: [],
    tokenEndpointAuthMethod: "none",
  })),
}));

vi.mock("@/lib/oauth-dcr", () => ({
  hashSecret: vi.fn((secret: string) => secret),
  resolveRegisteredToken: vi.fn(() => null),
}));
vi.mock("@/lib/oauth-static-client", () => ({
  getStaticClient: mockGetStaticClient,
  verifyStaticClientSecret: vi.fn(async () => true),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: vi.fn(async () => null),
  takeJSON: mockTakeJSON,
  setWithTTL: mockSetWithTTL,
  oauthKeys: {
    at: (token: string) => `oauth:at:${token}`,
    code: (code: string) => `oauth:code:${code}`,
    rt: (token: string) => `oauth:rt:${token}`,
  },
}));

vi.mock("@/lib/oauth", () => ({
  calcTTL: vi.fn(() => ({ atTtl: 3600, rtTtl: 604800 })),
  generateToken: vi.fn(() => "new-access-token"),
  pkceVerify: vi.fn(() => true),
  timingSafeEqualStr: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  clientIpFromRequest: vi.fn(() => "127.0.0.1"),
  limiterForScope: vi.fn(() => ({
    consume: vi.fn(async () => ({
      success: true,
      remaining: 59,
      retryAfterSeconds: 0,
    })),
  })),
}));

import { POST } from "@/app/api/oauth/token/route";

describe("static OAuth client enforcement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a refresh token when the client is disabled", async () => {
    // Setup
    mockGetStaticClient.mockResolvedValueOnce({
      clientId: "client-1",
      name: "Test",
      redirectUri: "https://client.example/callback",
      scopes: ["search"],
      enabled: false,
      revoked: false,
      credentialVersion: 1,
    });
    mockTakeJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com" },
      client_id: "client-1",
      scope: "openid",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: "refresh-token",
        client_id: "client-1",
        client_secret: "secret123",
        client_secret: "secret123",
      }),
    });

    // Act
    const res = await POST(req);
    const body = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(body.error).toBe("invalid_client");
    expect(mockSetWithTTL).not.toHaveBeenCalled();
  });

  it("rejects a refresh token bound to a different client", async () => {
    // Setup
    mockTakeJSON.mockResolvedValue({
      scseId: "scse-1",
      scseExp: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "a@b.com" },
      client_id: "different-client",
      scope: "openid",
    });
    const req = new Request("https://example.com/api/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: "refresh-token",
        client_id: "client-1",
        client_secret: "secret123",
      }),
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_grant");
    expect(mockGetStaticClient).toHaveBeenCalledWith("client-1");
    expect(mockSetWithTTL).not.toHaveBeenCalled();
  });
});
