import { describe, expect, it } from "vitest";
import {
  clientInitial,
  MAX_LOGO_DATA_URL_LENGTH,
  validateLogoDataUrl,
} from "./mcp-client-logo";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("mcp client logo helpers", () => {
  it("accepts a small PNG data URL", () => {
    expect(() => validateLogoDataUrl(TINY_PNG)).not.toThrow();
  });
  it("rejects non-png prefixes, oversized payloads, and bad base64", () => {
    expect(() => validateLogoDataUrl("data:image/jpeg;base64,aaaa")).toThrow(
      "invalid logo",
    );
    expect(() =>
      validateLogoDataUrl(
        "data:image/png;base64," + "a".repeat(MAX_LOGO_DATA_URL_LENGTH),
      ),
    ).toThrow("invalid logo");
    expect(() => validateLogoDataUrl("data:image/png;base64,$$$")).toThrow(
      "invalid logo",
    );
  });
  it("uses the first letter of the client name as the initial", () => {
    expect(clientInitial("Cursor")).toBe("C");
    expect(clientInitial("  openai")).toBe("O");
    expect(clientInitial("")).toBe("?");
  });
});
