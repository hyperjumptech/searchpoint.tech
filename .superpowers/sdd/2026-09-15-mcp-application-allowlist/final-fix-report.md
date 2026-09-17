# Final Fix Report

## Findings Fixed

- Added the durable `mcp_allowlist_initialization` singleton table. Environment
  registrations are seeded only by the transaction that first claims
  initialization and only when the application table is empty. Deleting the
  final application row no longer causes later requests to reseed clients.
- Added authorization-flow allowlist enforcement before OAuth state creation.
  Unknown or disabled clients receive the existing `invalid_client` response;
  allowlist database failures return `temporarily_unavailable` and do not create
  state.

## Regression Coverage

- Repository test covers first seed, deletion of the final row, and a subsequent
  ensure without reseeding.
- Authorization tests cover an allowlist-disabled client, an unknown allowlist
  client, an enabled client, and database failure before state storage.

## Verification

- Covering Vitest: 71 passed.
- Full Vitest: 424 passed, 2 skipped integration tests because
  `TEST_DATABASE_URL` was not configured.
- Lint: passed with 2 existing unused-parameter warnings in test files.
- Build: passed. Next.js reported the existing multiple-lockfile workspace-root
  warning.

## Concerns

- PostgreSQL integration tests were not run because no test database URL was
  provided.
- The durable initialization marker is intentionally separate from the
  application table and must be retained with the PostgreSQL database.
