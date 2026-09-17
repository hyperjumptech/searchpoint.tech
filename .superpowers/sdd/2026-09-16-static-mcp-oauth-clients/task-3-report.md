# Task 3 report

Status: implemented

Commit: `cf27a07 feat: manage static MCP OAuth clients in admin UI`

## Changes

- Replaced DCR policy/application management with static OAuth client management using `/api/admin/mcp/clients`.
- Added name, single redirect URI, allowlisted `search` scope selection, enabled state, edit, rotate, revoke, and confirmation warnings.
- Client secrets are only rendered from create/rotate responses in a one-time dialog; list data only renders client IDs and metadata.
- Preserved browser-side requests with same-origin credentials so server-side Basic Auth remains authoritative.

## Verification

- `bunx vitest run src/app/admin/mcp/page.test.tsx` — failed because the checked-in test still targets the removed DCR policy UI and old response shape.
- `bunx tsc --noEmit` — failed on pre-existing unrelated test/e2e type errors, plus an existing e2e fixture mismatch.

## Concerns

- The existing `page.test.tsx` needs migration to the static-client API and rendered interactions (create/secret dialog/copy warning/redaction/edit/scopes/toggle/rotate/revoke) in the parent integration pass.
- The UI currently mirrors the server's configured allowlist as `search`; if additional scopes are enabled through `OAUTH_SCOPES`, the UI should receive that allowlist from a dedicated metadata endpoint.

## Review follow-up

- Updated `page.test.tsx` to use the static OAuth client contract and added rendered coverage for create/one-time secret display and redaction, edit, scope controls, enable/disable, rotate confirmation, and revoke confirmation.
- `GET /api/admin/mcp/clients` now returns `allowedScopes`, derived from `OAUTH_SCOPES`, alongside redacted client metadata. The UI uses it for scope options and defaults to `search` when available.

Exact focused test output:

```text
✓ src/app/api/admin/mcp/clients/route.test.ts (8 tests) 11ms
✓ src/app/admin/mcp/page.test.tsx (3 tests) 685ms
Test Files  2 passed (2)
Tests       11 passed (11)
Duration    1.63s
```

## Final review follow-up

- Added rendered assertions for clipboard copy, disable/re-enable, actual rotate and revoke requests, and one-time rotated secret display.
- Populated-client rendering now verifies a secret-like field is never displayed.
- Scope coverage selects the server-provided `files` scope and verifies it is submitted.
- Empty or whitespace `OAUTH_SCOPES` now safely yields `search`; configured scopes are preserved and `search` is always available as a default. Backend validation remains authoritative.

Final focused command: `bunx vitest run src/app/admin/mcp/page.test.tsx src/app/api/admin/mcp/clients/route.test.ts`

```text
Test Files  2 passed (2)
Tests       11 passed (11)
Duration    1.50s
```
