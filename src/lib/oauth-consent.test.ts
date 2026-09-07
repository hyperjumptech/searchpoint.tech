import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetJSON, mockSetWithTTL } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
  mockSetWithTTL: vi.fn(async () => {}),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: mockGetJSON,
  setWithTTL: mockSetWithTTL,
  oauthKeys: {
    state: (s: string) => `oauth:state:${s}`,
    code: (c: string) => `oauth:code:${c}`,
    at: (t: string) => `oauth:at:${t}`,
    rt: (t: string) => `oauth:rt:${t}`,
    magicPending: (s: string) => `oauth:magic:pending:${s}`,
    consent: (c: string, e: string) => `oauth:consent:${c}:${e}`,
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    OAUTH_ISSUER: undefined as string | undefined,
    AUTH_BASE_URL: "https://api.searchpoint.hyperjump.tech",
    VALKEY_URL: undefined,
  },
}));

import {
  CONSENT_TTL_SEC,
  consentKey,
  describeScopes,
  hasConsent,
  recordConsent,
} from "@/lib/oauth-consent";

describe("oauth-consent", () => {
  beforeEach(() => {
    mockGetJSON.mockReset();
    mockSetWithTTL.mockClear();
  });

  it("builds a namespaced consent key", () => {
    expect(consentKey("searchpoint-mcp-static", "a@b.com")).toBe(
      "oauth:consent:searchpoint-mcp-static:a@b.com",
    );
  });

  it("hasConsent returns true when a record exists", async () => {
    mockGetJSON.mockResolvedValue({ grantedAt: 1 });
    await expect(hasConsent("c", "a@b.com")).resolves.toBe(true);
  });

  it("hasConsent returns false when no record", async () => {
    mockGetJSON.mockResolvedValue(null);
    await expect(hasConsent("c", "a@b.com")).resolves.toBe(false);
  });

  it("recordConsent writes with 30-day TTL", async () => {
    await recordConsent("c", "a@b.com");
    expect(mockSetWithTTL).toHaveBeenCalledWith(
      "oauth:consent:c:a@b.com",
      expect.objectContaining({ grantedAt: expect.any(Number) }),
      CONSENT_TTL_SEC,
    );
    expect(CONSENT_TTL_SEC).toBe(30 * 24 * 3600);
  });

  it("describeScopes maps known scopes to human labels and collects unknown", () => {
    const { visible, unknown } = describeScopes(
      "openid email profile search magic",
    );
    expect(visible).toEqual([
      "View your email address",
      "View your profile (name, avatar)",
      "Search documents in your account",
    ]);
    expect(unknown).toEqual([]);
  });

  it("describeScopes flags unknown scopes", () => {
    const { visible, unknown } = describeScopes("openid foo bar");
    expect(visible).toEqual([]);
    expect(unknown).toEqual(["foo", "bar"]);
  });
});
