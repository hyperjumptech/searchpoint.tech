import {
  companyFromHostname,
  getCompanyAppName,
  getCompanyLogo,
  type Company,
  type CompanyLogoConfig,
} from "@/lib/company";

const TENANT_IDS = ["hyperjump", "smdv", "sinarmas"] as const;

/**
 * Copy that varies per tenant. Deliberately limited to the strings a visitor
 * reads first — headline, download call to action, footer. The deeper marketing
 * copy in the landing sections stays shared until a tenant actually needs it to
 * diverge; adding a field here is additive and needs no rewrite.
 */
export interface TenantContent {
  productName: string;
  /** Entity named in the copyright line on the login and OAuth pages. */
  legalName: string;
  meta: {
    /** Browser tab title. */
    title: string;
    description: string;
  };
  hero: {
    /** Plain leading half of the h1. */
    headlineLead: string;
    /** Trailing half of the h1, rendered in the brand gradient. */
    headlineAccent: string;
    subheadline: string;
  };
  download: {
    badge: string;
    heading: string;
    subheading: string;
  };
  footer: {
    tagline: string;
  };
}

export interface TenantConfig {
  id: Company;
  logo: CompanyLogoConfig;
  /** Desktop app name the updater uses to build asset URLs. */
  appName: string;
  content: TenantContent;
}

const SHARED_CONTENT: TenantContent = {
  productName: "SearchPoint",
  legalName: "Hyperjump",
  meta: {
    title: "SearchPoint",
    description: "SearchPoint - Secure Corporate Search Engine",
  },
  hero: {
    headlineLead: "Unified search for your files and",
    headlineAccent: "Microsoft 365.",
    subheadline:
      "Search local folders, OneDrive and SharePoint from one desktop app. Your source documents stay where they are.",
  },
  download: {
    badge: "Get Started Today",
    heading: "Download SearchPoint for your desktop.",
    subheading:
      "Fast, secure, and native desktop app. Select your operating system below to install SearchPoint.",
  },
  footer: {
    tagline: "Search across PCs and Microsoft 365",
  },
};

/**
 * Per-tenant overrides layered onto SHARED_CONTENT. A tenant lists only what it
 * changes, so edits to shared copy stay in one place.
 */
const TENANT_CONTENT: Record<Company, Partial<TenantContent>> = {
  hyperjump: {},
  sinarmas: {
    legalName: "Sinarmas",
    meta: {
      title: "SearchPoint \u2014 Sinarmas",
      description: "Secure enterprise search for Sinarmas",
    },
    hero: {
      headlineLead: "Unified search for your files and",
      headlineAccent: "Microsoft 365.",
      subheadline:
        "Search local folders, OneDrive and SharePoint from one desktop app. Your source documents stay where they are.",
    },
    download: {
      badge: "Available Now",
      heading: "Install SearchPoint on your workstation.",
      subheading:
        "The native desktop app for Sinarmas. Choose your operating system below to get started.",
    },
    footer: {
      tagline: "Secure enterprise search for Sinarmas",
    },
  },
  smdv: {
    legalName: "SMDV",
    meta: {
      title: "SearchPoint \u2014 SMDV",
      description: "Secure enterprise search for SMDV",
    },
    hero: {
      headlineLead: "Find anything across",
      headlineAccent: "SMDV's drives.",
      subheadline:
        "One search bar for local folders, OneDrive, and SharePoint. No more hunting through tabs for a document you already have.",
    },
    download: {
      badge: "Available Now",
      heading: "Get SearchPoint for your laptop.",
      subheading:
        "The native desktop app for SMDV. Pick your operating system below to install.",
    },
    footer: {
      tagline: "Secure enterprise search for SMDV",
    },
  },
};

function mergeContent(overrides: Partial<TenantContent>): TenantContent {
  return {
    productName: overrides.productName ?? SHARED_CONTENT.productName,
    legalName: overrides.legalName ?? SHARED_CONTENT.legalName,
    meta: { ...SHARED_CONTENT.meta, ...overrides.meta },
    hero: { ...SHARED_CONTENT.hero, ...overrides.hero },
    download: { ...SHARED_CONTENT.download, ...overrides.download },
    footer: { ...SHARED_CONTENT.footer, ...overrides.footer },
  };
}

function normalizeTenantId(value?: string | null): Company | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (TENANT_IDS as readonly string[]).includes(normalized)
    ? (normalized as Company)
    : null;
}

/**
 * Resolve which tenant a deployment is serving.
 *
 * TENANT is authoritative: a deployment is pinned to one tenant, so the value
 * cannot be influenced by the request. Hostname matching stays as a fallback so
 * existing deployments keep working until their .env is updated.
 */
export function resolveTenantId(
  envTenant?: string | null,
  hostnameOrUrl?: string | null,
): Company {
  return normalizeTenantId(envTenant) ?? companyFromHostname(hostnameOrUrl);
}

export function getTenantConfig(
  id: Company,
  baseAppName = "SearchPoint",
): TenantConfig {
  return {
    id,
    logo: getCompanyLogo(id),
    appName: getCompanyAppName(id, baseAppName),
    content: mergeContent(TENANT_CONTENT[id] ?? {}),
  };
}
