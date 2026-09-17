import { afterEach, describe, expect, it, vi } from "vitest";

const poolConstructors = vi.hoisted(() => vi.fn());

vi.mock("pg", () => ({
  Pool: class MockPool {
    options: { connectionString?: string };
    end = vi.fn().mockResolvedValue(undefined);

    constructor(options: { connectionString?: string }) {
      poolConstructors(options);
      this.options = options;
    }
  },
}));
vi.mock("server-only", () => ({}));

describe("postgres pool", () => {
  afterEach(async () => {
    const { closePostgresPool } = await import("./postgres");
    await closePostgresPool();
    poolConstructors.mockClear();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lazily creates and reuses a pool configured with DATABASE_URL", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@localhost:5432/searchpoint",
    );
    const { getPostgresPool } = await import("./postgres");

    const firstPool = getPostgresPool();
    const secondPool = getPostgresPool();

    expect(firstPool).toBe(secondPool);
    expect(firstPool.options.connectionString).toBe(
      "postgres://user:pass@localhost:5432/searchpoint",
    );
  });

  it("does not create a pool while postgres is imported", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@localhost:5432/searchpoint",
    );

    await import("./postgres");

    expect(poolConstructors).not.toHaveBeenCalled();
  });

  it("resets the singleton after closing the pool", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@localhost:5432/searchpoint",
    );
    const { closePostgresPool, getPostgresPool } = await import("./postgres");

    const firstPool = getPostgresPool();
    await closePostgresPool();
    const secondPool = getPostgresPool();

    expect(firstPool.end).toHaveBeenCalledOnce();
    expect(secondPool).not.toBe(firstPool);
    expect(poolConstructors).toHaveBeenCalledTimes(2);
  });

  it("throws a typed configuration error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { PostgresConfigurationError, getPostgresPool } =
      await import("./postgres");

    expect(() => getPostgresPool()).toThrow(PostgresConfigurationError);
  });
});
