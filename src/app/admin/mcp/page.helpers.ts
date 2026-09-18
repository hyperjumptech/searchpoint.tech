export function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
export function getApiError(response: Response, body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "string"
  )
    return (body as { error: string }).error;
  return response.status === 401
    ? "Admin authentication is required."
    : "The request could not be completed.";
}
export function validateRedirectUri(value: string): string | null {
  let uri: URL;
  try {
    uri = new URL(value.trim());
  } catch {
    return "Redirect URI must be a valid absolute URL.";
  }
  if (uri.hash) return "Redirect URI must not contain a fragment.";
  const loopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
    uri.hostname,
  );
  if (uri.protocol !== "https:" && !(uri.protocol === "http:" && loopback))
    return loopback
      ? "Redirect URI must use HTTP or HTTPS."
      : "Non-loopback redirect URIs must use HTTPS.";
  return null;
}
export const ALLOWED_SCOPES = ["search"] as const;
export const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024;

export function logoFileError(file: File): string | null {
  return file.size > MAX_LOGO_FILE_BYTES
    ? "Logo must be 2MB or smaller."
    : null;
}

export function buildClientPayload(
  values: { name: string; redirectUri: string; scopes: string[] },
  allowed: readonly string[] = ALLOWED_SCOPES,
  logo: { logoDataUrl: string | null } | "omit" = "omit",
) {
  const payload: {
    name: string;
    redirectUri: string;
    scopes: string[];
    logoDataUrl?: string | null;
  } = {
    name: values.name.trim(),
    redirectUri: values.redirectUri.trim(),
    scopes: values.scopes.filter((scope) => allowed.includes(scope)),
  };
  if (logo !== "omit") payload.logoDataUrl = logo.logoDataUrl;
  return payload;
}
export function replaceClient<T extends { clientId: string }>(
  items: T[],
  next: T,
) {
  return items.map((item) => (item.clientId === next.clientId ? next : item));
}
// Compatibility helpers retained for consumers of the previous admin page.
export function buildPolicyPayload(values: {
  name: string;
  redirectUri: string;
  description: string;
}) {
  return {
    name: values.name.trim(),
    redirectUri: values.redirectUri.trim(),
    description: values.description.trim() || null,
  };
}
export function removePolicy<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}
export function replacePolicy<T extends { id: string }>(items: T[], next: T) {
  return items.map((item) => (item.id === next.id ? next : item));
}
