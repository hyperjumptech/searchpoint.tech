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
});
