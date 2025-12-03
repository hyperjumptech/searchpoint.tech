/**
 * Detects the operating system from the browser user agent
 * @returns {string} - OS identifier: darwin-aarch64, windows-x86_64, or linux-x86_64
 */
export function detectOS(): string {
  if (typeof window === "undefined") {
    return "darwin-aarch64"; // Default for server-side
  }

  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();

  // macOS detection
  if (platform.includes("mac") || userAgent.includes("mac")) {
    return "darwin-aarch64";
  }

  // Windows detection
  if (platform.includes("win") || userAgent.includes("win")) {
    return "windows-x86_64";
  }

  // Linux detection
  if (platform.includes("linux") || userAgent.includes("linux")) {
    return "linux-x86_64";
  }

  // Default fallback
  return "darwin-aarch64";
}

/**
 * Converts OS identifier to updater API format
 * @param {string} os - OS identifier (darwin-aarch64, windows-x86_64, linux-x86_64)
 * @returns {{target: string, arch: string}} - Object with target and arch for API
 */
export function osToUpdaterFormat(os: string): {
  target: string;
  arch: string;
} {
  if (os === "darwin-aarch64") {
    return { target: "darwin", arch: "aarch64" };
  }
  if (os === "windows-x86_64") {
    return { target: "windows", arch: "x86_64" };
  }
  if (os === "linux-x86_64") {
    return { target: "linux", arch: "x86_64" };
  }
  // Default fallback
  return { target: "darwin", arch: "aarch64" };
}
