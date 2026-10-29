import { describe, it, expect, afterEach, vi } from "vitest";
import {
  detectOS,
  detectOSFromUA,
  hasGoogleChromeBrand,
  osToUpdaterFormat,
} from "./detect-os";

describe("detectOSFromUA", () => {
  it("detects macOS from user agent containing mac", () => {
    // Setup
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

    // Act
    const result = detectOSFromUA(ua);

    // Assert
    expect(result).toBe("darwin-aarch64");
  });

  it("detects Windows from user agent containing win", () => {
    // Setup
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    // Act
    const result = detectOSFromUA(ua);

    // Assert
    expect(result).toBe("windows-x86_64");
  });

  it("detects Linux from user agent containing linux", () => {
    // Setup
    const ua =
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)";

    // Act
    const result = detectOSFromUA(ua);

    // Assert
    expect(result).toBe("linux-x86_64");
  });

  it("falls back to darwin-aarch64 for unknown user agents", () => {
    // Setup
    const ua = "UnknownBrowser/1.0";

    // Act
    const result = detectOSFromUA(ua);

    // Assert
    expect(result).toBe("darwin-aarch64");
  });
});

describe("detectOS", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error - restoring global window
    delete globalThis.window;
  });

  it("returns darwin-aarch64 fallback when window is undefined (server-side)", () => {
    // Act
    const result = detectOS();

    // Assert
    expect(result).toBe("darwin-aarch64");
  });

  it("detects OS from window navigator userAgent in browser environment", () => {
    // Setup
    globalThis.window = {
      navigator: {
        userAgent:
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0",
      },
    } as unknown as Window & typeof globalThis;

    // Act
    const result = detectOS();

    // Assert
    expect(result).toBe("linux-x86_64");
  });
});

describe("osToUpdaterFormat", () => {
  it("maps darwin-aarch64 to target darwin and arch aarch64", () => {
    // Act
    const result = osToUpdaterFormat("darwin-aarch64");

    // Assert
    expect(result).toEqual({ target: "darwin", arch: "aarch64" });
  });

  it("maps windows-x86_64 to target windows and arch x86_64", () => {
    // Act
    const result = osToUpdaterFormat("windows-x86_64");

    // Assert
    expect(result).toEqual({ target: "windows", arch: "x86_64" });
  });

  it("maps linux-x86_64 to target linux and arch x86_64", () => {
    // Act
    const result = osToUpdaterFormat("linux-x86_64");

    // Assert
    expect(result).toEqual({ target: "linux", arch: "x86_64" });
  });

  it("falls back to darwin aarch64 for unknown OS identifier", () => {
    // Act
    const result = osToUpdaterFormat("unknown-os");

    // Assert
    expect(result).toEqual({ target: "darwin", arch: "aarch64" });
  });
});

describe("hasGoogleChromeBrand", () => {
  it("returns true when Google Chrome brand header is present", () => {
    // Setup
    const secChUa = '"Chromium";v="120", "Google Chrome";v="120"';

    // Act
    const result = hasGoogleChromeBrand(secChUa);

    // Assert
    expect(result).toBe(true);
  });

  it("returns false when secChUa is null", () => {
    // Act
    const result = hasGoogleChromeBrand(null);

    // Assert
    expect(result).toBe(false);
  });

  it("returns false for non-Chrome browsers like Edge", () => {
    // Setup
    const secChUa = '"Chromium";v="120", "Microsoft Edge";v="120"';

    // Act
    const result = hasGoogleChromeBrand(secChUa);

    // Assert
    expect(result).toBe(false);
  });
});
