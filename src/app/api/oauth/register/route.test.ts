import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockResolveToken,
  mockResolveByRedirectUri,
  mockResolveByName,
  mockValidate,
  mockGenId,
  mockGenSecret,
  mockRegister,
  mockGetByToken,
  mockDeleteClient,
  mockResolveClient,
  mockPolicy,
  mockAssociate,
} = vi.hoisted(() => ({
  mockResolveToken: vi.fn(),
  mockResolveByRedirectUri: vi.fn(),
  mockResolveByName: vi.fn(),
  mockValidate: vi.fn(),
  mockGenId: vi.fn(() => "searchpoint-mcp-a1b2c3"),
  mockGenSecret: vi.fn(() => "sekret-abc"),
  mockRegister: vi.fn(async () => {}),
  mockGetByToken: vi.fn(async (): Promise<string[]> => []),
  mockDeleteClient: vi.fn(async () => {}),
  mockResolveClient: vi.fn(),
  mockPolicy: vi.fn(async () => null),
  mockAssociate: vi.fn(async () => {}),
}));

vi.mock("@/lib/oauth-dcr", () => ({
  resolveRegisteredToken: mockResolveToken,
  resolveRegisteredByRedirectUri: mockResolveByRedirectUri,
  resolveRegisteredByName: mockResolveByName,
  redirectUriMatches: vi.fn((a: string, b: string) => a === b),
  validateMetadata: mockValidate,
  generateClientId: mockGenId,
  generateClientSecret: mockGenSecret,
  hashSecret: vi.fn((s: string) => `hash(${s})`),
  MetadataError: class MetadataError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/oauth-dcr-store", () => ({
  registerClient: mockRegister,
  getClientByTokenRegistration: mockGetByToken,
  resolveClient: mockResolveClient,
  clientExists: vi.fn(),
  deleteClient: mockDeleteClient,
}));

vi.mock("@/lib/mcp-allowlist", () => ({
  findDcrPolicyByRedirectUri: mockPolicy,
  associateDcrClientId: mockAssociate,
}));

import { POST } from "@/app/api/oauth/register/route";
import { DELETE } from "@/app/api/oauth/register/[client_id]/route";
import { MetadataError } from "@/lib/oauth-dcr";

const validClient = {
  redirectUris: [
    "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
  ],
  grantTypes: ["authorization_code", "refresh_token"],
  responseTypes: ["code"],
  tokenEndpointAuthMethod: "client_secret_post",
  clientName: "Open WebUI",
  scope: "openid search",
};

function regReq(token: string | null, body: unknown) {
  return new Request("http://localhost:3000/api/oauth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe.skip("legacy DCR POST contract (static mode)", () => {
  beforeEach(() => {
    mockResolveToken.mockReset();
    mockResolveByRedirectUri.mockReset();
    mockValidate.mockReset();
    mockGenId.mockReset();
    mockGenSecret.mockReset();
    mockRegister.mockClear();
    mockGetByToken.mockClear();
    mockResolveToken.mockReturnValue({
      name: "StartGPT",
      token: "sp_abc123",
      redirectUri:
        "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
    });
    mockResolveByRedirectUri.mockReturnValue({
      name: "Open WebUI",
      token: "sp_abc123",
      redirectUri:
        "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
    });
    mockValidate.mockReturnValue(validClient);
    mockGetByToken.mockResolvedValue([]);
    mockPolicy.mockResolvedValue(null);
    mockAssociate.mockClear();
    mockDeleteClient.mockClear();
  });

  it("returns 401 when no token and redirect_uri unknown", async () => {
    mockResolveByRedirectUri.mockReturnValue(null);
    const res = await POST(regReq(null, validClient) as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token invalid and redirect_uri unknown", async () => {
    mockResolveToken.mockReturnValue(null);
    mockResolveByRedirectUri.mockReturnValue(null);
    const res = await POST(regReq("bad", validClient) as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("registers via redirect_uri match when no token supplied", async () => {
    const res = await POST(regReq(null, validClient) as unknown as Request);
    expect(res.status).toBe(201);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.client_name).toBe("Open WebUI");
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Open WebUI",
        registrationTokenId: "Open WebUI",
      }),
    );
  });

  it("rejects a legacy token when a governing policy is disabled", async () => {
    mockPolicy.mockResolvedValue({
      id: "policy-1",
      name: "Open WebUI",
      enabled: false,
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(401);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("cleans up Valkey client state when PostgreSQL association fails", async () => {
    mockPolicy.mockResolvedValue({
      id: "policy-1",
      name: "Open WebUI",
      enabled: true,
    });
    mockAssociate.mockRejectedValueOnce(new Error("db unavailable"));
    const res = await POST(regReq(null, validClient) as unknown as Request);
    expect(res.status).toBe(503);
    expect(mockDeleteClient).toHaveBeenCalledWith("searchpoint-mcp-a1b2c3");

    mockAssociate.mockResolvedValue(undefined);
    const retry = await POST(regReq(null, validClient) as unknown as Request);
    expect(retry.status).toBe(201);
  });

  it("returns 403 when redirect_uri does not match token", async () => {
    mockValidate.mockReturnValue({
      ...validClient,
      redirectUris: ["https://evil.example/cb"],
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost:3000/api/oauth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer sp_abc123",
      },
      body: "{not json",
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
  });

  it("returns 400 when validateMetadata throws", async () => {
    mockValidate.mockImplementation(() => {
      throw new Error("invalid scope");
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(400);
  });

  it("maps invalid scope to 400 invalid_scope", async () => {
    mockValidate.mockImplementation(() => {
      throw new MetadataError("invalid_scope", "invalid scope");
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    const j = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_scope");
  });

  it("maps invalid redirect_uri to 400 invalid_redirect_uri", async () => {
    mockValidate.mockImplementation(() => {
      throw new MetadataError("invalid_redirect_uri", "invalid redirect_uri");
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    const j = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_redirect_uri");
  });

  it("maps invalid grant_types to 400 invalid_request", async () => {
    mockValidate.mockImplementation(() => {
      throw new MetadataError("invalid_request", "invalid grant_types");
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    const j = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(j.error).toBe("invalid_request");
  });

  it("returns 409 when token already registered an active client", async () => {
    mockGetByToken.mockResolvedValue(["searchpoint-mcp-xyz"]);
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "client_already_registered" });
  });

  it("returns 409 when no token and entry name already registered", async () => {
    mockGetByToken.mockImplementation(async (key?: string) =>
      key === "Open WebUI" ? ["searchpoint-mcp-xyz"] : [],
    );
    const res = await POST(regReq(null, validClient) as unknown as Request);
    expect(res.status).toBe(409);
    expect(mockGetByToken).toHaveBeenCalledWith("Open WebUI");
  });

  it("registers and returns 201 with client credentials", async () => {
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.client_id).toBe("searchpoint-mcp-a1b2c3");
    expect(j.client_secret).toBe("sekret-abc");
    expect(j.redirect_uris).toEqual(validClient.redirectUris);
    expect(j.token_endpoint_auth_method).toBe("client_secret_post");
    expect(j.client_id_issued_at).toEqual(expect.any(Number));
    expect(j.client_secret_expires_at).toBe(0);
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "searchpoint-mcp-a1b2c3",
        secret: "sekret-abc",
        registrationTokenId: "sp_abc123",
      }),
    );
  });

  it("does not generate secret when token_endpoint_auth_method is none", async () => {
    mockValidate.mockReturnValue({
      ...validClient,
      tokenEndpointAuthMethod: "none",
    });
    const res = await POST(
      regReq("sp_abc123", validClient) as unknown as Request,
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.client_secret).toBeUndefined();
  });
});

function delReq(token: string | null, clientId: string) {
  return new Request(`http://localhost:3000/api/oauth/register/${clientId}`, {
    method: "DELETE",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function delCtx(clientId: string) {
  return { params: Promise.resolve({ client_id: clientId }) };
}

describe("DELETE /api/oauth/register/:client_id", () => {
  beforeEach(() => {
    mockResolveToken.mockReset();
    mockResolveByName.mockReset();
    mockResolveClient.mockReset();
    mockDeleteClient.mockClear();
    mockResolveToken.mockReturnValue({
      name: "StartGPT",
      token: "sp_abc123",
      redirectUri: "...",
    });
    mockResolveByName.mockReturnValue(null);
  });

  it("returns 401 when token missing", async () => {
    const res = await DELETE(
      delReq(null, "searchpoint-mcp-a1b2c3") as unknown as Request,
      delCtx("searchpoint-mcp-a1b2c3"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when credential invalid", async () => {
    mockResolveToken.mockReturnValue(null);
    mockResolveByName.mockReturnValue(null);
    const res = await DELETE(
      delReq("bad", "searchpoint-mcp-a1b2c3") as unknown as Request,
      delCtx("searchpoint-mcp-a1b2c3"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when entry name credential resolves to nothing", async () => {
    mockResolveToken.mockReturnValue(null);
    mockResolveByName.mockReturnValue(null);
    const res = await DELETE(
      delReq("Open WebUI", "searchpoint-mcp-a1b2c3") as unknown as Request,
      delCtx("searchpoint-mcp-a1b2c3"),
    );
    expect(res.status).toBe(401);
  });

  it("deletes via entry name credential when client registered without token", async () => {
    mockResolveToken.mockReturnValue(null);
    mockResolveByName.mockReturnValue({
      name: "Open WebUI",
      token: "sp_abc123",
      redirectUri: "...",
    });
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      registrationTokenId: "Open WebUI",
      redirectUris: [],
    } as never);
    const res = await DELETE(
      delReq("Open WebUI", "searchpoint-mcp-a1b2c3") as unknown as Request,
      delCtx("searchpoint-mcp-a1b2c3"),
    );
    expect(res.status).toBe(204);
    expect(mockDeleteClient).toHaveBeenCalledWith("searchpoint-mcp-a1b2c3");
  });

  it("returns 404 when client not found", async () => {
    mockResolveClient.mockResolvedValue(null);
    const res = await DELETE(
      delReq("sp_abc123", "searchpoint-mcp-nope") as unknown as Request,
      delCtx("searchpoint-mcp-nope"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when client belongs to another token", async () => {
    mockResolveClient.mockResolvedValue({
      id: "c",
      registrationTokenId: "cd_def456",
      redirectUris: [],
    } as never);
    const res = await DELETE(
      delReq("sp_abc123", "searchpoint-mcp-c") as unknown as Request,
      delCtx("searchpoint-mcp-c"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 204 and deletes when authorized", async () => {
    mockResolveClient.mockResolvedValue({
      id: "searchpoint-mcp-a1b2c3",
      registrationTokenId: "sp_abc123",
      redirectUris: [],
    } as never);
    const res = await DELETE(
      delReq("sp_abc123", "searchpoint-mcp-a1b2c3") as unknown as Request,
      delCtx("searchpoint-mcp-a1b2c3"),
    );
    expect(res.status).toBe(204);
    expect(mockDeleteClient).toHaveBeenCalledWith("searchpoint-mcp-a1b2c3");
  });
});
