import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "./safe-redirect";

describe("isSafeRedirectPath", () => {
  it("allows valid relative paths", () => {
    expect(isSafeRedirectPath("/")).toBe(true);
    expect(isSafeRedirectPath("/settings")).toBe(true);
    expect(isSafeRedirectPath("/settings/onedrive")).toBe(true);
    expect(isSafeRedirectPath("/search?q=test")).toBe(true);
    expect(isSafeRedirectPath("/settings?tab=general&ref=1")).toBe(true);
  });

  it("rejects falsy or empty values", () => {
    expect(isSafeRedirectPath("")).toBe(false);
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
  });

  it("rejects absolute URLs", () => {
    expect(isSafeRedirectPath("https://evil.com")).toBe(false);
    expect(isSafeRedirectPath("http://evil.com")).toBe(false);
    expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath("///evil.com")).toBe(false);
  });

  it("rejects backslash protocol bypasses", () => {
    expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
    expect(isSafeRedirectPath("/\\/evil.com")).toBe(false);
  });

  it("rejects control characters and header injection attempts", () => {
    expect(isSafeRedirectPath("/path\r\nSet-Cookie: evil")).toBe(false);
    expect(isSafeRedirectPath("/path\0evil")).toBe(false);
  });
});
