/**
 * Determines whether a given path or URL is safe for internal redirection.
 * Rejects absolute URLs, protocol-relative URLs (e.g. `//evil.com`),
 * backslash tricks (e.g. `/\\evil.com`), control characters, and non-relative paths.
 */
export function isSafeRedirectPath(
  url: string | null | undefined,
): url is string {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();

  // Must start with exactly a single forward slash and not a protocol-relative slash or backslash
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return false;
  }

  // Reject CR/LF characters to avoid header injection
  if (/[\r\n\0]/.test(trimmed)) {
    return false;
  }

  return true;
}
