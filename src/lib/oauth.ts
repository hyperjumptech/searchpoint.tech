import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function pkceVerify(verifier: string, challenge: string) {
  const hash = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(hash);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function calcTTL(
  iss: "entra" | "searchpoint",
  scseExp: number,
  nowMs = Date.now(),
) {
  const scseTtlSec = Math.max(0, scseExp - Math.floor(nowMs / 1000));
  if (iss === "entra")
    return { atTtl: Math.min(scseTtlSec, 3600), rtTtl: null as number | null };
  return {
    atTtl: Math.min(scseTtlSec, 3600),
    rtTtl: Math.min(scseTtlSec, 7 * 24 * 3600),
  };
}

export function deriveIssuer(req: Request) {
  const envIss = process.env.OAUTH_ISSUER?.trim();
  if (envIss) return envIss.replace(/\/$/, "");
  const url = new URL(req.url);
  const fwd = req.headers.get("x-forwarded-host");
  if (fwd) return `https://${fwd.split(",")[0].trim()}`;
  return url.origin;
}

export function timingSafeEqualStr(a: string, b: string) {
  const ba = Buffer.from(a),
    bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
