import { describe, it, expect, vi, afterEach } from "vitest";
import { sendMagicLink } from "./send-magic-link";
import { env } from "@/lib/env";

describe("sendMagicLink", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns error when ENABLE_MAGIC_LINK is false", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = false;

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Magic link login is currently disabled.",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("returns error for empty or whitespace-only email", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    // Act
    const result = await sendMagicLink("   ");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Enter a valid email address.",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("successfully sends magic link request with return_to", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Check your email." }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    const result = await sendMagicLink(
      "user@example.com",
      "https://searchpoint.hyperjump.tech",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      new URL("/v1/auth/magic-link", env.BACKEND_BASE_URL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "frontend",
        },
        body: JSON.stringify({
          email: "user@example.com",
          return_to: "https://searchpoint.hyperjump.tech",
        }),
      },
    );

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("omits return_to when returnTo parameter is not provided", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Check your email." }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      new URL("/v1/auth/magic-link", env.BACKEND_BASE_URL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "frontend",
        },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      },
    );

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("handles backend error response with error string", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Invalid JSON payload",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("handles backend error response with nested error.message object", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "Email domain not allowed" } }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Email domain not allowed",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("handles backend error response with message field", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Login is temporarily unavailable" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Login is temporarily unavailable",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("handles backend error response with errors array", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: ["Validation error on email"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Validation error on email",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("handles network/fetch exception", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Network connection lost"),
    );

    // Act
    const result = await sendMagicLink("user@example.com");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Network connection lost",
    });

    env.ENABLE_MAGIC_LINK = originalFlag;
  });

  it("retries without return_to if backend rejects return_to destination", async () => {
    // Setup
    const originalFlag = env.ENABLE_MAGIC_LINK;
    env.ENABLE_MAGIC_LINK = true;

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "return_to is not an allowed destination",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Check your email." }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      );

    // Act
    const result = await sendMagicLink(
      "user@example.com",
      "http://localhost:3000",
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      new URL("/v1/auth/magic-link", env.BACKEND_BASE_URL),
      expect.objectContaining({
        body: JSON.stringify({
          email: "user@example.com",
          return_to: "http://localhost:3000",
        }),
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      new URL("/v1/auth/magic-link", env.BACKEND_BASE_URL),
      expect.objectContaining({
        body: JSON.stringify({
          email: "user@example.com",
        }),
      }),
    );

    env.ENABLE_MAGIC_LINK = originalFlag;
  });
});
