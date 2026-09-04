import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDelKey, mockResolveClient, mockHashSecret } = vi.hoisted(() => ({
  mockDelKey: vi.fn(async () => {}),
  mockResolveClient: vi.fn(),
  mockHashSecret: vi.fn((secret: string) => `hash(${secret})`),
}));

vi.mock("@/lib/oauth-dcr-store", () => ({
  resolveClient: mockResolveClient,
}));

vi.mock("@/lib/oauth-dcr", () => ({
  hashSecret: mockHashSecret,
}));

vi.mock("@/lib/oauth", () => ({
  timingSafeEqualStr: vi.fn((a: string, b: string) => a === b),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: vi.fn(async () => null),
  takeJSON: vi.fn(async () => null),
  setWithTTL: vi.fn(async () => {}),
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

vi.mock("@/lib/env", () => ({
  env: {
    VALKEY_URL: undefined,
  },
}));

import { POST } from "@/app/api/oauth/revoke/route";

const CLIENT_ID = "searchpoint-mcp-a1b2c3";
const CLIENT_SECRET = "secret123";
const DEFAULT_CLIENT = {
  id: CLIENT_ID,
  secretHash: "hash(secret123)",
  redirectUris: ["https://cb.example/cb"],
  tokenEndpointAuthMethod: "client_secret_post",
};

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

describe("POST /api/oauth/revoke", () => {
  beforeEach(() => {
    mockDelKey.mockClear();
    mockResolveClient.mockReset();
    mockResolveClient.mockResolvedValue(DEFAULT_CLIENT);
    mockHashSecret.mockClear();
  });

  it("revokes token with valid Basic client auth", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({
        token: "at123",
        token_type_hint: "access_token",
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    expect(mockDelKey).toHaveBeenCalledWith("oauth:at:at123");
    expect(mockDelKey).toHaveBeenCalledWith("oauth:rt:at123");
  });

  it("revokes token with valid client_secret_post", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({
        token: "at456",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    expect(mockDelKey).toHaveBeenCalledWith("oauth:at:at456");
  });

  it("returns 401 invalid_client with client_id not in registry", async () => {
    // Setup
    mockResolveClient.mockResolvedValue(null);
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({ token: "at123" }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader("bad-client", CLIENT_SECRET),
      },
    });

    // Act
    const res = await POST(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
    expect(mockDelKey).not.toHaveBeenCalled();
  });

  it("returns 401 invalid_client with wrong secret", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: CLIENT_ID,
      secretHash: "hash(sekret-lain)",
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
    } as never);
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({ token: "at123" }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: basicAuthHeader(CLIENT_ID, "wrong-secret"),
      },
    });

    // Act
    const res = await POST(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
    expect(mockDelKey).not.toHaveBeenCalled();
  });

  it("returns 401 invalid_client when client auth missing", async () => {
    // Setup
    mockResolveClient.mockResolvedValue(null);
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({ token: "at123" }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // Act
    const res = await POST(req);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
    expect(mockDelKey).not.toHaveBeenCalled();
  });

  it("revokes with client using tokenEndpointAuthMethod none", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: CLIENT_ID,
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "none",
    } as never);
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({
        token: "at789",
        client_id: CLIENT_ID,
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    expect(mockDelKey).toHaveBeenCalledWith("oauth:at:at789");
  });

  it("returns 200 even when token not found", async () => {
    // Setup
    const req = new Request("https://example.com/api/oauth/revoke", {
      method: "POST",
      body: new URLSearchParams({
        token: "unknown-token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
  });
});
