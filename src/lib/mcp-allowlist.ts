import type { QueryResultRow } from "pg";

import { env } from "./env.server";
import { parseClientsEnv } from "./oauth-dcr";
import { getPostgresPool } from "./postgres";

const MAX_CLIENT_ID_LENGTH = 255;
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

export type AllowedApplication = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AllowedApplicationInput = {
  clientId: string;
  name: string;
  description?: string | null;
};

export type DcrPolicy = {
  id: string;
  name: string;
  redirectUri: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  clientIds: string[];
};

export type DcrPolicyInput = {
  name: string;
  redirectUri: string;
  description?: string | null;
};

export class AllowlistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AllowlistValidationError";
  }
}

export class DuplicateAllowedApplicationError extends Error {
  constructor() {
    super("An application with this client ID already exists");
    this.name = "DuplicateAllowedApplicationError";
  }
}

export class DuplicateDcrPolicyError extends Error {
  constructor() {
    super("A DCR policy with this redirect URI already exists");
    this.name = "DuplicateDcrPolicyError";
  }
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS mcp_allowed_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id varchar(255) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    description varchar(2000),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS mcp_allowed_applications_client_id_idx
  ON mcp_allowed_applications (client_id)
`;

const CREATE_INITIALIZATION_STATE_SQL = `
  CREATE TABLE IF NOT EXISTS mcp_allowlist_initialization (
    id smallint PRIMARY KEY CHECK (id = 1),
    initialized_at timestamptz NOT NULL DEFAULT now()
  )
`;

const CREATE_DCR_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS mcp_dcr_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    redirect_uri text NOT NULL UNIQUE,
    description varchar(2000),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS mcp_dcr_clients (
    policy_id uuid NOT NULL REFERENCES mcp_dcr_policies(id) ON DELETE CASCADE,
    client_id varchar(255) PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`;

const INSERT_INITIALIZATION_STATE_SQL = `
  INSERT INTO mcp_allowlist_initialization (id)
  VALUES (1)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
`;

const SELECT_COLUMNS = `
  id, client_id, name, description, enabled, created_at, updated_at
`;

function mapRow(row: QueryResultRow): AllowedApplication {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateInput(
  input: AllowedApplicationInput,
): AllowedApplicationInput {
  const clientId = input.clientId.trim();
  const name = input.name.trim();
  const description =
    input.description === undefined ? undefined : input.description;

  if (!clientId || clientId.length > MAX_CLIENT_ID_LENGTH) {
    throw new AllowlistValidationError(
      "clientId must be between 1 and 255 characters",
    );
  }
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new AllowlistValidationError(
      "name must be between 1 and 255 characters",
    );
  }
  if (
    description !== undefined &&
    description !== null &&
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new AllowlistValidationError(
      "description must be at most 2000 characters",
    );
  }

  return { clientId, name, description };
}

function validateUpdate(
  input: Partial<AllowedApplicationInput> & { enabled?: boolean },
) {
  if (
    input.clientId !== undefined ||
    input.name !== undefined ||
    input.description !== undefined
  ) {
    validateInput({
      clientId: input.clientId ?? "existing-client-id",
      name: input.name ?? "Existing application",
      description: input.description,
    });
  }
  if (input.enabled !== undefined && typeof input.enabled !== "boolean") {
    throw new AllowlistValidationError("enabled must be a boolean");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function mapPolicy(row: QueryResultRow, clientIds: string[] = []): DcrPolicy {
  return {
    id: row.id,
    name: row.name,
    redirectUri: row.redirect_uri,
    description: row.description,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientIds,
  };
}

function validatePolicy(input: DcrPolicyInput): DcrPolicyInput {
  const name = input.name.trim();
  const redirectUri = input.redirectUri.trim();
  if (!name || name.length > MAX_NAME_LENGTH)
    throw new AllowlistValidationError(
      "name must be between 1 and 255 characters",
    );
  if (!redirectUri || redirectUri.length > 2048)
    throw new AllowlistValidationError(
      "redirectUri must be between 1 and 2048 characters",
    );
  try {
    new URL(redirectUri);
  } catch {
    throw new AllowlistValidationError("redirectUri must be a valid URL");
  }
  if (
    input.description !== undefined &&
    input.description !== null &&
    input.description.length > MAX_DESCRIPTION_LENGTH
  )
    throw new AllowlistValidationError(
      "description must be at most 2000 characters",
    );
  return { name, redirectUri, description: input.description };
}

function loopback(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}
function redirectMatches(configured: string, requested: string): boolean {
  try {
    const a = new URL(configured),
      b = new URL(requested);
    if (
      a.protocol !== b.protocol ||
      a.pathname !== b.pathname ||
      a.search !== b.search
    )
      return false;
    if (loopback(a.hostname) && loopback(b.hostname) && a.protocol === "http:")
      return true;
    return a.hostname === b.hostname && a.port === b.port;
  } catch {
    return false;
  }
}

async function queryWithDuplicateMapping<T>(
  operation: () => Promise<T>,
  duplicateError: () => Error = () => new DuplicateAllowedApplicationError(),
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateError();
    throw error;
  }
}

export async function ensureMcpAllowlist(): Promise<void> {
  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(CREATE_TABLE_SQL);
    await client.query(CREATE_INDEX_SQL);
    await client.query(CREATE_DCR_TABLES_SQL);
    await client.query(CREATE_INITIALIZATION_STATE_SQL);
    const initialization = await client.query(INSERT_INITIALIZATION_STATE_SQL);

    if (env.OAUTH_REGISTERED_CLIENTS?.trim()) {
      const { clients } = parseClientsEnv(env.OAUTH_REGISTERED_CLIENTS);
      for (const registeredClient of clients) {
        await client.query(
          `INSERT INTO mcp_dcr_policies (name, redirect_uri, description)
           VALUES ($1, $2, $3) ON CONFLICT (redirect_uri) DO NOTHING`,
          [
            registeredClient.name,
            registeredClient.redirectUri,
            registeredClient.redirectUri,
          ],
        );
      }
    }

    if (initialization.rows.length > 0) {
      const result = await client.query(
        "SELECT count(*)::int AS count FROM mcp_allowed_applications",
      );
      const count = Number(result.rows[0]?.count ?? 0);
      if (count > 0 || !env.OAUTH_REGISTERED_CLIENTS?.trim()) {
        await client.query("COMMIT");
        return;
      }

      const { clients } = parseClientsEnv(env.OAUTH_REGISTERED_CLIENTS);
      for (const registeredClient of clients) {
        await client.query(
          `INSERT INTO mcp_allowed_applications (client_id, name, description)
           VALUES ($1, $2, $3) ON CONFLICT (client_id) DO NOTHING`,
          [
            registeredClient.token,
            registeredClient.name,
            registeredClient.redirectUri,
          ],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

const POLICY_COLUMNS =
  "id, name, redirect_uri, description, enabled, created_at, updated_at";
async function policyClients(id: string) {
  const result = await getPostgresPool().query(
    "SELECT client_id FROM mcp_dcr_clients WHERE policy_id = $1 ORDER BY created_at ASC",
    [id],
  );
  return result.rows.map((r) => r.client_id as string);
}
export async function listDcrPolicies(): Promise<DcrPolicy[]> {
  const result = await getPostgresPool().query(
    `SELECT ${POLICY_COLUMNS} FROM mcp_dcr_policies ORDER BY created_at ASC, id ASC`,
    [],
  );
  return Promise.all(
    result.rows.map(async (r) => mapPolicy(r, await policyClients(r.id))),
  );
}
export async function createDcrPolicy(
  input: DcrPolicyInput,
): Promise<DcrPolicy> {
  const valid = validatePolicy(input);
  try {
    const result = await getPostgresPool().query(
      `INSERT INTO mcp_dcr_policies (name, redirect_uri, description) VALUES ($1, $2, $3) RETURNING ${POLICY_COLUMNS}`,
      [valid.name, valid.redirectUri, valid.description ?? null],
    );
    return mapPolicy(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateDcrPolicyError();
    throw error;
  }
}
export async function updateDcrPolicy(
  id: string,
  input: Partial<DcrPolicyInput> & { enabled?: boolean },
): Promise<DcrPolicy | null> {
  const fields: string[] = [],
    values: unknown[] = [];
  if (input.name !== undefined || input.redirectUri !== undefined) {
    const v = validatePolicy({
      name: input.name ?? "Existing policy",
      redirectUri: input.redirectUri ?? "http://localhost/",
      description: input.description,
    });
    if (input.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(v.name);
    }
    if (input.redirectUri !== undefined) {
      fields.push(`redirect_uri = $${values.length + 1}`);
      values.push(v.redirectUri);
    }
  }
  if (input.description !== undefined) {
    if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH)
      throw new AllowlistValidationError(
        "description must be at most 2000 characters",
      );
    fields.push(`description = $${values.length + 1}`);
    values.push(input.description);
  }
  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean")
      throw new AllowlistValidationError("enabled must be a boolean");
    fields.push(`enabled = $${values.length + 1}`);
    values.push(input.enabled);
  }
  if (!fields.length) return null;
  fields.push("updated_at = now()");
  values.push(id);
  return queryWithDuplicateMapping(
    async () => {
      const r = await getPostgresPool().query(
        `UPDATE mcp_dcr_policies SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${POLICY_COLUMNS}`,
        values,
      );
      return r.rows[0] ? mapPolicy(r.rows[0], await policyClients(id)) : null;
    },
    () => new DuplicateDcrPolicyError(),
  );
}
export async function deleteDcrPolicy(id: string): Promise<boolean> {
  const r = await getPostgresPool().query(
    "UPDATE mcp_dcr_policies SET enabled = false, updated_at = now() WHERE id = $1",
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}
export async function findEnabledDcrPolicyByRedirectUri(
  redirectUri: string,
): Promise<DcrPolicy | null> {
  const found = await findDcrPolicyByRedirectUri(redirectUri);
  return found?.enabled ? found : null;
}

/** Finds the governing policy, including disabled policies, for precedence checks. */
export async function findDcrPolicyByRedirectUri(
  redirectUri: string,
): Promise<DcrPolicy | null> {
  const r = await getPostgresPool().query(
    `SELECT ${POLICY_COLUMNS} FROM mcp_dcr_policies`,
    [],
  );
  const found = r.rows.find((row) =>
    redirectMatches(row.redirect_uri, redirectUri),
  );
  return found ? mapPolicy(found, await policyClients(found.id)) : null;
}
export async function associateDcrClientId(
  policyId: string,
  clientId: string,
): Promise<void> {
  await getPostgresPool().query(
    "INSERT INTO mcp_dcr_clients (policy_id, client_id) VALUES ($1, $2) ON CONFLICT (client_id) DO UPDATE SET policy_id = EXCLUDED.policy_id",
    [policyId, clientId],
  );
}

export async function listAllowedApplications(): Promise<AllowedApplication[]> {
  const result = await getPostgresPool().query(
    `SELECT ${SELECT_COLUMNS} FROM mcp_allowed_applications ORDER BY created_at ASC, id ASC`,
    [],
  );
  return result.rows.map(mapRow);
}

export async function createAllowedApplication(
  input: AllowedApplicationInput,
): Promise<AllowedApplication> {
  const valid = validateInput(input);
  return queryWithDuplicateMapping(async () => {
    const result = await getPostgresPool().query(
      `INSERT INTO mcp_allowed_applications (client_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING ${SELECT_COLUMNS}`,
      [valid.clientId, valid.name, valid.description ?? null],
    );
    return mapRow(result.rows[0]);
  });
}

export async function updateAllowedApplication(
  id: string,
  input: Partial<AllowedApplicationInput> & { enabled?: boolean },
): Promise<AllowedApplication | null> {
  validateUpdate(input);
  const fields: string[] = [];
  const values: unknown[] = [];
  if (input.clientId !== undefined) {
    fields.push(`client_id = $${values.length + 1}`);
    values.push(input.clientId.trim());
  }
  if (input.name !== undefined) {
    fields.push(`name = $${values.length + 1}`);
    values.push(input.name.trim());
  }
  if (input.description !== undefined) {
    fields.push(`description = $${values.length + 1}`);
    values.push(input.description);
  }
  if (input.enabled !== undefined) {
    fields.push(`enabled = $${values.length + 1}`);
    values.push(input.enabled);
  }
  if (fields.length === 0) return null;
  fields.push("updated_at = now()");
  values.push(id);

  return queryWithDuplicateMapping(async () => {
    const result = await getPostgresPool().query(
      `UPDATE mcp_allowed_applications
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${SELECT_COLUMNS}`,
      values,
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  });
}

export async function deleteAllowedApplication(id: string): Promise<boolean> {
  const result = await getPostgresPool().query(
    "DELETE FROM mcp_allowed_applications WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function isMcpClientAllowed(clientId: string): Promise<boolean> {
  const result = await getPostgresPool().query(
    `SELECT 1 AS exists FROM mcp_allowed_applications
     WHERE client_id = $1 AND enabled = true
     LIMIT 1`,
    [clientId],
  );
  return result.rows.length > 0;
}

export async function isGeneratedClientAllowed(
  clientId: string,
): Promise<boolean> {
  const generated = await getPostgresPool().query(
    `SELECT p.enabled FROM mcp_dcr_clients c JOIN mcp_dcr_policies p ON p.id = c.policy_id
     WHERE c.client_id = $1 LIMIT 1`,
    [clientId],
  );
  // DCR association takes precedence over the legacy allowlist: a disabled or
  // deleted policy must not be bypassed by a stale static entry.
  if ((generated?.rows?.length ?? 0) > 0)
    return generated.rows[0].enabled === true;
  return isMcpClientAllowed(clientId);
}
