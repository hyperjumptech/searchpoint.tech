// Same domain rule as the desktop app (company_from_email in
// src-tauri/src/utils/constants.rs) and the updater route's host fallback:
// an @smdv.com user belongs to smdv, @hyperjump.tech to hyperjump,
// and everyone else to sinarmas.
export type Company = "hyperjump" | "smdv" | "sinarmas";

export function companyFromEmail(email?: string | null): Company {
  const domain = email?.toLowerCase().split("@")[1] ?? "";
  if (!domain) return "hyperjump";
  if (domain === "smdv.com" || domain.endsWith(".smdv.com")) {
    return "smdv";
  }
  if (domain === "hyperjump.tech" || domain.endsWith(".hyperjump.tech")) {
    return "hyperjump";
  }
  return "sinarmas";
}
