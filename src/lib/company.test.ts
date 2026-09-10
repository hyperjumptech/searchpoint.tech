import { describe, expect, it } from "vitest";
import {
  companyFromHostname,
  getCompanyAppName,
  getCompanyLogo,
} from "./company";

describe("companyFromHostname", () => {
  it("defaults to hyperjump when hostname is undefined or empty", () => {
    expect(companyFromHostname(undefined)).toBe("hyperjump");
    expect(companyFromHostname(null)).toBe("hyperjump");
    expect(companyFromHostname("")).toBe("hyperjump");
  });

  it("returns smdv for smdv.com hostnames", () => {
    expect(companyFromHostname("smdv.com")).toBe("smdv");
    expect(companyFromHostname("searchpoint.smdv.com")).toBe("smdv");
    expect(companyFromHostname("searchpoint.smdv.com:3000")).toBe("smdv");
  });

  it("returns sinarmas for sinarmas hostnames", () => {
    expect(companyFromHostname("searchpoint.sinarmas.hyperjump.tech")).toBe(
      "sinarmas",
    );
    expect(companyFromHostname("sinarmas.example.com")).toBe("sinarmas");
    expect(
      companyFromHostname("searchpoint.sinarmas.hyperjump.tech:8080"),
    ).toBe("sinarmas");
  });

  it("returns hyperjump for other hostnames (e.g. localhost, searchpoint.hyperjump.tech)", () => {
    expect(companyFromHostname("searchpoint.hyperjump.tech")).toBe("hyperjump");
    expect(companyFromHostname("localhost")).toBe("hyperjump");
    expect(companyFromHostname("localhost:3000")).toBe("hyperjump");
  });

  it("handles full URLs correctly according to company domain", () => {
    expect(companyFromHostname("https://searchpoint.hyperjump.tech/")).toBe(
      "hyperjump",
    );
    expect(companyFromHostname("https://searchpoint.smdv.com/")).toBe("smdv");
    expect(
      companyFromHostname("https://searchpoint.sinarmas.hyperjump.tech/"),
    ).toBe("sinarmas");
  });

  it("supports company query parameter for testing/overrides", () => {
    expect(companyFromHostname("http://localhost:3000/?company=smdv")).toBe(
      "smdv",
    );
    expect(companyFromHostname("http://localhost:3000/?company=sinarmas")).toBe(
      "sinarmas",
    );
    expect(
      companyFromHostname("http://localhost:3000/?company=hyperjump"),
    ).toBe("hyperjump");
  });
});

describe("getCompanyLogo", () => {
  it("returns Hyperjump logo config for hyperjump", () => {
    const logo = getCompanyLogo("hyperjump");
    expect(logo.src).toBe("/icons/hyperjump.png");
    expect(logo.alt).toBe("Hyperjump");
    expect(logo.width).toBe(1411);
    expect(logo.height).toBe(1080);
  });

  it("returns SMDV logo config for smdv", () => {
    const logo = getCompanyLogo("smdv");
    expect(logo.src).toBe("/icons/smdv.png");
    expect(logo.alt).toBe("SMDV");
    expect(logo.width).toBe(1024);
    expect(logo.height).toBe(1024);
  });

  it("returns Sinarmas logo config for sinarmas", () => {
    const logo = getCompanyLogo("sinarmas");
    expect(logo.src).toBe("/icons/logo.svg");
    expect(logo.alt).toBe("Sinarmas");
    expect(logo.width).toBe(143);
    expect(logo.height).toBe(32);
  });
});

describe("getCompanyAppName", () => {
  it("returns SearchPoint-SMDV for smdv", () => {
    expect(getCompanyAppName("smdv")).toBe("SearchPoint-SMDV");
  });

  it("returns SearchPoint-Sinarmas for sinarmas", () => {
    expect(getCompanyAppName("sinarmas")).toBe("SearchPoint-Sinarmas");
  });

  it("returns SearchPoint-Hyperjump for hyperjump", () => {
    expect(getCompanyAppName("hyperjump")).toBe("SearchPoint-Hyperjump");
  });

  it("respects custom baseName", () => {
    expect(getCompanyAppName("sinarmas", "CustomApp")).toBe(
      "CustomApp-Sinarmas",
    );
  });
});
