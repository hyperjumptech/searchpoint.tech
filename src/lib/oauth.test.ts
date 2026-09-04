import { createHash } from "crypto";
import { describe, it, expect } from "vitest";

import { pkceVerify, calcTTL } from "@/lib/oauth";

describe("oauth core", () => {
  it("verifies S256", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    expect(pkceVerify(verifier, challenge)).toBe(true);
    expect(pkceVerify("bad", challenge)).toBe(false);
  });

  it("calcTTL entra caps 3600", () => {
    const now = Date.now();
    const exp = Math.floor((now + 90 * 60 * 1000) / 1000);
    expect(calcTTL("entra", exp, now).atTtl).toBe(3600);
    expect(calcTTL("entra", exp, now).rtTtl).toBeNull();
  });

  it("calcTTL magic 7d", () => {
    const now = Date.now();
    const exp = Math.floor((now + 168 * 3600 * 1000) / 1000);
    const { atTtl, rtTtl } = calcTTL("searchpoint", exp, now);
    expect(atTtl).toBe(3600);
    expect(rtTtl).toBe(7 * 24 * 3600);
  });
});
