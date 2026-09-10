export type Company = "hyperjump" | "smdv" | "sinarmas";

export interface CompanyLogoConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const COMPANY_LOGOS: Record<Company, CompanyLogoConfig> = {
  hyperjump: {
    src: "/icons/hyperjump.png",
    alt: "Hyperjump",
    width: 1024,
    height: 174,
  },
  smdv: {
    src: "/icons/smdv.png",
    alt: "SMDV",
    width: 260,
    height: 71,
  },
  sinarmas: {
    src: "/icons/logo.svg",
    alt: "Sinarmas",
    width: 143,
    height: 32,
  },
};

export function getCompanyLogo(company: Company): CompanyLogoConfig {
  return COMPANY_LOGOS[company] ?? COMPANY_LOGOS.hyperjump;
}

export interface CompanyFaviconConfig {
  ico: string;
  png: string;
}

export const COMPANY_FAVICONS: Record<Company, CompanyFaviconConfig> = {
  hyperjump: {
    ico: "/favicons/hyperjump.ico",
    png: "/favicons/hyperjump.png",
  },
  smdv: {
    ico: "/favicons/smdv.ico",
    png: "/favicons/smdv.png",
  },
  sinarmas: {
    ico: "/favicons/sinarmas.ico",
    png: "/favicons/sinarmas.png",
  },
};

export function getCompanyFavicon(company: Company): CompanyFaviconConfig {
  return COMPANY_FAVICONS[company] ?? COMPANY_FAVICONS.hyperjump;
}

export function companyFromHostname(hostnameOrUrl?: string | null): Company {
  if (!hostnameOrUrl) return "hyperjump";
  let host = hostnameOrUrl.trim().toLowerCase();

  // If input contains query parameters, check ?company=
  if (host.includes("?")) {
    try {
      const url = new URL(host.includes("://") ? host : `http://${host}`);
      const companyParam = url.searchParams.get("company");
      if (
        companyParam === "smdv" ||
        companyParam === "sinarmas" ||
        companyParam === "hyperjump"
      ) {
        return companyParam;
      }
      host = url.hostname;
    } catch {
      host = host.split("?")[0];
    }
  }

  if (host.includes("://")) {
    try {
      host = new URL(host).hostname;
    } catch {
      host = host.split("://")[1]?.split("/")[0] ?? host;
    }
  } else if (host.includes("/")) {
    host = host.split("/")[0];
  }

  host = host.split(":")[0];
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
