import { describe, it, expect, vi } from "vitest";
import { createHash } from "crypto";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    OAUTH_REGISTERED_CLIENTS:
      "StartGPT|sp_abc123|http://localhost:8080/oauth/clients/mcp:searchpoint/callback;" +
      "Claude Desktop|cd_def456|https://claude.ai/oauth/callback",
    OAUTH_SCOPES: "openid search",
  },
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

import {
  parseClientsEnv,
  resolveRegisteredByRedirectUri,
  resolveRegisteredToken,
  validateMetadata,
  generateClientId,
  generateClientSecret,
  hashSecret,
} from "@/lib/oauth-dcr";

const VALID_RAW =
  "StartGPT|sp_abc123|http://localhost:8080/oauth/clients/mcp:searchpoint/callback;" +
  "Claude Desktop|cd_def456|https://claude.ai/oauth/callback";

describe("parseClientsEnv", () => {
  it("parses multiple entries with name, token, redirect_uri", () => {
    const { clients } = parseClientsEnv(VALID_RAW);
    expect(clients).toHaveLength(2);
    expect(clients[0]).toEqual({
      name: "StartGPT",
      token: "sp_abc123",
      redirectUri:
        "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
    });
    expect(clients[1].name).toBe("Claude Desktop");
  });

  it("builds a byToken lookup", () => {
    const { byToken } = parseClientsEnv(VALID_RAW);
    expect(byToken.get("sp_abc123")?.redirectUri).toContain("mcp:searchpoint");
    expect(byToken.get("cd_def456")?.name).toBe("Claude Desktop");
  });

  it("throws on malformed entry (missing fields)", () => {
    expect(() => parseClientsEnv("StartGPT|sp_abc123")).toThrow();
    expect(() => parseClientsEnv("StartGPT||http://x")).toThrow();
    expect(() => parseClientsEnv("|sp_abc123|http://x")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => parseClientsEnv("")).toThrow();
  });
});

describe("resolveRegisteredToken", () => {
  it("returns the matching registered client", () => {
    expect(resolveRegisteredToken("sp_abc123")?.name).toBe("StartGPT");
  });

  it("returns null for unknown token", () => {
    expect(resolveRegisteredToken("nope")).toBeNull();
  });
});

describe("resolveRegisteredByRedirectUri", () => {
  it("returns the registered client owning that redirect_uri", () => {
    expect(
      resolveRegisteredByRedirectUri(
        "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
      )?.name,
    ).toBe("StartGPT");
    expect(
      resolveRegisteredByRedirectUri("https://claude.ai/oauth/callback")?.name,
    ).toBe("Claude Desktop");
  });

  it("returns null when no entry owns the redirect_uri", () => {
    expect(
      resolveRegisteredByRedirectUri("https://evil.example/cb"),
    ).toBeNull();
  });
});

describe("validateMetadata", () => {
  const base = { redirect_uris: ["http://localhost:8080/cb"] };

  it("accepts valid minimal metadata", () => {
    const out = validateMetadata({ ...base });
    expect(out.redirectUris).toEqual(["http://localhost:8080/cb"]);
    expect(out.grantTypes).toEqual(["authorization_code"]);
    expect(out.responseTypes).toEqual(["code"]);
    expect(out.tokenEndpointAuthMethod).toBe("client_secret_post");
  });

  it("rejects non-https / non-loopback redirect_uri", () => {
    expect(() =>
      validateMetadata({ redirect_uris: ["http://evil.example/cb"] }),
    ).toThrowError(expect.objectContaining({ code: "invalid_redirect_uri" }));
  });

  it("rejects redirect_uri with fragment", () => {
    expect(() =>
      validateMetadata({ redirect_uris: ["https://cb.example/cb#x"] }),
    ).toThrowError(expect.objectContaining({ code: "invalid_redirect_uri" }));
  });

  it("rejects empty redirect_uris", () => {
    expect(() => validateMetadata({ redirect_uris: [] })).toThrowError(
      expect.objectContaining({ code: "invalid_redirect_uri" }),
    );
  });

  it("rejects invalid grant_types", () => {
    expect(() =>
      validateMetadata({ ...base, grant_types: ["client_credentials"] }),
    ).toThrowError(expect.objectContaining({ code: "invalid_request" }));
  });

  it("rejects invalid response_types", () => {
    expect(() =>
      validateMetadata({ ...base, response_types: ["token"] }),
    ).toThrowError(expect.objectContaining({ code: "invalid_request" }));
  });

  it("rejects invalid token_endpoint_auth_method", () => {
    expect(() =>
      validateMetadata({
        ...base,
        token_endpoint_auth_method: "client_secret_jwt",
      }),
    ).toThrowError(expect.objectContaining({ code: "invalid_request" }));
  });

  it("rejects scope outside allowed set", () => {
    expect(() => validateMetadata({ ...base, scope: "openid admin" })).toThrow(
      expect.objectContaining({ code: "invalid_scope" }),
    );
  });

  it("accepts scope inside allowed set", () => {
    const out = validateMetadata({ ...base, scope: "openid search" });
    expect(out.scope).toBe("openid search");
  });
});

describe("generateClientId / generateClientSecret / hashSecret", () => {
  it("generateClientId has searchpoint-mcp- prefix", () => {
    expect(generateClientId()).toMatch(/^searchpoint-mcp-/);
  });

  it("generateClientSecret returns non-empty string", () => {
    expect(generateClientSecret().length).toBeGreaterThan(16);
  });

  it("hashSecret is deterministic sha256 hex", () => {
    const a = hashSecret("s3cret");
    const b = hashSecret("s3cret");
    expect(a).toBe(b);
    expect(a).toBe(createHash("sha256").update("s3cret").digest("hex"));
  });
});
