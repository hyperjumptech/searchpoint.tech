import { expect, test } from "@playwright/test";

const adminCredentials = {
  username: "task6-admin",
  password: "task6-password",
};
const adminAuthorization = `Basic ${Buffer.from(`${adminCredentials.username}:${adminCredentials.password}`).toString("base64")}`;
const base =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3000"}`;

test.use({
  httpCredentials: adminCredentials,
  extraHTTPHeaders: { authorization: adminAuthorization },
});

test("creates a static client and displays its secret once", async ({
  page,
}) => {
  let clients: Array<Record<string, unknown>> = [];
  await page.route("**/api/admin/mcp/clients", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { clients, allowedScopes: ["openid", "search"] },
      });
    const body = route.request().postDataJSON() as {
      name: string;
      redirectUri: string;
      scopes: string[];
    };
    const client = {
      clientId: "searchpoint-e2e",
      ...body,
      enabled: true,
      revoked: false,
      createdAt: "2026-09-16T00:00:00Z",
      updatedAt: "2026-09-16T00:00:00Z",
    };
    clients = [client];
    return route.fulfill({
      status: 201,
      json: { client, clientSecret: "e2e-secret-once" },
    });
  });

  await page.goto(`${base}/admin/mcp`);
  await page.getByRole("button", { name: /add oauth client/i }).click();
  await page.getByLabel("Name").fill("OpenCode");
  await page.getByLabel("Redirect URI").fill("http://127.0.0.1:19876/callback");
  await page.getByRole("button", { name: /create client/i }).click();
  await expect(
    page.getByRole("dialog", { name: "Save these credentials now" }),
  ).toBeVisible();
  await expect(page.getByLabel("Client secret")).toHaveValue("e2e-secret-once");
  await page.getByRole("button", { name: /i saved the secret/i }).click();
  await expect(page.getByText("OpenCode")).toBeVisible();
});

test("documents that DCR is disabled", async ({ request }) => {
  const discovery = await request.get(
    `${base}/.well-known/oauth-authorization-server`,
  );
  expect(discovery.ok()).toBeTruthy();
  expect(await discovery.json()).not.toHaveProperty("registration_endpoint");
  const registration = await request.post(`${base}/api/oauth/register`, {
    data: {},
  });
  expect(registration.status()).toBe(404);
});

test.describe("static credential protocol flow", () => {
  const hasInteractiveFixture = Boolean(
    process.env.TEST_DATABASE_URL &&
    process.env.TEST_VALKEY_URL &&
    process.env.TEST_OAUTH_INTERACTIVE_SESSION &&
    process.env.TEST_OAUTH_PROTOCOL_FIXTURE === "ready",
  );

  test.skip(
    !hasInteractiveFixture,
    "requires isolated TEST_DATABASE_URL, isolated TEST_VALKEY_URL, TEST_OAUTH_INTERACTIVE_SESSION, and TEST_OAUTH_PROTOCOL_FIXTURE=ready for the interactive create/authorize/token/MCP fixture",
  );

  test("create, authorize, exchange, call MCP, rotate, disable, and revoke", async () => {
    throw new Error(
      "Interactive OAuth fixture contract is not implemented in this environment; provide a fixture that drives the callback session and token exchange before enabling this test.",
    );
  });
});
