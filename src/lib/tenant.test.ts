import { describe, expect, it } from "vitest";

import { getTenantConfig, resolveTenantId } from "@/lib/tenant";

describe("resolveTenantId", () => {
  it("prefers the TENANT env value over the hostname", () => {
    // Act
    const tenant = resolveTenantId(
      "smdv",
      "https://searchpoint.sinarmas.hyperjump.tech/landing",
    );

    // Assert
    expect(tenant).toBe("smdv");
  });

  it("ignores letter case and surrounding whitespace in TENANT", () => {
    // Act
    const tenant = resolveTenantId(
      "  SinarMas  ",
      "searchpoint.hyperjump.tech",
    );

    // Assert
    expect(tenant).toBe("sinarmas");
  });

  it("falls back to the hostname when TENANT is unset", () => {
    // Act
    const tenant = resolveTenantId(
      undefined,
      "searchpoint.sinarmas.hyperjump.tech",
    );

    // Assert
    expect(tenant).toBe("sinarmas");
  });

  it("falls back to the hostname when TENANT is an unknown value", () => {
    // Act
    const tenant = resolveTenantId(
      "acme",
      "searchpoint.sinarmas.hyperjump.tech",
    );

    // Assert
    expect(tenant).toBe("sinarmas");
  });

  it("falls back to the hostname when TENANT is an empty string", () => {
    // Act
    const tenant = resolveTenantId("", "searchpoint.sinarmas.hyperjump.tech");

    // Assert
    expect(tenant).toBe("sinarmas");
  });

  it("resolves the production hyperjump host when TENANT is unset", () => {
    // Act
    const tenant = resolveTenantId(undefined, "searchpoint.hyperjump.tech");

    // Assert
    expect(tenant).toBe("hyperjump");
  });

  it("defaults to hyperjump when neither TENANT nor a hostname is given", () => {
    // Act
    const tenant = resolveTenantId(undefined, undefined);

    // Assert
    expect(tenant).toBe("hyperjump");
  });
});

describe("getTenantConfig", () => {
  it("returns the shared copy for hyperjump", () => {
    // Act
    const { content } = getTenantConfig("hyperjump");

    // Assert
    expect(content.hero.headlineLead).toBe("Unified search for your files and");
    expect(content.hero.headlineAccent).toBe("Microsoft 365.");
    expect(content.download.badge).toBe("Get Started Today");
    expect(content.footer.tagline).toBe("Search across PCs and Microsoft 365");
  });

  it("applies a tenant's declared overrides over the shared defaults", () => {
    // Setup — hyperjump declares no copy overrides, so it is the shared baseline.
    const shared = getTenantConfig("hyperjump").content;

    // Act
    const sinarmas = getTenantConfig("sinarmas").content;

    // Assert
    expect(sinarmas.footer.tagline).not.toBe(shared.footer.tagline);
    expect(sinarmas.meta.title).not.toBe(shared.meta.title);
    expect(sinarmas.download.heading).not.toBe(shared.download.heading);
  });

  it("gives each tenant its own overrides", () => {
    // Setup
    const sinarmas = getTenantConfig("sinarmas").content;

    // Act
    const smdv = getTenantConfig("smdv").content;

    // Assert
    expect(smdv.footer.tagline).not.toBe(sinarmas.footer.tagline);
    expect(smdv.meta.title).not.toBe(sinarmas.meta.title);
  });

  it("keeps shared values for fields a tenant does not override", () => {
    // Setup — sinarmas overrides hero/download/footer but not productName.
    const { content } = getTenantConfig("sinarmas");

    // Assert
    expect(content.productName).toBe("SearchPoint");
  });

  it("returns the shared page title for hyperjump", () => {
    // Act
    const { content } = getTenantConfig("hyperjump");

    // Assert
    expect(content.meta.title).toBe("SearchPoint");
    expect(content.meta.description).toBe(
      "SearchPoint - Secure Corporate Search Engine",
    );
  });

  it("returns a tenant-specific page title for sinarmas", () => {
    // Act
    const { content } = getTenantConfig("sinarmas");

    // Assert
    expect(content.meta.title).toBe("SearchPoint \u2014 Sinarmas");
    expect(content.meta.description).toBe(
      "Secure enterprise search for Sinarmas",
    );
  });

  it("returns a tenant-specific page title for smdv", () => {
    // Act
    const { content } = getTenantConfig("smdv");

    // Assert
    expect(content.meta.title).toBe("SearchPoint \u2014 SMDV");
  });

  it("names the tenant in the copyright line", () => {
    // Act
    const sinarmas = getTenantConfig("sinarmas").content;
    const smdv = getTenantConfig("smdv").content;
    const hyperjump = getTenantConfig("hyperjump").content;

    // Assert
    expect(sinarmas.legalName).toBe("Sinarmas");
    expect(smdv.legalName).toBe("SMDV");
    expect(hyperjump.legalName).toBe("Hyperjump");
  });

  it("resolves the logo for the tenant", () => {
    // Act
    const { logo } = getTenantConfig("sinarmas");

    // Assert
    expect(logo.src).toBe("/icons/logo.svg");
    expect(logo.alt).toBe("Sinarmas");
  });

  it("builds the updater app name from the tenant", () => {
    // Act
    const config = getTenantConfig("smdv");

    // Assert
    expect(config.appName).toBe("SearchPoint-SMDV");
  });

  it("honours a custom base app name", () => {
    // Act
    const config = getTenantConfig("sinarmas", "CustomApp");

    // Assert
    expect(config.appName).toBe("CustomApp-Sinarmas");
  });

  it("does not let one tenant's overrides leak into another", () => {
    // Setup
    const sinarmas = getTenantConfig("sinarmas");

    // Act
    const hyperjump = getTenantConfig("hyperjump");

    // Assert
    expect(sinarmas.content.footer.tagline).not.toBe(
      hyperjump.content.footer.tagline,
    );
    expect(hyperjump.content.footer.tagline).toBe(
      "Search across PCs and Microsoft 365",
    );
  });
});
