// Same domain rule as the desktop app (company_from_email in
// src-tauri/src/utils/constants.rs) and the updater route's host fallback:
// an @smdv.com user belongs to smdv, everyone else to hyperjump.
export function companyFromEmail(email?: string | null): "hyperjump" | "smdv" {
  const domain = email?.toLowerCase().split("@")[1] ?? "";
  return domain === "smdv.com" || domain.endsWith(".smdv.com")
    ? "smdv"
    : "hyperjump";
}
