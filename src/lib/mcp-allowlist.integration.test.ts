import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("MCP allowlist PostgreSQL integration", () => {
  const schema = `mcp_allowlist_test_${process.pid}_${Date.now()}`;
  const seededClientId = "task7-seeded-client";
  const createdClientId = "task7-admin-created-client";
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalRegisteredClients = process.env.OAUTH_REGISTERED_CLIENTS;
  const originalAdminUsername = process.env.MCP_ADMIN_USERNAME;
  const originalAdminPassword = process.env.MCP_ADMIN_PASSWORD;
  let adminPool: Pool;
  let repositoryPool: Pool | undefined;
  let allowlist: typeof import("./mcp-allowlist");
  let adminApplicationsRoute:
    | typeof import("../app/api/admin/mcp/applications/route")
    | undefined;
  let schemaCreated = false;

  beforeAll(async () => {
    if (!testDatabaseUrl) return;

    adminPool = new Pool({ connectionString: testDatabaseUrl });
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;

    const repositoryUrl = new URL(testDatabaseUrl);
    repositoryUrl.searchParams.set("options", `-c search_path=${schema}`);
    process.env.DATABASE_URL = repositoryUrl.toString();
    process.env.OAUTH_REGISTERED_CLIENTS = `Task 7 seed|${seededClientId}|http://localhost:3000/callback`;
    process.env.MCP_ADMIN_USERNAME = "task7-admin";
    process.env.MCP_ADMIN_PASSWORD = "task7-password";

    allowlist = await import("./mcp-allowlist");
    repositoryPool = (await import("./postgres")).getPostgresPool();
    adminApplicationsRoute =
      await import("../app/api/admin/mcp/applications/route");
  });

  afterAll(async () => {
    try {
      if (repositoryPool) await repositoryPool.end();
      if (schemaCreated && adminPool) {
        await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
      }
      if (adminPool) await adminPool.end();
    } finally {
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
      if (originalRegisteredClients === undefined)
        delete process.env.OAUTH_REGISTERED_CLIENTS;
      else process.env.OAUTH_REGISTERED_CLIENTS = originalRegisteredClients;
      if (originalAdminUsername === undefined)
        delete process.env.MCP_ADMIN_USERNAME;
      else process.env.MCP_ADMIN_USERNAME = originalAdminUsername;
      if (originalAdminPassword === undefined)
        delete process.env.MCP_ADMIN_PASSWORD;
      else process.env.MCP_ADMIN_PASSWORD = originalAdminPassword;
    }
  });

  it("initializes a fresh schema before an authenticated admin list", async () => {
    const response = await adminApplicationsRoute!.GET(
      new Request("http://localhost/api/admin/mcp/applications", {
        headers: {
          authorization: `Basic ${Buffer.from("task7-admin:task7-password").toString("base64")}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).applications).toHaveLength(1);
  });

  it("initializes, seeds, and enforces CRUD state in an isolated schema", async () => {
    // Setup
    await allowlist.ensureMcpAllowlist();

    // Act
    const seeded = await allowlist.listAllowedApplications();
    const deniedBeforeApproval =
      await allowlist.isMcpClientAllowed(createdClientId);
    const created = await allowlist.createAllowedApplication({
      clientId: createdClientId,
      name: "Admin-created fixture",
      description: "Task 7 integration fixture",
    });
    const initiallyAllowed =
      await allowlist.isMcpClientAllowed(createdClientId);
    const disabled = await allowlist.updateAllowedApplication(created.id, {
      enabled: false,
    });
    const allowedAfterDisable =
      await allowlist.isMcpClientAllowed(createdClientId);
    const deleted = await allowlist.deleteAllowedApplication(created.id);

    // Assert
    expect(seeded).toHaveLength(1);
    expect(seeded[0]?.clientId).toBe(seededClientId);
    expect(deniedBeforeApproval).toBe(false);
    expect(initiallyAllowed).toBe(true);
    expect(disabled?.enabled).toBe(false);
    expect(allowedAfterDisable).toBe(false);
    expect(deleted).toBe(true);
  });
});
