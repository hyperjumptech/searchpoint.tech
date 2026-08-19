export type Company = "hyperjump" | "smdv" | "sinarmas";

export function companyFromHostname(hostname?: string | null): Company {
  const host = hostname?.toLowerCase().split(":")[0] ?? "";
  if (!host) return "hyperjump";
  if (host === "smdv.com" || host.endsWith(".smdv.com")) {
    return "smdv";
  }
  if (
    host === "searchpoint.sinarmas.hyperjump.tech" ||
    host.endsWith(".sinarmas.hyperjump.tech") ||
    host.includes("sinarmas")
  ) {
    return "sinarmas";
  }
  return "hyperjump";
}

export function getCompanyAppName(
  company: Company,
  baseName = "SearchPoint",
): string {
  switch (company) {
    case "sinarmas":
      return `${baseName}-Sinarmas`;
    case "smdv":
      return `${baseName}-SMDV`;
    case "hyperjump":
    default:
      return `${baseName}-Hyperjump`;
  }
}
