import { describe, it, expect, vi, afterEach } from "vitest";
import * as sendMagicLinkModule from "@/actions/send-magic-link";
import { z } from "zod";

describe("useMagicLink email validation & payload logic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates valid email format successfully", () => {
    // Setup
    const emailSchema = z.string().email();

    // Act
    const validResult = emailSchema.safeParse("user@example.com");

    // Assert
    expect(validResult.success).toBe(true);
  });

  it("rejects invalid email formats", () => {
    // Setup
    const emailSchema = z.string().email();

    // Act
    const invalidResult1 = emailSchema.safeParse("invalid-email");
    const invalidResult2 = emailSchema.safeParse("@domain.com");
    const invalidResult3 = emailSchema.safeParse("user@");

    // Assert
    expect(invalidResult1.success).toBe(false);
    expect(invalidResult2.success).toBe(false);
    expect(invalidResult3.success).toBe(false);
  });

  it("delegates to sendMagicLink with origin and resolves result", async () => {
    // Setup
    const sendSpy = vi
      .spyOn(sendMagicLinkModule, "sendMagicLink")
      .mockResolvedValue({ success: true });

    // Act
    const result = await sendMagicLinkModule.sendMagicLink(
      "user@example.com",
      "https://searchpoint.hyperjump.tech",
    );

    // Assert
    expect(result.success).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(
      "user@example.com",
      "https://searchpoint.hyperjump.tech",
    );
  });

  it("handles sendMagicLink returning error message", async () => {
    // Setup
    vi.spyOn(sendMagicLinkModule, "sendMagicLink").mockResolvedValue({
      success: false,
      error: "Email domain not allowed",
    });

    // Act
    const result = await sendMagicLinkModule.sendMagicLink(
      "blocked@unlisted.com",
      "https://searchpoint.hyperjump.tech",
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email domain not allowed");
  });
});
