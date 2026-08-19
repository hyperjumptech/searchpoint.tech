import { describe, expect, it } from "vitest";
import { companyFromEmail } from "./company";

describe("companyFromEmail", () => {
  it("defaults to hyperjump when email is undefined or empty", () => {
    expect(companyFromEmail(undefined)).toBe("hyperjump");
    expect(companyFromEmail(null)).toBe("hyperjump");
    expect(companyFromEmail("")).toBe("hyperjump");
    expect(companyFromEmail("invalid-email")).toBe("hyperjump");
  });

  it("returns smdv for @smdv.com and its subdomains", () => {
    expect(companyFromEmail("user@smdv.com")).toBe("smdv");
    expect(companyFromEmail("user@mail.smdv.com")).toBe("smdv");
    expect(companyFromEmail("User@SMDV.com")).toBe("smdv");
  });

  it("returns hyperjump for @hyperjump.tech and its subdomains", () => {
    expect(companyFromEmail("user@hyperjump.tech")).toBe("hyperjump");
    expect(companyFromEmail("user@mail.hyperjump.tech")).toBe("hyperjump");
    expect(companyFromEmail("User@Hyperjump.Tech")).toBe("hyperjump");
  });

  it("returns sinarmas for other domains", () => {
    expect(companyFromEmail("user@sinarmas.com")).toBe("sinarmas");
    expect(companyFromEmail("user@banksinarmas.com")).toBe("sinarmas");
    expect(companyFromEmail("user@sinarmasland.com")).toBe("sinarmas");
    expect(companyFromEmail("user@example.org")).toBe("sinarmas");
  });

  it("does not match lookalike domains", () => {
    expect(companyFromEmail("user@notsmdv.com")).toBe("sinarmas");
    expect(companyFromEmail("user@nothyperjump.tech")).toBe("sinarmas");
  });
});
