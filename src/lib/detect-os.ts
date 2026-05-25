export function detectOSFromUA(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("mac")) return "darwin-aarch64";
  if (ua.includes("win")) return "windows-x86_64";
  if (ua.includes("linux")) return "linux-x86_64";

  return "darwin-aarch64";
}

export function detectOS(): string {
  if (typeof window === "undefined") return "darwin-aarch64";
  return detectOSFromUA(window.navigator.userAgent);
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
