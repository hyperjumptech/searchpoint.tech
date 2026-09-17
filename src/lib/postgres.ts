import { Pool } from "pg";

import { env } from "./env.server";

export class PostgresConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL is required to use PostgreSQL");
    this.name = "PostgresConfigurationError";
  }
}

let pool: Pool | undefined;

export function getPostgresPool(): Pool {
  if (pool) return pool;

  if (!env.DATABASE_URL) {
    throw new PostgresConfigurationError();
  }

  pool = new Pool({ connectionString: env.DATABASE_URL });
  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;

  const currentPool = pool;
  pool = undefined;
  await currentPool.end();
}

/** Run an idempotent schema statement using the application PostgreSQL pool. */
