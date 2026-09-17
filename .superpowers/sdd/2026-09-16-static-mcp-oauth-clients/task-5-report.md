# Task 5 report

## Status

Implemented documentation and E2E updates for static MCP OAuth clients.

## Changes

- Documented administrator-created clients at `/admin/mcp`, one exact redirect
  URI, scopes, one-time secret display, rotation, disable, and revoke behavior.
- Marked `OAUTH_REGISTERED_CLIENTS` deprecated and documented its one-time,
  empty-database migration behavior.
- Documented that DCR and `registration_endpoint` are disabled.
- Replaced obsolete DCR/allowlist UI E2E coverage with static-client creation,
  one-time secret display, discovery, and disabled-registration checks.
- Added an explicitly skipped protocol-flow placeholder for environments that
  lack an isolated database, Valkey, and interactive OAuth identity fixture.
  The manual create/configure/authorize/token/MCP and rotation/disable/revoke
  checks remain documented in `README.md` rather than being represented by a
  synthetic token test.

## Verification

- `bun run lint` — failed on pre-existing formatting errors across static OAuth
  implementation/tests and unrelated files; no errors were reported for the
  formatted `e2e/admin-mcp.spec.ts`.
- `bun test` — failed because the repository's Bun test runner lacks the Vitest
  APIs used by the existing suite (`vi.hoisted`, `vi.stubEnv`, and
  `vi.stubGlobal`); 122 tests passed and 5 were skipped before the failures.
- `bun run test:e2e` — not run: it invokes a full production build and requires
  the local browser/database fixture; the fixture-dependent protocol test is
  explicitly skipped when those services are absent.

## Concerns

The full authorization-code-to-MCP flow and credential invalidation flow need a
real isolated PostgreSQL/Valkey environment plus an OAuth callback identity
fixture before they can be automated end-to-end.

## Review follow-up

- Corrected the migration documentation: `OAUTH_REGISTERED_CLIENTS` is not
  imported into static-client rows; legacy DCR clients must be recreated.
- Made the protocol E2E gate require database, Valkey, interactive session, and
  an explicit `TEST_OAUTH_PROTOCOL_FIXTURE=ready` contract. Without all named
  prerequisites the test is skipped with its reason; it no longer passes an
  empty body silently.
- Added a direct E2E assertion that the disabled registration endpoint returns
  `404` and remains absent from discovery.
- Focused Playwright startup reached the application build but was blocked by
  repository-wide pre-existing ESLint/Prettier failures. The initial callback
  type error (`credentialVersion` missing from `StateData`) was corrected; the
  remaining output is formatting debt in existing OAuth implementation/tests.
- Tightened the protocol E2E gate to require explicit isolated
  `TEST_DATABASE_URL` and `TEST_VALKEY_URL`; production `DATABASE_URL` and
  `VALKEY_URL` are never used as fallbacks.
