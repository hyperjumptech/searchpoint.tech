import { createHash, randomBytes } from "crypto";

import { env } from "@/lib/env";

export type RegisteredClient = {
  name: string;
  token: string;
  redirectUri: string;
};

export type ParsedClientsEnv = {
  clients: RegisteredClient[];
  byToken: Map<string, RegisteredClient>;
};

export function parseClientsEnv(raw: string): ParsedClientsEnv {
  const clients: RegisteredClient[] = [];
  const byToken = new Map<string, RegisteredClient>();
  const entries = raw.split(";").filter((e) => e.trim() !== "");
  if (entries.length === 0)
    throw new Error("OAUTH_REGISTERED_CLIENTS is empty");
  for (const entry of entries) {
    const parts = entry.split("|");
    if (
      parts.length !== 3 ||
      !parts[0].trim() ||
      !parts[1].trim() ||
      !parts[2].trim()
    ) {
      throw new Error(`Malformed OAUTH_REGISTERED_CLIENTS entry: "${entry}"`);
    }
    const rc: RegisteredClient = {
      name: parts[0].trim(),
      token: parts[1].trim(),
      redirectUri: parts[2].trim(),
    };
    clients.push(rc);
    byToken.set(rc.token, rc);
  }
  return { clients, byToken };
}

let parsed: ParsedClientsEnv | null = null;

function getParsed(): ParsedClientsEnv {
  if (!parsed) parsed = parseClientsEnv(env.OAUTH_REGISTERED_CLIENTS ?? "");
  return parsed;
}

export function resolveRegisteredToken(token: string): RegisteredClient | null {
  return getParsed().byToken.get(token) ?? null;
}

export function redirectUriMatches(
  registeredUri: string,
  requestedUri: string,
): boolean {
  if (registeredUri === requestedUri) return true;
  // For loopback http (RFC 8252 native apps), port is ephemeral — match ignoring port.
  try {
    const reg = new URL(registeredUri);
    const req = new URL(requestedUri);
    if (reg.protocol !== req.protocol) return false;
    if (reg.hostname !== req.hostname) return false;
    if (reg.pathname !== req.pathname) return false;
    if (reg.search !== req.search) return false;
    if (isLoopbackHttp(registeredUri) && isLoopbackHttp(requestedUri)) {
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

export function resolveRegisteredByRedirectUri(
  redirectUri: string,
): RegisteredClient | null {
  return (
    getParsed().clients.find((c) =>
      redirectUriMatches(c.redirectUri, redirectUri),
    ) ?? null
  );
}

export function resolveRegisteredByName(name: string): RegisteredClient | null {
  return getParsed().clients.find((c) => c.name === name) ?? null;
}

export const ALLOWED_GRANT_TYPES = ["authorization_code", "refresh_token"];
export const ALLOWED_RESPONSE_TYPES = ["code"];
export const ALLOWED_AUTH_METHODS = [
  "none",
  "client_secret_basic",
  "client_secret_post",
];

export type MetadataErrorCode =
  | "invalid_request"
  | "invalid_redirect_uri"
  | "invalid_scope";

export class MetadataError extends Error {
  code: MetadataErrorCode;

  constructor(code: MetadataErrorCode, message: string) {
    super(message);
    this.name = "MetadataError";
    this.code = code;
  }
}

function isLoopbackHttp(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol !== "http:") return false;
    return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch {
    return false;
  }
}

function assertValidRedirectUri(uri: string): void {
  if (!uri || uri.includes("#")) {
    throw new MetadataError("invalid_redirect_uri", "invalid redirect_uri");
  }
  const ok = uri.startsWith("https://") || isLoopbackHttp(uri);
  if (!ok)
    throw new MetadataError("invalid_redirect_uri", "invalid redirect_uri");
}

export function validateMetadata(body: unknown): {
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  scope?: string;
  clientName?: string;
} {
  if (!body || typeof body !== "object") {
    throw new MetadataError("invalid_request", "invalid_request");
  }
  const b = body as Record<string, unknown>;
  const redirectUrisRaw = b.redirect_uris;
  if (!Array.isArray(redirectUrisRaw) || redirectUrisRaw.length === 0) {
    throw new MetadataError("invalid_redirect_uri", "invalid redirect_uri");
  }
  const redirectUris = redirectUrisRaw.map(String);
  for (const uri of redirectUris) assertValidRedirectUri(uri);

  const grantTypesRaw = Array.isArray(b.grant_types)
    ? (b.grant_types as unknown[]).map(String)
    : ["authorization_code"];
  for (const g of grantTypesRaw) {
    if (!ALLOWED_GRANT_TYPES.includes(g))
      throw new MetadataError("invalid_request", "invalid grant_types");
  }

  const responseTypesRaw = Array.isArray(b.response_types)
    ? (b.response_types as unknown[]).map(String)
    : ["code"];
  for (const r of responseTypesRaw) {
    if (!ALLOWED_RESPONSE_TYPES.includes(r))
      throw new MetadataError("invalid_request", "invalid response_types");
  }

  const authMethod =
    typeof b.token_endpoint_auth_method === "string"
      ? b.token_endpoint_auth_method
      : "client_secret_post";
  if (!ALLOWED_AUTH_METHODS.includes(authMethod))
    throw new MetadataError(
      "invalid_request",
      "invalid token_endpoint_auth_method",
    );

  let scope: string | undefined;
  const scopeRaw = typeof b.scope === "string" ? b.scope : undefined;
  if (scopeRaw !== undefined) {
    const requested = scopeRaw.split(/[\s,]+/).filter(Boolean);
    const allowed = env.OAUTH_SCOPES.split(/[\s,]+/).filter(Boolean);
    for (const s of requested) {
      if (!allowed.includes(s))
        throw new MetadataError("invalid_scope", "invalid scope");
    }
    scope = requested.join(" ");
  }

  const clientName =
    typeof b.client_name === "string" && b.client_name.trim()
      ? b.client_name.trim()
      : undefined;

  return {
    redirectUris,
    grantTypes: grantTypesRaw,
    responseTypes: responseTypesRaw,
    tokenEndpointAuthMethod: authMethod,
    scope,
    clientName,
  };
}

export function generateClientId(): string {
  return `searchpoint-mcp-${randomBytes(9).toString("base64url")}`;
}

export function generateClientSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
