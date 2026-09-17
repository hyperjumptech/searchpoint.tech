# Task 1 report

## Files

- Added `src/lib/oauth-static-client.ts` with PostgreSQL-backed static client creation, metadata retrieval/listing, updates, revocation, secret verification, rotation, validation, and idempotent schema creation.
- Added unit coverage in `src/lib/oauth-static-client.test.ts`.
- Added `TEST_DATABASE_URL`-gated integration test scaffold in `src/lib/oauth-static-client.integration.test.ts`.
- Added `ensurePostgresSchema` helper to `src/lib/postgres.ts`.

## Tests/output

- `bunx vitest run src/lib/oauth-static-client.test.ts` — passed (2 tests).
- `bunx tsc --noEmit` — existing unrelated failures in e2e/admin-mcp, resolve-magic-link, OAuth register, detect-os tests; no reported errors from the new implementation.
- Integration test was skipped because `TEST_DATABASE_URL` is not configured.

## Commit

`e5e25af feat: persist static MCP OAuth clients`

## Concerns

- Full CRUD/rotation database tests require a configured PostgreSQL test database and remain gated.
- Existing TypeScript baseline has unrelated failures listed above.
- Route integration and DCR behavior were intentionally not changed per task scope.

## Review fixes

- Added mocked query-boundary coverage for one-time/hash-only secrets, generation, defaults and scope validation, collision retry, rotation/revocation, and database failures.
- Enforced HTTPS or RFC 8252 loopback HTTP redirect rules, fragment rejection, trimming, name length limit, and normalized updates.
- Removed the unused duplicate PostgreSQL schema helper; static-client initialization has one path.
- Added generated-ID collision retry handling.
- Focused output: `bunx vitest run src/lib/oauth-static-client.test.ts src/lib/oauth-static-client.integration.test.ts` — 1 file passed, 6 tests passed; integration file 1 test skipped without `TEST_DATABASE_URL`.
- Fix commit: `9962cd5 fix: harden static OAuth client lifecycle`.

## Additional review fixes

- Added genuine mocked-boundary tests for plaintext secret one-time response and hash-only persistence, old/new secret rotation validity, disabled/revoked verification rejection, and DB failure propagation across retrieval, verification, rotation, update, list, and revoke.
- Focused output: `bunx vitest run src/lib/oauth-static-client.test.ts` — 1 file passed, 14 tests passed.
- Commit: `test: cover static OAuth client failure lifecycle`.
