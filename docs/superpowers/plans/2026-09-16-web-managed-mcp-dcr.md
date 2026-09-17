# Web-Managed MCP DCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move MCP DCR eligibility from deployment-only `OAUTH_REGISTERED_CLIENTS` into the authenticated admin UI while allowing OpenCode and similar clients to complete DCR without manual client-ID approval.

**Architecture:** PostgreSQL stores enabled DCR policies keyed by redirect URI and generated-client associations. The DCR route matches an enabled policy, creates the OAuth client in the existing OAuth store, and records the association; authorization, token, and MCP checks require the associated policy to remain enabled. Existing environment registrations are imported idempotently for migration compatibility.

**Tech Stack:** Next.js 15 App Router, TypeScript, PostgreSQL via `pg`, Valkey-backed OAuth client storage, React admin UI, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-web-managed-mcp-dcr-design.md`

## Global Constraints

- Admin endpoints remain protected by `MCP_ADMIN_USERNAME` and `MCP_ADMIN_PASSWORD`.
- PostgreSQL failures fail closed; they must never grant MCP access.
- Loopback HTTP redirect matching ignores the port but requires matching scheme, hostname, path, and query.
- Non-loopback redirect URIs require an exact match.
- `OAUTH_REGISTERED_CLIENTS` is migration seed data only and must not re-enable a disabled policy.
- DCR-generated client IDs are not entered manually in the admin UI.

---

### Task 1: Add a persistent DCR policy repository

**Files:**
- Modify: `src/lib/mcp-allowlist.ts`
- Modify: `src/lib/mcp-allowlist.test.ts`
- Modify: `src/lib/mcp-allowlist.integration.test.ts`
- Modify: `src/lib/postgres.ts` only if transaction/query helpers are required

**Interfaces:**
- Produce `DcrPolicy` with `id`, `name`, `redirectUri`, `description`, `enabled`, timestamps, and associated generated client IDs.
- Produce repository functions for list/create/update/delete policies and lookup of an enabled policy by redirect URI.
- Produce an association function that records a generated client ID against a policy.

- [ ] Write failing repository tests for schema creation, CRUD, loopback matching, exact non-loopback matching, duplicate redirect URI rejection, and policy/client association.
- [ ] Run `bunx vitest run src/lib/mcp-allowlist.test.ts` and confirm the new tests fail.
- [ ] Add the PostgreSQL schema and SQL operations. Keep initialization idempotent and preserve existing allowlist data during rollout.
- [ ] Add an idempotent seed path from parsed `OAUTH_REGISTERED_CLIENTS`; seed rows must not overwrite an existing disabled row.
- [ ] Run the focused unit and integration tests with `TEST_DATABASE_URL` when available.
- [ ] Commit with `feat: persist MCP DCR policies`.

### Task 2: Change the admin API contract from client IDs to DCR policies

**Files:**
- Modify: `src/app/api/admin/mcp/applications/route.ts`
- Modify: `src/app/api/admin/mcp/applications/[id]/route.ts`
- Modify: corresponding route test files
- Modify: `src/app/api/admin/mcp/applications/admin-api.ts`

**Interfaces:**
- `POST` accepts `{ name, redirectUri, description? }`.
- `PATCH` accepts partial `{ name?, redirectUri?, description?, enabled? }`.
- Responses expose policy data and associated-client summary; they do not require a client ID for creation.

- [ ] Update route tests for authenticated list/create/update/delete and unauthenticated rejection.
- [ ] Add tests proving a policy can be created before any generated OAuth client exists.
- [ ] Implement validation and map duplicate/invalid input to stable 4xx responses.
- [ ] Ensure deleting or disabling a policy revokes its associated generated clients at authorization/token/MCP decision time.
- [ ] Run `bunx vitest run src/app/api/admin/mcp/applications`.
- [ ] Commit with `feat: expose web-managed MCP DCR policies`.

### Task 3: Update the admin UI for redirect policies

**Files:**
- Modify: `src/app/admin/mcp/page.client.tsx`
- Modify: `src/app/admin/mcp/page.helpers.ts`
- Modify: `src/app/admin/mcp/page.test.tsx`

**Interfaces:**
- The create/edit form contains `name`, `redirectUri`, and optional `description`.
- The table displays redirect URI and enabled status; client ID is informational only when an association exists.

- [ ] Update component tests to submit a policy without a client ID.
- [ ] Add UI tests for create, edit, enable/disable, delete confirmation, and validation errors.
- [ ] Replace the client-ID form field and copy with redirect-policy guidance, including the OpenCode loopback example.
- [ ] Keep Basic Auth browser behavior unchanged.
- [ ] Run `bunx vitest run src/app/admin/mcp/page.test.tsx`.
- [ ] Commit with `feat: manage MCP DCR policies in admin UI`.

### Task 4: Integrate DCR with the policy registry and access checks

**Files:**
- Modify: `src/app/api/oauth/register/route.ts`
- Modify: `src/lib/oauth-dcr-store.ts`
- Modify: `src/app/api/oauth/authorize/route.ts`
- Modify: `src/app/api/oauth/token/route.ts`
- Modify: `src/app/mcp/route.ts`
- Modify: related OAuth/MCP tests

**Interfaces:**
- DCR resolves an enabled policy by requested redirect URI before generating a client.
- `registerClient` persists the policy ID/association with the generated client record.
- A shared `isGeneratedClientAllowed(clientId)` decision checks the policy state for authorize, token, and MCP requests.

- [ ] Add failing tests for successful DCR with a UI-created policy and 401 when no policy matches.
- [ ] Add tests proving a generated client can authorize immediately after DCR.
- [ ] Add tests proving disable/delete blocks authorization, token exchange, and MCP access.
- [ ] Implement policy lookup and client association without logging secrets or authorization headers.
- [ ] Preserve existing RFC 7591 response fields and current OAuth storage behavior.
- [ ] Run OAuth and MCP focused tests with `bunx vitest run src/app/api/oauth src/app/mcp src/lib`.
- [ ] Commit with `feat: authorize MCP clients from DCR policies`.

### Task 5: Migration, documentation, and end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `e2e/admin-mcp.spec.ts`
- Modify: `e2e/oauth-mcp.spec.ts`
- Modify: `.env` only if local example configuration is maintained there; never commit secrets

- [ ] Add an E2E scenario that creates an OpenCode-style loopback policy, registers a DCR client, and verifies immediate authorization.
- [ ] Add an E2E scenario that disables the policy and verifies MCP access is rejected.
- [ ] Document that `OAUTH_REGISTERED_CLIENTS` is only a migration seed and that new registrations are managed at `/admin/mcp`.
- [ ] Document required PostgreSQL/admin environment variables and the redirect URI example.
- [ ] Remove the temporary DCR request debug log from `src/app/api/oauth/register/route.ts`, or replace it with sanitized opt-in diagnostics before release.
- [ ] Run `bun run lint`, `bun test`, and `bun run test:e2e`.
- [ ] Commit with `docs: document web-managed MCP DCR`.

## Verification checklist

- `bun run lint`
- `bun test`
- `bun run test:e2e`
- Manual: create `OpenCode` with `http://127.0.0.1:19876/callback` in `/admin/mcp`.
- Manual: run `opencode mcp auth searchpoint`; DCR must not return 401.
- Manual: disable the policy; subsequent MCP requests must fail closed.
