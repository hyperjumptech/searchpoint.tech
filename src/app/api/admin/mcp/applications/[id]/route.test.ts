import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockIsAdminBasicAuthValid,
  mockEnsureMcpAllowlist,
  mockUpdateDcrPolicy,
  mockDeleteDcrPolicy,
  DuplicateDcrPolicyError,
  AllowlistValidationError,
} = vi.hoisted(() => ({
  mockIsAdminBasicAuthValid: vi.fn(),
  mockEnsureMcpAllowlist: vi.fn(),
  mockUpdateDcrPolicy: vi.fn(),
  mockDeleteDcrPolicy: vi.fn(),
  DuplicateDcrPolicyError: class DuplicateDcrPolicyError extends Error {},
  AllowlistValidationError: class AllowlistValidationError extends Error {},
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin-basic-auth", () => ({
  isAdminBasicAuthValid: mockIsAdminBasicAuthValid,
  unauthorizedBasicAuthResponse: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/mcp-allowlist", () => ({
  ensureMcpAllowlist: mockEnsureMcpAllowlist,
  updateDcrPolicy: mockUpdateDcrPolicy,
  deleteDcrPolicy: mockDeleteDcrPolicy,
  DuplicateDcrPolicyError,
  AllowlistValidationError,
}));

import { DELETE, PATCH } from "@/app/api/admin/mcp/applications/[id]/route";

const application = {
  id: "app-1",
  redirectUri: "https://example.com/callback",
  clientIds: [],
  name: "Updated",
  description: null,
  enabled: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

function routeContext(id = "app-1") {
  return { params: Promise.resolve({ id }) };
}

function request(body?: unknown) {
  return new Request("https://example.com/api/admin/mcp/applications/app-1", {
    method: "PATCH",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { "content-type": "application/json" },
  });
}

async function responseJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("admin MCP application item routes", () => {
  beforeEach(() => {
    mockIsAdminBasicAuthValid.mockReset();
    mockEnsureMcpAllowlist.mockReset();
    mockUpdateDcrPolicy.mockReset();
    mockDeleteDcrPolicy.mockReset();
    mockIsAdminBasicAuthValid.mockReturnValue(true);
  });

  it("rejects unauthorized updates", async () => {
    mockIsAdminBasicAuthValid.mockReturnValue(false);

    const response = await PATCH(request({ enabled: false }), routeContext());

    expect(response.status).toBe(401);
    expect(mockUpdateDcrPolicy).not.toHaveBeenCalled();
  });

  it("updates any non-empty valid subset", async () => {
    mockUpdateDcrPolicy.mockResolvedValue(application);

    const response = await PATCH(
      request({ redirectUri: "https://example.com/callback", enabled: false }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({
      ...application,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    });
    expect(mockUpdateDcrPolicy).toHaveBeenCalledWith("app-1", {
      redirectUri: "https://example.com/callback",
      enabled: false,
    });
    expect(mockEnsureMcpAllowlist).toHaveBeenCalledOnce();
    expect(mockEnsureMcpAllowlist.mock.invocationCallOrder[0]).toBeLessThan(
      mockUpdateDcrPolicy.mock.invocationCallOrder[0],
    );
  });

  it("rejects an empty update", async () => {
    const response = await PATCH(request({}), routeContext());

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toEqual({ error: "Invalid request" });
    expect(mockUpdateDcrPolicy).not.toHaveBeenCalled();
  });

  it("returns not found when the update target is missing", async () => {
    mockUpdateDcrPolicy.mockResolvedValue(null);

    const response = await PATCH(
      request({ enabled: false }),
      routeContext("missing"),
    );

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toEqual({
      error: "Policy not found",
    });
  });

  it("maps duplicate update errors to conflict", async () => {
    mockUpdateDcrPolicy.mockRejectedValue(
      new DuplicateDcrPolicyError("raw duplicate error"),
    );

    const response = await PATCH(
      request({ redirectUri: "https://example.com/callback" }),
      routeContext(),
    );

    expect(response.status).toBe(409);
    expect(await responseJson(response)).toEqual({
      error: "A policy with this redirect URI already exists",
    });
  });

  it("maps validation errors to a safe bad request", async () => {
    mockUpdateDcrPolicy.mockRejectedValue(
      new AllowlistValidationError("raw validation error"),
    );

    const response = await PATCH(request({ name: "Updated" }), routeContext());

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toEqual({ error: "Invalid request" });
  });

  it("returns a generic response when updating fails unexpectedly", async () => {
    mockUpdateDcrPolicy.mockRejectedValue(
      new Error("database connection details"),
    );

    const response = await PATCH(request({ name: "Updated" }), routeContext());

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("database connection details");
  });

  it("rejects unauthorized deletes before accessing the repository", async () => {
    mockIsAdminBasicAuthValid.mockReturnValue(false);

    const response = await DELETE(
      new Request("https://example.com/api/admin/mcp/applications/app-1", {
        method: "DELETE",
      }),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mockDeleteDcrPolicy).not.toHaveBeenCalled();
  });

  it("deletes an existing policy", async () => {
    mockDeleteDcrPolicy.mockResolvedValue(true);

    const response = await DELETE(
      new Request("https://example.com/api/admin/mcp/applications/app-1", {
        method: "DELETE",
      }),
      routeContext(),
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mockDeleteDcrPolicy).toHaveBeenCalledWith("app-1");
    expect(mockEnsureMcpAllowlist).toHaveBeenCalledOnce();
    expect(mockEnsureMcpAllowlist.mock.invocationCallOrder[0]).toBeLessThan(
      mockDeleteDcrPolicy.mock.invocationCallOrder[0],
    );
  });

  it("returns not found when deleting a missing application", async () => {
    mockDeleteDcrPolicy.mockResolvedValue(false);

    const response = await DELETE(
      new Request("https://example.com/api/admin/mcp/applications/missing", {
        method: "DELETE",
      }),
      routeContext("missing"),
    );

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toEqual({
      error: "Policy not found",
    });
  });

  it("returns a generic response when deletion fails unexpectedly", async () => {
    mockDeleteDcrPolicy.mockRejectedValue(
      new Error("database connection details"),
    );

    const response = await DELETE(
      new Request("https://example.com/api/admin/mcp/applications/app-1", {
        method: "DELETE",
      }),
      routeContext(),
    );

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("database connection details");
  });

  it("sanitizes known repository errors when deletion fails", async () => {
    mockDeleteDcrPolicy.mockRejectedValue(
      new DuplicateDcrPolicyError("raw database detail"),
    );

    const response = await DELETE(
      new Request("https://example.com/api/admin/mcp/applications/app-1", {
        method: "DELETE",
      }),
      routeContext(),
    );

    expect(response.status).toBe(503);
    const body = await response.clone().text();
    expect(JSON.parse(body)).toEqual({ error: "Service unavailable" });
    expect(body).not.toContain("raw database detail");
  });
});
