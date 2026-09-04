import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.clearAllMocks();
});

const { mockGetJSON, mockSetPersistent, mockDelKey } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
  mockSetPersistent: vi.fn(async () => {}),
  mockDelKey: vi.fn(async () => {}),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: mockGetJSON,
  setWithTTL: vi.fn(async () => {}),
  setPersistent: mockSetPersistent,
  delKey: mockDelKey,
  oauthKeys: {
    client: (id: string) => `oauth:client:${id}`,
    clientByToken: (tokenId: string) => `oauth:client:bytoken:${tokenId}`,
  },
}));

vi.mock("@/lib/oauth-dcr", () => ({
  hashSecret: (s: string) => `hash(${s})`,
}));

import {
  registerClient,
  resolveClient,
  deleteClient,
  clientExists,
  getClientByTokenRegistration,
} from "@/lib/oauth-dcr-store";

const record = {
  id: "searchpoint-mcp-a1b2c3",
  name: "Open WebUI",
  secretHash: "hash(sekret)",
  redirectUris: ["http://localhost:8080/cb"],
  scope: "openid search",
  tokenEndpointAuthMethod: "client_secret_post",
  registrationTokenId: "sp_abc123",
  createdAt: 1000,
};

describe("registerClient", () => {
  it("stores a hashed client record persistently", async () => {
    await registerClient({
      id: record.id,
      name: record.name,
      secret: "sekret",
      redirectUris: record.redirectUris,
      scope: record.scope,
      tokenEndpointAuthMethod: record.tokenEndpointAuthMethod,
      registrationTokenId: record.registrationTokenId,
    });
    expect(mockSetPersistent).toHaveBeenCalledWith(
      "oauth:client:searchpoint-mcp-a1b2c3",
      expect.objectContaining({
        secretHash: "hash(sekret)",
        registrationTokenId: "sp_abc123",
      }),
    );
  });

  it("writes the client id into the registration-token index", async () => {
    await registerClient({
      id: record.id,
      name: record.name,
      secret: "sekret",
      redirectUris: record.redirectUris,
      scope: record.scope,
      tokenEndpointAuthMethod: record.tokenEndpointAuthMethod,
      registrationTokenId: record.registrationTokenId,
    });
    const calls = (
      mockSetPersistent.mock.calls as unknown as Array<[string, unknown]>
    ).filter((c) => c[0] === "oauth:client:bytoken:sp_abc123");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(["searchpoint-mcp-a1b2c3"]);
  });

  it("appends to and dedupes the registration-token index", async () => {
    mockGetJSON.mockResolvedValue(["searchpoint-mcp-a1b2c3", "other-client"]);
    await registerClient({
      id: record.id,
      name: record.name,
      secret: "sekret",
      redirectUris: record.redirectUris,
      scope: record.scope,
      tokenEndpointAuthMethod: record.tokenEndpointAuthMethod,
      registrationTokenId: record.registrationTokenId,
    });
    const calls = (
      mockSetPersistent.mock.calls as unknown as Array<[string, unknown]>
    ).filter((c) => c[0] === "oauth:client:bytoken:sp_abc123");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(["searchpoint-mcp-a1b2c3", "other-client"]);
  });
});

describe("resolveClient", () => {
  it("returns record when found", async () => {
    mockGetJSON.mockResolvedValue(record);
    await expect(resolveClient("searchpoint-mcp-a1b2c3")).resolves.toEqual(
      record,
    );
  });

  it("returns null when not found", async () => {
    mockGetJSON.mockResolvedValue(null);
    await expect(resolveClient("nope")).resolves.toBeNull();
  });
});

describe("deleteClient / clientExists", () => {
  it("deleteClient calls delKey", async () => {
    await deleteClient("searchpoint-mcp-a1b2c3");
    expect(mockDelKey).toHaveBeenCalledWith(
      "oauth:client:searchpoint-mcp-a1b2c3",
    );
  });

  it("clientExists true when record found", async () => {
    mockGetJSON.mockResolvedValue(record);
    await expect(clientExists("searchpoint-mcp-a1b2c3")).resolves.toBe(true);
  });
});

const mockGetJSONForIndex = vi.fn(async (key: string) => {
  if (key === "oauth:client:bytoken:sp_abc123")
    return ["searchpoint-mcp-a1b2c3"];
  return record;
});

describe("getClientByTokenRegistration", () => {
  it("reads the token index", async () => {
    mockGetJSON.mockImplementation(mockGetJSONForIndex);
    const ids = await getClientByTokenRegistration("sp_abc123");
    expect(ids).toEqual(["searchpoint-mcp-a1b2c3"]);
  });

  it("returns empty array when index key is absent", async () => {
    mockGetJSON.mockResolvedValue(null);
    await expect(getClientByTokenRegistration("sp_none")).resolves.toEqual([]);
  });
});

describe("deleteClient / index", () => {
  it("removes id from the token index", async () => {
    mockGetJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:client:bytoken:sp_abc123") {
        return ["searchpoint-mcp-a1b2c3", "other"];
      }
      if (key === "oauth:client:searchpoint-mcp-a1b2c3") return record;
      return null;
    });
    await deleteClient("searchpoint-mcp-a1b2c3");
    const calls = (
      mockSetPersistent.mock.calls as unknown as Array<[string, unknown]>
    ).filter((c) => c[0].includes("bytoken"));
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][1]).toEqual(["other"]);
  });

  it("deletes the token index when the last client is removed", async () => {
    mockGetJSON.mockImplementation(async (key: string) => {
      if (key === "oauth:client:bytoken:sp_abc123") {
        return ["searchpoint-mcp-a1b2c3"];
      }
      if (key === "oauth:client:searchpoint-mcp-a1b2c3") return record;
      return null;
    });
    await deleteClient("searchpoint-mcp-a1b2c3");
    expect(mockDelKey).toHaveBeenCalledWith("oauth:client:bytoken:sp_abc123");
  });
});
