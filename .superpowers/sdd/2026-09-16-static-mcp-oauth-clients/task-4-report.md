# Task 4 report

Status: implemented with known test-suite follow-up required.

Commit: `b9809c8` (`feat: enforce static MCP OAuth clients`)

## Changes

- Authorization now resolves only persistent static clients, requires enabled/non-revoked state, exact redirect URI equality, and a requested-scope subset.
- Token exchange now requires a current static client and verifies the secret through the static-client verifier for both Basic and body credentials.
- MCP validates the current persistent client state for every bearer request, so disable/revoke takes effect immediately and stale DCR tokens fail closed.
- Authorization-server discovery no longer advertises `registration_endpoint`.
- DCR POST registration is explicitly unavailable (`unauthorized_client`).
- Static-client database access is lazy to avoid loading server-only database code at route module import time.

## Verification

Ran:

```text
bunx vitest run src/app/api/oauth src/app/mcp src/lib
```

Existing tests that still encode the pre-static DCR contract fail (authorize/token/MCP fixtures mock DCR clients rather than static clients; DCR registration tests expect registration to remain available; discovery tests expect `registration_endpoint`). The static-client library tests pass. Typecheck also reports pre-existing unrelated test errors plus legacy DCR test typing errors.

## Concerns

The route tests need to be migrated to mock `oauth-static-client` and seed static client records, and discovery/DCR assertions need to be updated to the new contract. This is intentional behavior change, not a production fallback.

## Review follow-up

Commit: `7fc65ab` (`fix: invalidate static OAuth tokens on rotation`)

- Added `credential_version` to static clients; secret rotation increments it.
- Authorization and refresh/access token records carry the version; token and MCP validation reject stale versions.
- Removed `none` from discovery auth methods.
- Added safe 503 handling around static-client reads and secret verification.
- Replaced the commented DCR implementation with a minimal disabled route.

Verification of the static-client unit suite:

```text
Test Files  1 passed (1)
Tests       14 passed (14)
```

The full requested suite still contains legacy DCR expectations and therefore requires fixture/assertion migration before it can pass; discovery tests likewise still expect `none` and `registration_endpoint`.

## Final follow-up

- Authorization state and callback code records now carry `credentialVersion`; consent preserves it.
- Static schema initialization includes the idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS credential_version` migration.
- Discovery assertions were migrated to require supported secret methods only and no registration endpoint.
- Legacy DCR POST tests are skipped as obsolete and the route now has a clean disabled implementation.

Requested focused command result:

```text
Test Files  5 failed | 30 passed | 2 skipped (37)
Tests       55 failed | 318 passed | 18 skipped (391)
```

Remaining failures are old authorize/token/MCP fixtures that still mock the removed DCR store and do not provide static-client records/version fields. They require full fixture migration before approval.

## Legacy fixture migration follow-up

Static-client adapters were added to authorize, token, and MCP route tests. The focused route subset now reports 3 passing files and 72 passing tests; one token legacy assertion still needs adjustment for its Basic-auth fixture. Full-suite migration remains in progress.

## Final test migration

Changed the wrong-client-secret test to use `Basic client_id:wrong-secret`, migrated allowlist fixtures to include static credentials, and retained strict invalid-client assertions.

Exact command result:

```text
Test Files  35 passed | 2 skipped (37)
Tests       373 passed | 18 skipped (391)
Start       17:55:12
Duration    1.22s
```
