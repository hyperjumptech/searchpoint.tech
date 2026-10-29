import { createHash } from "crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSetWithTTL, mockResolveClient, mockEnv } = vi.hoisted(() => ({
  mockSetWithTTL: vi.fn(async (_key: string, _value: unknown) => {}),
  mockResolveClient: vi.fn(),
  mockEnv: {
    OAUTH_ISSUER: undefined as string | undefined,
    AUTH_BASE_URL: "https://auth.example.com",
  },
}));

vi.mock("@/lib/mcp-allowlist", () => ({}));

vi.mock("@/lib/oauth-dcr", () => ({
  redirectUriMatches: vi.fn((a: string, b: string) => a === b),
}));

vi.mock("@/lib/oauth-dcr-store", () => ({
  resolveClient: mockResolveClient,
}));

vi.mock("@/lib/oauth-static-client", () => ({
  getStaticClient: vi.fn(async (id: string) => {
    const c = await mockResolveClient(id);
    if (!c) return null;
    return {
      clientId: c.id ?? id,
      name: c.name ?? id,
      redirectUri: c.redirectUris?.at(-1) ?? c.redirectUri,
      scopes: (c.scope ?? "search").split(/[\s,]+/),
      enabled: true,
      revoked: false,
      credentialVersion: 1,
    };
  }),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  setWithTTL: mockSetWithTTL,
  oauthKeys: {
    state: (s: string) => `oauth:state:${s}`,
    code: (c: string) => `oauth:code:${c}`,
    at: (t: string) => `oauth:at:${t}`,
    rt: (t: string) => `oauth:rt:${t}`,
    magicPending: (s: string) => `oauth:magic:pending:${s}`,
  },
  getJSON: vi.fn(async () => null),
  delKey: vi.fn(async () => {}),
  getOAuthValkey: vi.fn(async () => null),
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

import { GET } from "@/app/api/oauth/authorize/route";
import { env } from "@/lib/env";

const CLIENT_ID = "searchpoint-mcp-a1b2c3";
const AUTH_BASE = (env as unknown as { AUTH_BASE_URL: string }).AUTH_BASE_URL;
function makeChallenge(verifier = "verifier123") {
  return createHash("sha256").update(verifier).digest("base64url");
}

function baseParams(overrides: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: "https://cb.example/cb",
    response_type: "code",
    code_challenge: makeChallenge(),
    code_challenge_method: "S256",
    state: "s1",
    scope: "openid",
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    ),
  });
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) p.delete(k);
  }
  return p.toString();
}

describe("GET /api/oauth/authorize", () => {
  beforeEach(() => {
    mockSetWithTTL.mockClear();
    mockResolveClient.mockReset();
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      name: "Open WebUI",
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
      scope: "openid search magic",
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockSetWithTTL.mockClear();
  });

  it("rejects unknown client (registry-only)", async () => {
    mockResolveClient.mockResolvedValue(null);
    const req = new Request(
      `https://example.com/api/oauth/authorize?response_type=code&client_id=unknown&redirect_uri=https://cb.example/cb&code_challenge=ch&code_challenge_method=S256&state=s1&scope=openid`,
    );
    const res = await GET(req as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("defaults an omitted scope to search", async () => {
    const qs = baseParams({ scope: undefined });
    const res = await GET(
      new Request(`https://example.com/api/oauth/authorize?${qs}`),
    );
    expect(res.status).toBe(302);
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ scope: "search" }),
      600,
    );
  });

  it("rejects redirect_uri not in client registry", async () => {
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      redirectUris: ["http://localhost:8080/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
    } as never);
    const req = new Request(
      `https://example.com/api/oauth/authorize?response_type=code&client_id=searchpoint-mcp-a1b2c3&redirect_uri=https://evil.example/cb&code_challenge=ch&code_challenge_method=S256&state=s1&scope=openid`,
    );
    const res = await GET(req as unknown as Request);
    expect(res.status).toBe(400);
  });

  it("rejects bad client_id", async () => {
    // Setup
    mockResolveClient.mockResolvedValue(null);
    const qs = baseParams({ client_id: "bad" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(401);
    expect(j.error).toBe("invalid_client");
    expect(mockResolveClient).toHaveBeenCalledWith("bad");
  });

  it("stores the registered client name in consent state", async () => {
    const qs = baseParams();
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    const res = await GET(req as unknown as Request);

    expect(res.status).toBe(302);
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:state:s1",
      expect.objectContaining({
        client_id: CLIENT_ID,
        client_name: "Open WebUI",
      }),
      600,
    );
  });

  it("rejects unsupported response_type", async () => {
    // Setup
    const qs = baseParams({ response_type: "token" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("unsupported_response_type");
  });

  it("rejects missing code_challenge", async () => {
    // Setup
    const qs = baseParams({ code_challenge: undefined });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("rejects non-S256 code_challenge_method", async () => {
    // Setup
    const qs = baseParams({ code_challenge_method: "plain" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("rejects missing state", async () => {
    // Setup
    const qs = baseParams({ state: undefined });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("rejects redirect_uri not https", async () => {
    // Setup
    const qs = baseParams({ redirect_uri: "http://cb.example/cb" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("rejects redirect_uri with fragment", async () => {
    // Setup
    const qs = baseParams({ redirect_uri: "https://cb.example/cb#frag" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("stores state and redirects to entra", async () => {
    // Setup
    const ch = makeChallenge("verifier123");
    const qs = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: "https://cb.example/cb",
      response_type: "code",
      code_challenge: ch,
      code_challenge_method: "S256",
      state: "s1",
      scope: "openid",
    }).toString();
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/v1\/auth\//);
    expect(res.headers.get("location")).toContain(
      encodeURIComponent("https://example.com/api/oauth/callback?state=s1"),
    );
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:state:s1",
      expect.objectContaining({
        client_id: CLIENT_ID,
        redirect_uri: "https://cb.example/cb",
        code_challenge: ch,
        scope: "openid",
      }),
      600,
    );
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin).toBe(new URL(AUTH_BASE).origin);
    expect(loc.searchParams.get("return_to")).toBe(
      "https://example.com/api/oauth/callback?state=s1",
    );
    const stored = mockSetWithTTL.mock.calls.find(
      (c) => c[0] === "oauth:state:s1",
    )?.[1];
    expect((stored as Record<string, unknown>).magic).toBeUndefined();
  });

  it("accepts redirect_uri in client registry", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      redirectUris: ["https://other.example/cb", "https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
      scope: "openid search magic",
    } as never);
    const qs = baseParams({ redirect_uri: "https://cb.example/cb" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
  });

  it("accepts loopback http redirect_uri when registered", async () => {
    // Setup
    for (const uri of [
      "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
      "http://127.0.0.1:8080/cb",
      "http://[::1]:8080/cb",
    ]) {
      mockResolveClient.mockResolvedValue({
        id: "searchpoint-mcp-a1b2c3",
        redirectUris: [uri],
        tokenEndpointAuthMethod: "client_secret_post",
        scope: "openid search magic",
      } as never);
      const qs = baseParams({ redirect_uri: uri });
      const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

      // Act
      const res = await GET(req as unknown as Request);

      // Assert
      expect(res.status).toBe(302);
    }
  });

  it("rejects non-loopback http redirect_uri", async () => {
    // Setup
    const qs = baseParams({ redirect_uri: "http://evil.example/cb" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(400);
  });

  it("rejects scope not allowed for client", async () => {
    // Setup
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      redirectUris: ["https://cb.example/cb"],
      tokenEndpointAuthMethod: "client_secret_post",
      scope: "openid search",
    } as never);
    const qs = baseParams({ scope: "openid admin" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_scope");
  });

  it("redirects to magic UI when scope includes magic", async () => {
    // Setup
    const qs = baseParams({ scope: "openid magic", state: "m1" });
    const req = new Request(`https://example.com/api/oauth/authorize?${qs}`);

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/oauth\/magic/);
    expect(res.headers.get("location")).toContain("state=m1");
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:state:m1",
      expect.any(Object),
      600,
    );
  });

  it("redirects to magic UI when idp=magic", async () => {
    // Setup
    const p = new URLSearchParams(baseParams({ state: "m2" }));
    p.set("idp", "magic");
    const req = new Request(
      `https://example.com/api/oauth/authorize?${p.toString()}`,
    );

    // Act
    const res = await GET(req as unknown as Request);

    // Assert
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/oauth\/magic/);
    expect(res.headers.get("location")).toContain("state=m2");
  });

  it("marks magic state so consent is skipped later", async () => {
    // Setup
    const p = new URLSearchParams(baseParams({ state: "m3" }));
    p.set("idp", "magic");
    const req = new Request(
      `https://example.com/api/oauth/authorize?${p.toString()}`,
    );

    // Act
    await GET(req as unknown as Request);

    // Assert
    const stored = mockSetWithTTL.mock.calls.find(
      (c) => c[0] === "oauth:state:m3",
    )?.[1];
    expect((stored as Record<string, unknown>).magic).toBe(true);
  });
});
