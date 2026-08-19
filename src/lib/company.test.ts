import { describe, expect, it } from "vitest";
import { companyFromHostname, getCompanyAppName } from "./company";

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
