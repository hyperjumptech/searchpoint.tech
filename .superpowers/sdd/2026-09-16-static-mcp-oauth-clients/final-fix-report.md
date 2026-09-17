# Final whole-branch review fix report

## Changes

- Authorize, token, and MCP access now use the enabled/revoked state in
  `mcp_static_oauth_clients` directly; legacy allowlist and DCR rows cannot
  grant access in static-client mode.
- Omitted authorize scope defaults to `search`, and `search` remains valid as
  the documented default even when `OAUTH_SCOPES` is customized.
- Removed Playwright production URL and legacy registered-client fallbacks.
- Removed unnecessary invalid-client logging.
- Retained SHA-256 hashing because it is the project's existing secret-hash
  convention; generated secrets are high entropy and verification remains
  one-time-safe via constant-time comparison.
- Migrated focused route tests away from obsolete allowlist expectations and
  added omitted-scope regression coverage.

## Verification

`bunx vitest run src/app/api/oauth/authorize/route.test.ts src/app/api/oauth/token/route.test.ts src/app/mcp/route.test.ts src/lib/oauth-static-client.test.ts`

Result: **4 files passed, 66 tests passed**.

`git diff --check` passed.

## Concerns

The legacy allowlist/DCR storage helpers remain for migration/schema compatibility,
but no authorize, token, or MCP runtime path calls them.
