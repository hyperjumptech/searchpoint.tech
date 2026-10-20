import { cookies } from "next/headers";

import { env } from "@/lib/env";

const ALLOWED_PATH_PREFIXES = [
  "/v1/auth/",
  "/v1/files/",
  "/v1/preferences",
  "/v1/onedrive/",
  "/v1/connections",
];

export class FetchError extends Error {
  status: number;
  response: Response;
  errorBody?: unknown;

  constructor(
    message: string,
    status: number,
    response: Response,
    errorBody?: unknown,
  ) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.response = response;
    this.errorBody = errorBody;
  }
}

export interface FetcherOptions extends RequestInit {
  returnErrorResponse?: boolean;
}

function resolveBackendUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("fetcher only accepts backend-relative paths");
  }

  const backendOrigin = new URL(env.BACKEND_BASE_URL).origin;
  const url = new URL(path, env.BACKEND_BASE_URL);

  if (url.origin !== backendOrigin) {
    throw new Error("fetcher resolved outside the backend origin");
  }

  // Checked against the normalized pathname so traversal cannot escape a prefix.
  const isAllowed = ALLOWED_PATH_PREFIXES.some(
    (prefix) =>
      url.pathname === prefix ||
      (prefix.endsWith("/")
        ? url.pathname.startsWith(prefix)
        : url.pathname.startsWith(`${prefix}/`)),
  );

  if (!isAllowed) {
    throw new Error("fetcher path is not on the allowlist");
  }

  return url;
}

export async function fetcher(
  path: string,
  init?: FetcherOptions,
): Promise<Response> {
  const url = resolveBackendUrl(path);
  const cookieStore = await cookies();
  const token = cookieStore.get("SCSE_ID")?.value;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      "User-Agent": "frontend",
      ...(token ? { Cookie: `SCSE_ID=${token}` } : {}),
    },
  });

  if (!response.ok) {
    if (
      init?.returnErrorResponse ||
      response.status === 401 ||
      response.status === 404
    ) {
      return response;
    }

    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (typeof errorBody?.error === "string"
        ? errorBody.error
        : errorBody?.error?.message) ||
      errorBody?.message ||
      response.statusText ||
      "Request failed";

    throw new FetchError(errorMessage, response.status, response, errorBody);
  }

  return response;
}
