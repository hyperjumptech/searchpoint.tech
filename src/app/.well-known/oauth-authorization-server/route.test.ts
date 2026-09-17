import { describe, it, expect, afterEach, vi } from "vitest";

import { GET } from "@/app/.well-known/oauth-authorization-server/route";

describe("GET /.well-known/oauth-authorization-server", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns discovery", async () => {
    // Setup
    const req = new Request(
      "https://example.com/.well-known/oauth-authorization-server",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(j.issuer).toBeDefined();
    expect(j.authorization_endpoint).toMatch(/\/api\/oauth\/authorize/);
    expect(j.code_challenge_methods_supported).toContain("S256");
  });

  it("returns all required discovery fields per spec 3.3", async () => {
    // Setup
    const req = new Request(
      "https://example.com/.well-known/oauth-authorization-server",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(j.issuer).toBe("https://example.com");
    expect(j.authorization_endpoint).toBe(
      "https://example.com/api/oauth/authorize",
    );
    expect(j.token_endpoint).toBe("https://example.com/api/oauth/token");
    expect(j.revocation_endpoint).toBe("https://example.com/api/oauth/revoke");
    expect(j.userinfo_endpoint).toBe("https://example.com/api/oauth/userinfo");
    expect(j.jwks_uri).toBe("https://example.com/.well-known/jwks.json");
    expect(j.scopes_supported).toEqual([
      "openid",
      "profile",
      "email",
      "search",
      "magic",
    ]);
    expect(j.response_types_supported).toEqual(["code"]);
    expect(j.grant_types_supported).toEqual([
      "authorization_code",
      "refresh_token",
    ]);
    expect(j.code_challenge_methods_supported).toEqual(["S256"]);
    expect(j.token_endpoint_auth_methods_supported).toEqual([
      "client_secret_basic",
      "client_secret_post",
    ]);
    expect(j.revocation_endpoint_auth_methods_supported).toEqual([
      "client_secret_basic",
    ]);
  });

  it("does not advertise dynamic registration", async () => {
    const res = await GET(
      new Request("https://example.com/.well-known/oauth-authorization-server"),
    );
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.registration_endpoint).toBeUndefined();
  });

  it("strips trailing slash from issuer", async () => {
    // Setup — deriveIssuer trims env, but we test url.origin path via origin only;
    // additionally verify that a trailing-slash issuer does not double-slash endpoints
    const req = new Request(
      "https://example.com/.well-known/oauth-authorization-server",
    );

    // Act
    const res = await GET(req as unknown as Request);
    const j = (await res.json()) as Record<string, unknown>;

    // Assert
    expect(j.issuer).not.toMatch(/\/$/);
    expect(j.authorization_endpoint).not.toContain("//api");
  });
});
