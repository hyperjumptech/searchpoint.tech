import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("./postgres", () => ({ getPostgresPool: () => ({ query }) }));
import { createStaticClient } from "./oauth-static-client";

describe("static OAuth clients", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue({ rows: [] });
  });
  it("rejects an empty name before touching the database", async () => {
    await expect(
      createStaticClient({ name: "", redirectUri: "https://example.com/cb" }),
    ).rejects.toThrow("client name");
  });
  it("rejects fragments and unsupported scopes", async () => {
    await expect(
      createStaticClient({
        name: "app",
        redirectUri: "https://example.com/cb#x",
      }),
    ).rejects.toThrow("redirect");
    await expect(
      createStaticClient({
        name: "app",
        redirectUri: "https://example.com/cb",
        scopes: ["not-allowed"],
      }),
    ).rejects.toThrow("scope");
  });
  it("returns a one-time secret and never persists plaintext", async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [
        {
          client_id: "id",
          name: "app",
          redirect_uri: "https://example.com",
          scopes: ["search"],
          enabled: true,
          revoked: false,
        },
      ],
    });
    const result = await createStaticClient({
      name: " app ",
      redirectUri: "https://example.com",
    });
    expect(result.clientSecret).toBeTruthy();
    expect(query.mock.calls[1][1][1]).not.toBe(result.clientSecret);
    expect(result.client.name).toBe("app");
    expect(JSON.stringify(result.client)).not.toContain("secret");
    expect(JSON.stringify(result.client)).not.toContain("hash");
    expect(query.mock.calls.at(-1)?.[0] ?? "").toContain("client_secret_hash");
    expect(query.mock.calls.at(-1)?.[1][1]).not.toBe(result.clientSecret);
  });
  it("retries generated ID collisions", async () => {
    query.mockRejectedValueOnce({ code: "23505" }).mockResolvedValueOnce({
      rows: [
        {
          client_id: "id",
          name: "app",
          redirect_uri: "https://example.com",
          scopes: ["search"],
          enabled: true,
          revoked: false,
        },
      ],
    });
    await expect(
      createStaticClient({ name: "app", redirectUri: "https://example.com" }),
    ).resolves.toBeTruthy();
    expect(query).toHaveBeenCalledTimes(2);
  });
  it("verifies, rotates, disables and revokes without exposing hashes", async () => {
    query.mockResolvedValueOnce({
      rows: [{ client_secret_hash: "bad", enabled: true, revoked: false }],
    });
    await expect(
      (await import("./oauth-static-client")).verifyStaticClientSecret(
        "id",
        "secret",
      ),
    ).resolves.toBe(false);
    query.mockResolvedValueOnce({ rows: [{ client_id: "id" }], rowCount: 1 });
    const rotated = await (
      await import("./oauth-static-client")
    ).rotateStaticClientSecret("id");
    expect(rotated.clientSecret).toBeTruthy();
    query.mockResolvedValueOnce({
      rows: [
        {
          client_id: "id",
          name: "app",
          redirect_uri: "https://example.com",
          scopes: ["search"],
          enabled: false,
          revoked: true,
        },
      ],
    });
    const client = await (
      await import("./oauth-static-client")
    ).revokeStaticClient("id");
    expect(client?.revoked).toBe(true);
  });
  it("invalidates the old secret and accepts the rotated secret", async () => {
    const mod = await import("./oauth-static-client");
    const oldSecret = "old-secret";
    query.mockResolvedValueOnce({
      rows: [
        {
          client_secret_hash: mod.hashStaticClientSecret(oldSecret),
          enabled: true,
          revoked: false,
        },
      ],
    });
    await expect(mod.verifyStaticClientSecret("id", oldSecret)).resolves.toBe(
      true,
    );
    query.mockResolvedValueOnce({ rows: [{ client_id: "id" }], rowCount: 1 });
    const { clientSecret: newSecret } =
      await mod.rotateStaticClientSecret("id");
    query.mockResolvedValueOnce({
      rows: [
        {
          client_secret_hash: mod.hashStaticClientSecret(oldSecret),
          enabled: true,
          revoked: false,
        },
      ],
    });
    await expect(mod.verifyStaticClientSecret("id", newSecret)).resolves.toBe(
      false,
    );
    query.mockResolvedValueOnce({
      rows: [
        {
          client_secret_hash: mod.hashStaticClientSecret(newSecret),
          enabled: true,
          revoked: false,
        },
      ],
    });
    await expect(mod.verifyStaticClientSecret("id", newSecret)).resolves.toBe(
      true,
    );
  });
  it("rejects verification for disabled and revoked clients", async () => {
    const mod = await import("./oauth-static-client");
    query.mockResolvedValueOnce({
      rows: [
        {
          client_secret_hash: mod.hashStaticClientSecret("s"),
          enabled: false,
          revoked: false,
        },
      ],
    });
    await expect(mod.verifyStaticClientSecret("id", "s")).resolves.toBe(false);
    query.mockResolvedValueOnce({
      rows: [
        {
          client_secret_hash: mod.hashStaticClientSecret("s"),
          enabled: true,
          revoked: true,
        },
      ],
    });
    await expect(mod.verifyStaticClientSecret("id", "s")).resolves.toBe(false);
  });
  it.each([
    [
      "get",
      async (m: typeof import("./oauth-static-client")) =>
        m.getStaticClient("id"),
    ],
    [
      "verify",
      async (m: typeof import("./oauth-static-client")) =>
        m.verifyStaticClientSecret("id", "s"),
    ],
    [
      "rotate",
      async (m: typeof import("./oauth-static-client")) =>
        m.rotateStaticClientSecret("id"),
    ],
    [
      "update",
      async (m: typeof import("./oauth-static-client")) =>
        m.updateStaticClient("id", { name: "new" }),
    ],
    [
      "list",
      async (m: typeof import("./oauth-static-client")) =>
        m.listStaticClients(),
    ],
    [
      "revoke",
      async (m: typeof import("./oauth-static-client")) =>
        m.revokeStaticClient("id"),
    ],
  ])("propagates safe DB failure for %s", async (_name, operation) => {
    query.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(
      operation(await import("./oauth-static-client")),
    ).rejects.toThrow("database unavailable");
  });
  it("fails closed on database errors", async () => {
    query.mockRejectedValueOnce(new Error("database down"));
    await expect(
      createStaticClient({ name: "app", redirectUri: "https://example.com" }),
    ).rejects.toThrow("database down");
  });
});
