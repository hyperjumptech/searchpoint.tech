import { expect, test } from "@playwright/test";

// API-only checks against the OAuth 2.1 / MCP endpoints. No browser needed.
const base = "http://localhost:3000";

test("discovery advertises issuer, S256, no registration_endpoint", async ({
  request,
}) => {
  const r = await request.get(`${base}/.well-known/oauth-authorization-server`);
  expect(r.ok()).toBeTruthy();
  const j = await r.json();
  expect(j.issuer).toBeTruthy();
  expect(j.code_challenge_methods_supported).toContain("S256");
  expect(j).not.toHaveProperty("registration_endpoint");
});

test("protected resource metadata points at /mcp", async ({ request }) => {
  const r = await request.get(`${base}/.well-known/oauth-protected-resource`);
  expect(r.ok()).toBeTruthy();
  const j = await r.json();
  expect(j.resource).toMatch(/\/mcp$/);
});

test("mcp requires bearer token", async ({ request }) => {
  const r = await request.post(`${base}/mcp`, { data: {} });
  expect(r.status()).toBe(401);
  expect(r.headers()["www-authenticate"]).toContain("oauth-protected-resource");
});

test("authorize rejects unknown client", async ({ request }) => {
  const r = await request.get(`${base}/api/oauth/authorize`, {
    params: {
      client_id: "bad",
      redirect_uri: "https://cb.example/cb",
      response_type: "code",
      code_challenge: "x",
      code_challenge_method: "S256",
      state: "s1",
    },
  });
  expect(r.status()).toBe(401);
});

test("mcp GET returns 405 (POST-only server)", async ({ request }) => {
  const r = await request.get(`${base}/mcp`);
  expect(r.status()).toBe(405);
});

test("mcp rejects initialize with invalid bearer (401 before protocol)", async ({
  request,
}) => {
  const r = await request.post(`${base}/mcp`, {
    headers: { authorization: "Bearer not-a-token" },
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    },
  });
  expect(r.status()).toBe(401);
  expect(r.headers()["www-authenticate"]).toContain("oauth-protected-resource");
});
