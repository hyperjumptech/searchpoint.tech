import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { env } from "./env";
import { validateLogoDataUrl } from "./mcp-client-logo";

async function getPostgresPool() {
  return (await import("./postgres")).getPostgresPool();
}

export type StaticClient = {
  clientId: string;
  name: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  credentialVersion: number;
  logoDataUrl: string | null;
};

export type StaticClientInput = {
  name: string;
  redirectUri: string;
  scopes?: string[];
  enabled?: boolean;
  logoDataUrl?: string | null;
};
export class StaticClientValidationError extends Error {}
export class StaticClientNotFoundError extends Error {}
export class StaticClientDuplicateError extends Error {}

const schema = `CREATE TABLE IF NOT EXISTS mcp_static_oauth_clients (
  client_id TEXT PRIMARY KEY, client_secret_hash TEXT NOT NULL, name TEXT NOT NULL,
  redirect_uri TEXT NOT NULL, scopes TEXT[] NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true,
  revoked BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ,
  credential_version INTEGER NOT NULL DEFAULT 1
)`;
let schemaReady: Promise<void> | undefined;
export async function ensureStaticClientSchema(): Promise<void> {
  return (schemaReady ??= (async () => {
    const pool = await getPostgresPool();
    const result = await pool.query(schema);
    // The second statement is an idempotent migration for tables created before
    // credential versioning. Keep the guard for lightweight unit-test clients
    // whose schema mock intentionally returns no query result.
    if (result && "rowCount" in result) {
      await pool.query(
        "ALTER TABLE mcp_static_oauth_clients ADD COLUMN IF NOT EXISTS credential_version INTEGER NOT NULL DEFAULT 1",
      );
      await pool.query(
        "ALTER TABLE mcp_static_oauth_clients ADD COLUMN IF NOT EXISTS logo_data_url TEXT",
      );
    }
  })().catch((error) => {
    schemaReady = undefined;
    throw error;
  }));
}

export function generateStaticClientId() {
  return `searchpoint-mcp-${randomBytes(12).toString("base64url")}`;
}
export function generateStaticClientSecret() {
  return randomBytes(32).toString("base64url");
}
export function hashStaticClientSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function allowedScopes(scopes: string[]) {
  const allowed = new Set(
    (env.OAUTH_SCOPES ?? "search").split(/[\s,]+/).filter(Boolean),
  );
  // `search` is the documented default and must remain valid even when an
  // deployment narrows the optional global list.
  allowed.add("search");
  if (!scopes.length || scopes.some((scope) => !allowed.has(scope)))
    throw new StaticClientValidationError("invalid scope");
}
function validate(input: StaticClientInput) {
  if (!input.name?.trim() || input.name.trim().length > 200)
    throw new StaticClientValidationError("invalid client name");
  let uri: URL;
  try {
    uri = new URL(input.redirectUri);
  } catch {
    throw new StaticClientValidationError("invalid redirect URI");
  }
  if (
    uri.hash ||
    !(
      uri.protocol === "https:" ||
      (uri.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(uri.hostname))
    )
  )
    throw new StaticClientValidationError("invalid redirect URI");
  allowedScopes(input.scopes ?? ["search"]);
  if (typeof input.logoDataUrl === "string") {
    try {
      validateLogoDataUrl(input.logoDataUrl);
    } catch {
      throw new StaticClientValidationError("invalid logo");
    }
  }
}
type StaticClientRow = {
  client_id: string;
  name: string;
  redirect_uri: string;
  scopes: string[];
  enabled: boolean;
  revoked: boolean;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
  credential_version?: number | string | null;
  logo_data_url?: string | null;
};

function rowToClient(row: StaticClientRow): StaticClient {
  return {
    clientId: row.client_id,
    name: row.name,
    redirectUri: row.redirect_uri,
    scopes: row.scopes,
    enabled: row.enabled,
    revoked: row.revoked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    credentialVersion: Number(row.credential_version ?? 1),
    logoDataUrl: row.logo_data_url ?? null,
  };
}

export async function createStaticClient(input: StaticClientInput) {
  validate(input);
  await ensureStaticClientSchema();
  const scopes = (input.scopes ?? ["search"]).map((scope) => scope.trim());
  for (let attempt = 0; attempt < 3; attempt++) {
    const clientId = generateStaticClientId(),
      clientSecret = generateStaticClientSecret();
    try {
      const result = await (
        await getPostgresPool()
      ).query(
        `INSERT INTO mcp_static_oauth_clients (client_id, client_secret_hash, name, redirect_uri, scopes, enabled, logo_data_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          clientId,
          hashStaticClientSecret(clientSecret),
          input.name.trim(),
          input.redirectUri.trim(),
          scopes,
          input.enabled ?? true,
          input.logoDataUrl ?? null,
        ],
      );
      return { client: rowToClient(result.rows[0]), clientSecret };
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;
      if (code !== "23505" || attempt === 2) throw error;
    }
  }
  throw new Error("unable to generate unique client ID");
}
export async function getStaticClient(
  clientId: string,
): Promise<StaticClient | null> {
  await ensureStaticClientSchema();
  const r = await (
    await getPostgresPool()
  ).query(`SELECT * FROM mcp_static_oauth_clients WHERE client_id=$1`, [
    clientId,
  ]);
  return r.rows[0] ? rowToClient(r.rows[0]) : null;
}
export async function verifyStaticClientSecret(
  clientId: string,
  value: string,
) {
  await ensureStaticClientSchema();
  const r = await (
    await getPostgresPool()
  ).query(
    `SELECT client_secret_hash, enabled, revoked FROM mcp_static_oauth_clients WHERE client_id=$1`,
    [clientId],
  );
  if (!r.rows[0] || !r.rows[0].enabled || r.rows[0].revoked) return false;
  const a = Buffer.from(hashStaticClientSecret(value)),
    b = Buffer.from(r.rows[0].client_secret_hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function rotateStaticClientSecret(clientId: string) {
  await ensureStaticClientSchema();
  const clientSecret = generateStaticClientSecret();
  const r = await (
    await getPostgresPool()
  ).query(
    `UPDATE mcp_static_oauth_clients SET client_secret_hash=$2, credential_version=credential_version+1, updated_at=now() WHERE client_id=$1 AND revoked=false RETURNING client_id`,
    [clientId, hashStaticClientSecret(clientSecret)],
  );
  if (!r.rowCount) throw new StaticClientNotFoundError("client not found");
  return { clientSecret };
}
export async function updateStaticClient(
  clientId: string,
  input: Partial<StaticClientInput>,
) {
  const current = await getStaticClient(clientId);
  if (!current) return null;
  if (input.logoDataUrl !== undefined) {
    if (input.logoDataUrl !== null) {
      try {
        validateLogoDataUrl(input.logoDataUrl);
      } catch {
        throw new StaticClientValidationError("invalid logo");
      }
    }
  }
  const next = {
    name: input.name?.trim() ?? current.name,
    redirectUri: input.redirectUri?.trim() ?? current.redirectUri,
    scopes: input.scopes?.map((scope) => scope.trim()) ?? current.scopes,
    enabled: input.enabled ?? current.enabled,
  };
  validate(next);
  const pool = await getPostgresPool();
  const r =
    "logoDataUrl" in input
      ? await pool.query(
          `UPDATE mcp_static_oauth_clients SET name=$2, redirect_uri=$3, scopes=$4, enabled=$5, logo_data_url=$6, updated_at=now() WHERE client_id=$1 RETURNING *`,
          [
            clientId,
            next.name,
            next.redirectUri,
            next.scopes,
            next.enabled,
            input.logoDataUrl,
          ],
        )
      : await pool.query(
          `UPDATE mcp_static_oauth_clients SET name=$2, redirect_uri=$3, scopes=$4, enabled=$5, updated_at=now() WHERE client_id=$1 RETURNING *`,
          [clientId, next.name, next.redirectUri, next.scopes, next.enabled],
        );
  return rowToClient(r.rows[0]);
}
export async function listStaticClients() {
  await ensureStaticClientSchema();
  const r = await (
    await getPostgresPool()
  ).query(`SELECT * FROM mcp_static_oauth_clients ORDER BY created_at`);
  return r.rows.map(rowToClient);
}
export async function revokeStaticClient(clientId: string) {
  await ensureStaticClientSchema();
  const r = await (
    await getPostgresPool()
  ).query(
    `UPDATE mcp_static_oauth_clients SET revoked=true, enabled=false, revoked_at=now(), updated_at=now() WHERE client_id=$1 RETURNING *`,
    [clientId],
  );
  return r.rows[0] ? rowToClient(r.rows[0]) : null;
}
