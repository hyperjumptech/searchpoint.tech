import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockIsAdminBasicAuthValid,
  mockEnsureMcpAllowlist,
  mockListDcrPolicies,
  mockCreateDcrPolicy,
  DuplicateDcrPolicyError,
  AllowlistValidationError,
} = vi.hoisted(() => ({
  mockIsAdminBasicAuthValid: vi.fn(),
  mockEnsureMcpAllowlist: vi.fn(),
  mockListDcrPolicies: vi.fn(),
  mockCreateDcrPolicy: vi.fn(),
  DuplicateDcrPolicyError: class DuplicateDcrPolicyError extends Error {},
  AllowlistValidationError: class AllowlistValidationError extends Error {},
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin-basic-auth", () => ({
  isAdminBasicAuthValid: mockIsAdminBasicAuthValid,
  unauthorizedBasicAuthResponse: () =>
    new Response(null, {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="MCP admin"' },
    }),
}));

vi.mock("@/lib/mcp-allowlist", () => ({
  ensureMcpAllowlist: mockEnsureMcpAllowlist,
  listDcrPolicies: mockListDcrPolicies,
  createDcrPolicy: mockCreateDcrPolicy,
  DuplicateDcrPolicyError,
  AllowlistValidationError,
}));

import { GET, POST } from "@/app/api/admin/mcp/applications/route";

const application = {
  id: "app-1",
  redirectUri: "https://example.com/callback",
  clientIds: [],
  name: "Example",
  description: "Example application",
  enabled: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function request(body?: unknown, method = "POST") {
  return new Request("https://example.com/api/admin/mcp/applications", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { "content-type": "application/json" },
  });
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin MCP application collection routes", () => {
  beforeEach(() => {
    mockIsAdminBasicAuthValid.mockReset();
    mockEnsureMcpAllowlist.mockReset();
    mockListDcrPolicies.mockReset();
    mockCreateDcrPolicy.mockReset();
    mockIsAdminBasicAuthValid.mockReturnValue(true);
  });

  it("rejects unauthorized requests before accessing the repository", async () => {
    mockIsAdminBasicAuthValid.mockReturnValue(false);

    const response = await GET(request(undefined, "GET"));

    expect(response.status).toBe(401);
    expect(mockListDcrPolicies).not.toHaveBeenCalled();
  });

  it("lists safe application records", async () => {
    mockListDcrPolicies.mockResolvedValue([application]);

    const response = await GET(request(undefined, "GET"));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      applications: [
        expect.objectContaining({
          ...application,
          createdAt: application.createdAt.toISOString(),
          updatedAt: application.updatedAt.toISOString(),
        }),
      ],
    });
    expect(mockEnsureMcpAllowlist).toHaveBeenCalledOnce();
    expect(mockEnsureMcpAllowlist.mock.invocationCallOrder[0]).toBeLessThan(
      mockListDcrPolicies.mock.invocationCallOrder[0],
    );
  });

  it("returns a generic response when listing fails", async () => {
    mockListDcrPolicies.mockRejectedValue(
      new Error("database password leaked"),
    );

    const response = await GET(request(undefined, "GET"));

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("database password leaked");
  });

  it("sanitizes known repository errors when listing fails", async () => {
    mockListDcrPolicies.mockRejectedValue(
      new DuplicateDcrPolicyError("raw database detail"),
    );

    const response = await GET(request(undefined, "GET"));

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("raw database detail");
  });

  it("creates an application", async () => {
    mockCreateDcrPolicy.mockResolvedValue(application);

    const response = await POST(
      request({
        redirectUri: "https://example.com/callback",
        name: "Example",
        description: "Example application",
        secret: "must not be forwarded",
      }),
    );

    expect(response.status).toBe(201);
    expect(await json(response)).toEqual({
      ...application,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    });
    expect(mockCreateDcrPolicy).toHaveBeenCalledWith({
      redirectUri: "https://example.com/callback",
      name: "Example",
      description: "Example application",
    });
    expect(mockEnsureMcpAllowlist).toHaveBeenCalledOnce();
    expect(mockEnsureMcpAllowlist.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateDcrPolicy.mock.invocationCallOrder[0],
    );
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(
      new Request("https://example.com/api/admin/mcp/applications", {
        method: "POST",
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Invalid JSON body" });
  });

  it.each([
    [{ redirectUri: "", name: "Example" }],
    [{ redirectUri: "https://example.com/callback", name: "" }],
    [{ redirectUri: "https://example.com/callback" }],
    [{ redirectUri: "https://example.com/callback", name: "x".repeat(256) }],
    [
      {
        redirectUri: "https://example.com/callback",
        name: "Example",
        description: 42,
      },
    ],
  ])("rejects invalid create fields: %j", async (body) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(await json(response)).toHaveProperty("error", "Invalid request");
    expect(mockCreateDcrPolicy).not.toHaveBeenCalled();
  });

  it("maps duplicate redirect URIs to a conflict without details", async () => {
    mockCreateDcrPolicy.mockRejectedValue(
      new DuplicateDcrPolicyError("duplicate database detail"),
    );

    const response = await POST(
      request({ redirectUri: "https://example.com/callback", name: "Example" }),
    );

    expect(response.status).toBe(409);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({
      error: "A policy with this redirect URI already exists",
    });
    expect(body).not.toContain("duplicate database detail");
  });

  it("returns a generic response when creation fails unexpectedly", async () => {
    mockCreateDcrPolicy.mockRejectedValue(
      new Error("database connection details"),
    );

    const response = await POST(
      request({ redirectUri: "https://example.com/callback", name: "Example" }),
    );

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("database connection details");
  });

  it("maps repository validation errors to a safe bad request", async () => {
    mockCreateDcrPolicy.mockRejectedValue(
      new AllowlistValidationError("internal validation detail"),
    );

    const response = await POST(
      request({ redirectUri: "https://example.com/callback", name: "Example" }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Invalid request" });
  });
});
