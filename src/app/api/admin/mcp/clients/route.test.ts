import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  revoke: vi.fn(),
  rotate: vi.fn(),
}));
vi.mock("@/lib/admin-basic-auth", () => ({
  isAdminBasicAuthValid: mocks.auth,
  unauthorizedBasicAuthResponse: () => new Response(null, { status: 401 }),
}));
vi.mock("@/lib/oauth-static-client", () => ({
  createStaticClient: mocks.create,
  listStaticClients: mocks.list,
  getStaticClient: mocks.get,
  updateStaticClient: mocks.update,
  revokeStaticClient: mocks.revoke,
  rotateStaticClientSecret: mocks.rotate,
  StaticClientValidationError: class extends Error {},
  StaticClientNotFoundError: class extends Error {},
}));
vi.mock("server-only", () => ({}));
import { GET, POST } from "@/app/api/admin/mcp/clients/route";
import {
  GET as detail,
  PATCH,
  DELETE,
} from "@/app/api/admin/mcp/clients/[id]/route";
import { POST as rotate } from "@/app/api/admin/mcp/clients/[id]/rotate-secret/route";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const client = {
  clientId: "c1",
  name: "App",
  redirectUri: "https://a.test/cb",
  scopes: ["search"],
  enabled: true,
  revoked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  revokedAt: null,
};
const req = (body?: unknown, method = "POST") =>
  new Request("https://x.test", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { "content-type": "application/json" },
  });
const ctx = { params: Promise.resolve({ id: "c1" }) };
describe("static client admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());
  it("requires Basic Auth", async () => {
    mocks.auth.mockReturnValue(false);
    expect((await GET(req(undefined, "GET"))).status).toBe(401);
  });
  it("creates and returns the secret once", async () => {
    mocks.create.mockResolvedValue({ client, clientSecret: "secret" });
    const response = await POST(
      req({ name: "App", redirectUri: client.redirectUri }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      client: {
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      },
      clientSecret: "secret",
    });
  });
  it("lists and details without secrets", async () => {
    mocks.list.mockResolvedValue([client]);
    mocks.get.mockResolvedValue(client);
    const safe = {
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
    expect(await (await GET(req(undefined, "GET"))).json()).toEqual({
      clients: [safe],
      allowedScopes: expect.any(Array),
    });
    expect(await (await detail(req(undefined, "GET"), ctx)).json()).toEqual({
      client: safe,
    });
  });
  it("updates and revokes metadata", async () => {
    mocks.update.mockResolvedValue(client);
    mocks.revoke.mockResolvedValue({ ...client, revoked: true });
    expect((await PATCH(req({ name: "New" }), ctx)).status).toBe(200);
    expect((await DELETE(req(undefined, "DELETE"), ctx)).status).toBe(200);
  });
  it("rejects invalid input", async () => {
    expect((await POST(req({ name: "", redirectUri: "bad" }))).status).toBe(
      400,
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("maps duplicate clients to a stable conflict", async () => {
    mocks.create.mockRejectedValue({
      code: "23505",
      detail: "secret database detail",
    });
    const response = await POST(
      req({ name: "App", redirectUri: client.redirectUri }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Client already exists" });
  });
  it("rotates secret and maps missing records", async () => {
    mocks.rotate.mockResolvedValue({ clientSecret: "new" });
    expect(await (await rotate(req(), ctx)).json()).toEqual({
      clientSecret: "new",
    });
    mocks.rotate.mockRejectedValue(new (class extends Error {})());
    expect((await rotate(req(), ctx)).status).toBe(503);
  });
  it("maps repository failures consistently", async () => {
    mocks.list.mockRejectedValue(new Error("db"));
    const response = await GET(req(undefined, "GET"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Service unavailable" });
  });
  it("creates with a logo data URL", async () => {
    mocks.create.mockResolvedValue({
      client: { ...client, logoDataUrl: TINY_PNG },
      clientSecret: "secret",
    });
    const response = await POST(
      req({
        name: "App",
        redirectUri: client.redirectUri,
        logoDataUrl: TINY_PNG,
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ logoDataUrl: TINY_PNG }),
    );
  });
  it("patches null to clear a logo and rejects jpeg data URLs", async () => {
    mocks.update.mockResolvedValue({ ...client, logoDataUrl: null });
    expect((await PATCH(req({ logoDataUrl: null }), ctx)).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ logoDataUrl: null }),
    );
    expect(
      (await PATCH(req({ logoDataUrl: "data:image/jpeg;base64,xx" }), ctx))
        .status,
    ).toBe(400);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });
});
