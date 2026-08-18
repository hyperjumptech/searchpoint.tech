import { describe, expect, it } from "vitest";
import { isLoginBypassEnabled } from "@/lib/is-login-bypass-enabled";

describe("isLoginBypassEnabled", () => {
  it("honors BYPASS_LOGIN=true when NODE_ENV is development", () => {
    // Act
    const enabled = isLoginBypassEnabled({
      NODE_ENV: "development",
      BYPASS_LOGIN: "true",
    });

    // Assert
    expect(enabled).toBe(true);
  });

  it("honors BYPASS_LOGIN=true when NODE_ENV is test", () => {
    // Act
    const enabled = isLoginBypassEnabled({
      NODE_ENV: "test",
      BYPASS_LOGIN: "true",
    });

    // Assert
    expect(enabled).toBe(true);
  });

  it("ignores BYPASS_LOGIN=true when NODE_ENV is production", () => {
    // Act
    const enabled = isLoginBypassEnabled({
      NODE_ENV: "production",
      BYPASS_LOGIN: "true",
    });

    // Assert
    expect(enabled).toBe(false);
  });

  it("treats True and 1 as enabled outside production", () => {
    // Act
    const fromTrue = isLoginBypassEnabled({
      NODE_ENV: "development",
      BYPASS_LOGIN: "True",
    });
    const fromOne = isLoginBypassEnabled({
      NODE_ENV: "development",
      BYPASS_LOGIN: "1",
    });

    // Assert
    expect(fromTrue).toBe(true);
    expect(fromOne).toBe(true);
  });

  it("stays disabled when BYPASS_LOGIN is unset or a non-truthy value", () => {
    // Act
    const unset = isLoginBypassEnabled({ NODE_ENV: "development" });
    const falseFlag = isLoginBypassEnabled({
      NODE_ENV: "development",
      BYPASS_LOGIN: "false",
    });

    // Assert
    expect(unset).toBe(false);
    expect(falseFlag).toBe(false);
  });

  it("does not enable bypass for True or 1 in production", () => {
    // Act
    const fromTrue = isLoginBypassEnabled({
      NODE_ENV: "production",
      BYPASS_LOGIN: "True",
    });
    const fromOne = isLoginBypassEnabled({
      NODE_ENV: "production",
      BYPASS_LOGIN: "1",
    });

    // Assert
    expect(fromTrue).toBe(false);
    expect(fromOne).toBe(false);
  });
});
