import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { resolveMagicLinkUrl } from "./resolve-magic-link";

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mockCookieSet,
  }),
}));

describe("resolveMagicLinkUrl", () => {
  const originalEnv = process.env.NODE_ENV;
  const setNodeEnv = (value: string | undefined) => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = value;
  };

  beforeEach(() => {
    mockCookieSet.mockClear();
    setNodeEnv("development");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setNodeEnv(originalEnv);
  });

  it("is disabled in production environment", async () => {
    // Setup
    setNodeEnv("production");

    // Act
    const result = await resolveMagicLinkUrl(
      "searchpoint://auth/callback?session=valid-jwt",
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Dev mode resolution is disabled in production.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns error for empty URL input", async () => {
    // Act
    const result = await resolveMagicLinkUrl("   ");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Please enter a valid URL.",
    });
  });

  it("resolves deep-link URL containing session parameter", async () => {
    // Act
    const result = await resolveMagicLinkUrl(
      "searchpoint://auth/callback?session=my-session-jwt-123",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "SCSE_ID",
      "my-session-jwt-123",
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
    );
  });

  it("posts token to confirm endpoint when token parameter is present", async () => {
    // Setup
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          location: "searchpoint://auth/callback?session=extracted-token-abc",
        },
      }),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=plain-token-1",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/confirm",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "frontend-dev",
        },
        body: "token=plain-token-1",
      }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "SCSE_ID",
      "extracted-token-abc",
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
    );
  });

  it("resolves HTTP redirect URL when Set-Cookie header carries SCSE_ID", async () => {
    // Setup
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          "set-cookie":
            "SCSE_ID=cookie-jwt-token-xyz; Path=/; HttpOnly; SameSite=Lax",
          location: "https://searchpoint.hyperjump.tech/",
        },
      }),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=plain-token-2",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "SCSE_ID",
      "cookie-jwt-token-xyz",
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
    );
  });

  it("extracts token from interstitial HTML page when token param is not in URL", async () => {
    // Setup
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) => {
        if (init?.method === "GET") {
          return new Response(
            `<form method="post" action="confirm"><input type="hidden" name="token" value="html-token-789" /><button type="submit">Sign in</button></form>`,
            { status: 200 },
          );
        }
        if (init?.method === "POST") {
          return new Response(null, {
            status: 302,
            headers: {
              "set-cookie": "SCSE_ID=jwt-from-html-post; Path=/; HttpOnly",
            },
          });
        }
        return new Response(null, { status: 404 });
      });

    // Act
    const result = await resolveMagicLinkUrl(
      "http://localhost:3001/v1/auth/magic-link/redirect",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(mockCookieSet).toHaveBeenCalledWith(
      "SCSE_ID",
      "jwt-from-html-post",
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
    );
  });

  it("handles expired/invalid token response (400)", async () => {
    // Setup
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Expired token", {
        status: 400,
      }),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=expired-token",
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: "This login link is expired or invalid.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("handles unlisted domain response (403)", async () => {
    // Setup
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unlisted domain", {
        status: 403,
      }),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=unlisted-token",
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Your email domain is not on the allow list.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("handles service unavailable response (503)", async () => {
    // Setup
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
      }),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=some-token",
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Login service is temporarily unavailable.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("handles network failure gracefully", async () => {
    // Setup
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused"),
    );

    // Act
    const result = await resolveMagicLinkUrl(
      "http://localhost:3001/v1/auth/magic-link/redirect?token=test-token",
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Connection refused",
    });
  });
});
