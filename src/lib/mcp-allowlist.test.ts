import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { query, connect, release, env, parseClientsEnv } = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
  release: vi.fn(),
  env: {
    OAUTH_REGISTERED_CLIENTS:
      "StartGPT|sp_abc123|http://localhost:8080/callback;Claude Desktop|cd_def456|https://claude.ai/callback",
  },
  parseClientsEnv: vi.fn((raw: string) => ({
    clients: raw.split(";").map((entry) => {
      const [name, token, redirectUri] = entry.split("|");
      return { name, token, redirectUri };
    }),
    byToken: new Map(),
  })),
}));

vi.mock("./postgres", () => ({
  getPostgresPool: () => ({ query, connect }),
}));
vi.mock("server-only", () => ({}));
vi.mock("./env.server", () => ({ env }));
vi.mock("./oauth-dcr", () => ({ parseClientsEnv }));

import {
  AllowlistValidationError,
  DuplicateAllowedApplicationError,
  DuplicateDcrPolicyError,
  createAllowedApplication,
  deleteAllowedApplication,
  ensureMcpAllowlist,
  isMcpClientAllowed,
  isGeneratedClientAllowed,
  listAllowedApplications,
  updateAllowedApplication,
  associateDcrClientId,
  createDcrPolicy,
  deleteDcrPolicy,
  findEnabledDcrPolicyByRedirectUri,
  updateDcrPolicy,
} from "./mcp-allowlist";

const row = {
  id: "app-1",
  client_id: "client-1",
  name: "Example",
  description: null,
  enabled: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

describe("MCP allowlist repository", () => {
  beforeEach(() => {
    query.mockReset();
    connect.mockReset();
    release.mockReset();
    parseClientsEnv.mockClear();
  });

  afterEach(() => vi.restoreAllMocks());

  it("creates the table with bounded columns and indexes", async () => {
    const clientQuery = vi.fn().mockResolvedValue({ rows: [] });
    connect.mockResolvedValue({ query: clientQuery, release });

    await ensureMcpAllowlist();

    const createSql = clientQuery.mock.calls[1][0];
    expect(createSql).toContain(
      "CREATE TABLE IF NOT EXISTS mcp_allowed_applications",
    );
    expect(createSql).toContain("client_id varchar(255) NOT NULL UNIQUE");
    expect(createSql).toContain("name varchar(255) NOT NULL");
    expect(createSql).toContain("description varchar(2000)");
  });

  it("maps rows when listing applications", async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(listAllowedApplications()).resolves.toEqual([
      {
        id: row.id,
        clientId: row.client_id,
        name: row.name,
        description: row.description,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ]);
    expect(query.mock.calls[0][0]).toContain("SELECT");
    expect(query.mock.calls[0][1]).toEqual([]);
  });

  it("creates an application with parameterized values", async () => {
    query.mockResolvedValue({ rows: [row] });

    await createAllowedApplication({
      clientId: "client-1",
      name: "Example",
      description: null,
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO mcp_allowed_applications"),
      ["client-1", "Example", null],
    );
  });

  it("updates an application and returns null when no row exists", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await expect(
      updateAllowedApplication("missing", { enabled: false }),
    ).resolves.toBeNull();
    expect(query.mock.calls[0][1]).toEqual([false, "missing"]);
  });

  it("deletes an application and reports whether it existed", async () => {
    query.mockResolvedValue({ rowCount: 1, rows: [] });

    await expect(deleteAllowedApplication("app-1")).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM mcp_allowed_applications"),
      ["app-1"],
    );
  });

  it("checks PostgreSQL on every authorization lookup and fails closed for disabled rows", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ exists: true }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(isMcpClientAllowed("client-1")).resolves.toBe(true);
    await expect(isMcpClientAllowed("client-1")).resolves.toBe(false);
    expect(query.mock.calls[0][1]).toEqual(["client-1"]);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects empty and oversized input before querying", async () => {
    await expect(
      createAllowedApplication({ clientId: "", name: "Example" }),
    ).rejects.toBeInstanceOf(AllowlistValidationError);
    await expect(
      createAllowedApplication({ clientId: "client", name: "x".repeat(256) }),
    ).rejects.toBeInstanceOf(AllowlistValidationError);
    expect(query).not.toHaveBeenCalled();
  });

  it("uses enabled DCR association and never falls back for disabled association", async () => {
    query.mockResolvedValueOnce({ rows: [{ enabled: true }] });
    await expect(isGeneratedClientAllowed("generated-1")).resolves.toBe(true);

    query.mockResolvedValueOnce({ rows: [{ enabled: false }] });
    await expect(isGeneratedClientAllowed("generated-1")).resolves.toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("falls back to the static allowlist only when no DCR association exists", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ exists: true }] });
    await expect(isGeneratedClientAllowed("legacy-1")).resolves.toBe(true);
    expect(query.mock.calls[1][0]).toContain("mcp_allowed_applications");
  });

  it("fails closed when the DCR authorization lookup fails", async () => {
    const failure = new Error("database unavailable");
    query.mockRejectedValueOnce(failure);
    await expect(isGeneratedClientAllowed("generated-1")).rejects.toBe(failure);
  });

  it("maps PostgreSQL unique violations to a repository conflict error", async () => {
    query.mockRejectedValue({ code: "23505" });

    await expect(
      createAllowedApplication({ clientId: "client-1", name: "Example" }),
    ).rejects.toBeInstanceOf(DuplicateAllowedApplicationError);
  });

  it("initializes and seeds an empty table in one transaction", async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ initialized: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValue({ rows: [row] });
    connect.mockResolvedValue({ query: clientQuery, release });

    await ensureMcpAllowlist();

    expect(connect).toHaveBeenCalledOnce();
    expect(clientQuery).toHaveBeenCalledWith("BEGIN");
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(clientQuery.mock.calls).toContainEqual([
      expect.stringContaining("INSERT INTO mcp_allowed_applications"),
      ["sp_abc123", "StartGPT", "http://localhost:8080/callback"],
    ]);
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not reseed after an administrator deletes the final row", async () => {
    // Setup
    const firstInitialization = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ initialized: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValue({ rows: [] });
    const afterDeletion = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValue({ rows: [] });
    connect
      .mockResolvedValueOnce({ query: firstInitialization, release })
      .mockResolvedValueOnce({ query: afterDeletion, release });
    query.mockResolvedValue({ rowCount: 1, rows: [] });

    // Act
    await ensureMcpAllowlist();
    await deleteAllowedApplication("app-1");
    await ensureMcpAllowlist();

    // Assert
    expect(parseClientsEnv).toHaveBeenCalledTimes(3);
    expect(afterDeletion.mock.calls).not.toContainEqual([
      expect.stringContaining("INSERT INTO mcp_allowed_applications"),
      expect.any(Array),
    ]);
  });

  it("does not import env registrations when the table already has rows", async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ initialized: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValue({ rows: [] });
    connect.mockResolvedValue({ query: clientQuery, release });

    await ensureMcpAllowlist();

    expect(parseClientsEnv).toHaveBeenCalledTimes(2);
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
  });

  it("propagates database failures", async () => {
    const failure = new Error("database unavailable");
    query.mockRejectedValue(failure);

    await expect(isMcpClientAllowed("client-1")).rejects.toBe(failure);
  });

  it("creates the DCR schema idempotently", async () => {
    const clientQuery = vi.fn().mockResolvedValue({ rows: [] });
    connect.mockResolvedValue({ query: clientQuery, release });
    await ensureMcpAllowlist();
    expect(clientQuery.mock.calls).toContainEqual([
      expect.stringContaining("CREATE TABLE IF NOT EXISTS mcp_dcr_policies"),
    ]);
  });

  it("supports DCR policy CRUD and client association", async () => {
    query
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });
    await createDcrPolicy({
      name: "Example",
      redirectUri: "https://example.test/callback",
    });
    await updateDcrPolicy("app-1", { enabled: false });
    await associateDcrClientId("app-1", "generated-client");
    await deleteDcrPolicy("app-1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("mcp_dcr_clients"),
      ["app-1", "generated-client"],
    );
  });

  it("matches loopback ports but requires exact non-loopback redirects", async () => {
    query.mockResolvedValue({
      rows: [
        {
          ...row,
          redirect_uri: "http://127.0.0.1:3000/callback",
          id: "policy-1",
        },
        {
          ...row,
          redirect_uri: "https://example.test/callback",
          id: "policy-2",
        },
      ],
    });
    query.mockResolvedValueOnce({
      rows: [
        {
          ...row,
          redirect_uri: "http://127.0.0.1:3000/callback",
          id: "policy-1",
        },
      ],
    });
    await expect(
      findEnabledDcrPolicyByRedirectUri("http://localhost:19876/callback"),
    ).resolves.toBeTruthy();
    query.mockResolvedValueOnce({
      rows: [
        {
          ...row,
          redirect_uri: "https://example.test/callback",
          id: "policy-2",
        },
      ],
    });
    await expect(
      findEnabledDcrPolicyByRedirectUri("https://example.test:444/callback"),
    ).resolves.toBeNull();
  });

  it("maps duplicate redirect URIs to a DCR policy conflict", async () => {
    query.mockRejectedValue({ code: "23505" });
    await expect(
      createDcrPolicy({
        name: "Example",
        redirectUri: "https://example.test/callback",
      }),
    ).rejects.toBeInstanceOf(DuplicateDcrPolicyError);
  });
});
