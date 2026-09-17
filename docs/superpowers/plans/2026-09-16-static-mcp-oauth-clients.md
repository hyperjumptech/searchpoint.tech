# Static MCP OAuth Clients Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace normal MCP DCR onboarding with administrator-created OAuth clients using generated client IDs, one-time secrets, scopes, and one redirect URI.

**Architecture:** PostgreSQL becomes the source of truth for static OAuth clients and hashed secrets. Admin APIs create/rotate/revoke clients, while authorize/token/MCP paths query persistent client state on every access decision; Valkey continues storing short-lived OAuth state/tokens. DCR is removed from discovery and cannot create usable MCP clients.

**Tech Stack:** Next.js 15 App Router, TypeScript, PostgreSQL via `pg`, Valkey, React, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-static-mcp-oauth-clients-design.md`

## Global Constraints

- Each client has exactly one redirect URI.
- Client secrets are shown once, stored only as hashes, and never returned by list/detail APIs.
- Scope values must be a subset of the global configured allowlist; default scope is `search`.
- Disable, revoke, or rotate must invalidate relevant old credentials immediately.
- Database failures fail closed.
- DCR must not create a usable MCP client in static-client mode.
- Existing admin Basic Auth protects all client-management endpoints.

---

### Task 1: Persist static OAuth clients and secret lifecycle

**Files:**
- Create or modify: `src/lib/oauth-static-client.ts`
- Modify: `src/lib/postgres.ts`
- Test: `src/lib/oauth-static-client.test.ts`
- Test: `src/lib/oauth-static-client.integration.test.ts`

**Interfaces:**
- `createStaticClient(input): Promise<{ client, clientSecret }>` generates a unique ID and secret, stores only the secret hash, and returns the plaintext secret once.
- `getStaticClient(clientId): Promise<StaticClient | null>` returns metadata without a secret.
- `verifyStaticClientSecret(clientId, secret): Promise<boolean>` uses constant-time hash verification and checks enabled/revoked state.
- `rotateStaticClientSecret(clientId): Promise<{ clientSecret }>` replaces the hash and returns the new secret once.
- `updateStaticClient`, `listStaticClients`, and `revokeStaticClient` preserve revoked rows.

- [ ] Write failing unit tests for ID/secret generation, one-time response shape, hash-only persistence, exact redirect URI, scope validation, duplicate IDs, rotation invalidation, disable/revoke, and DB failure.
- [ ] Add idempotent PostgreSQL schema creation for static client records, including unique client ID and one redirect URI.
- [ ] Implement hash verification and secret rotation with the existing crypto conventions.
- [ ] Run `bunx vitest run src/lib/oauth-static-client.test.ts`.
- [ ] Add integration coverage gated by `TEST_DATABASE_URL`, then run it when configured.
- [ ] Commit with `feat: persist static MCP OAuth clients`.

### Task 2: Add authenticated admin client-management API

**Files:**
- Create: `src/app/api/admin/mcp/clients/route.ts`
- Create: `src/app/api/admin/mcp/clients/[id]/route.ts`
- Create: `src/app/api/admin/mcp/clients/[id]/rotate-secret/route.ts`
- Modify: `src/app/api/admin/mcp/applications/admin-api.ts` or shared admin helpers
- Tests: matching route test files

**Interfaces:**
- `POST /api/admin/mcp/clients` accepts `{ name, scopes?, redirectUri }` and returns metadata plus `clientSecret` exactly once.
- `GET /api/admin/mcp/clients` returns metadata only.
- `PATCH /api/admin/mcp/clients/:id` accepts `{ name?, scopes?, redirectUri?, enabled? }`.
- `POST /api/admin/mcp/clients/:id/rotate-secret` returns the new secret exactly once.
- `DELETE /api/admin/mcp/clients/:id` marks the row revoked without deleting history.

- [ ] Write failing tests for Basic Auth, create response secrecy, list/detail redaction, validation, patch, rotate, revoke, and stable 4xx/5xx errors.
- [ ] Implement routes using the existing admin authentication response and repository interfaces.
- [ ] Ensure update cannot add more than one redirect URI and cannot select a scope outside the global allowlist.
- [ ] Run `bunx vitest run src/app/api/admin/mcp/clients`.
- [ ] Commit with `feat: add static MCP OAuth admin API`.

### Task 3: Replace the MCP admin UI with static OAuth client management

**Files:**
- Modify: `src/app/admin/mcp/page.tsx`
- Modify: `src/app/admin/mcp/page.client.tsx`
- Modify: `src/app/admin/mcp/page.helpers.ts`
- Modify: `src/app/admin/mcp/page.test.tsx`

- [ ] Add rendered/UI tests for create, one-time secret display, copy/save warning, list redaction, edit, scope selection, enable/disable, rotate, and revoke confirmation.
- [ ] Replace DCR policy/client-ID wording with OAuth client wording and show one redirect URI field.
- [ ] Add default `search` scope and prevent selecting scopes outside the server allowlist.
- [ ] Display the generated secret only in a post-create/rotate dialog; never hydrate it from list responses.
- [ ] Add rotate and revoke actions with clear warnings about immediate invalidation.
- [ ] Run `bunx vitest run src/app/admin/mcp/page.test.tsx`.
- [ ] Commit with `feat: manage static MCP OAuth clients in admin UI`.

### Task 4: Enforce static client credentials in OAuth and MCP

**Files:**
- Modify: `src/app/api/oauth/authorize/route.ts`
- Modify: `src/app/api/oauth/token/route.ts`
- Modify: `src/app/mcp/route.ts`
- Modify: `src/app/api/oauth/discovery` or metadata route(s)
- Modify: `src/app/api/oauth/register/route.ts` and related DCR code
- Tests: OAuth, MCP, discovery, and DCR route tests

- [ ] Write failing tests for enabled static-client authorization/token/MCP success, invalid secret, redirect mismatch, scope escalation, disabled/revoked client, rotated secret, and old access token rejection.
- [ ] Make authorize resolve only static clients and require exact redirect URI and requested-scope subset.
- [ ] Make token validate the client secret using supported OAuth authentication methods without returning secret material.
- [ ] Make MCP access consult current persistent client state so disable/revoke takes effect immediately.
- [ ] Remove `registration_endpoint` from discovery and make DCR registration unavailable or explicitly non-usable.
- [ ] Ensure old DCR records do not grant access after static-client mode is enabled.
- [ ] Run `bunx vitest run src/app/api/oauth src/app/mcp src/lib`.
- [ ] Commit with `feat: enforce static MCP OAuth clients`.

### Task 5: Migration, documentation, and end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `e2e/admin-mcp.spec.ts`
- Modify: `e2e/oauth-mcp.spec.ts`
- Modify: OAuth discovery documentation/tests

- [ ] Document admin-created credentials, one-time secret display, one redirect URI, scopes, rotation, and revoke behavior.
- [ ] Mark `OAUTH_REGISTERED_CLIENTS` deprecated and document its one-time migration behavior or explicit removal.
- [ ] Add E2E coverage for create → configure static client → authorize → token exchange → MCP request.
- [ ] Add E2E coverage for rotation and disable/revoke invalidating old credentials and access tokens.
- [ ] Run `bun run lint`, `bun test`, and `bun run test:e2e`, recording fixture-dependent skips precisely.
- [ ] Remove obsolete DCR UI/API tests and stale documentation after replacement behavior is verified.
- [ ] Commit with `docs: document static MCP OAuth clients`.

## Verification checklist

- `bun run lint`
- `bun test`
- `bun run test:e2e`
- Manual: create a client at `/admin/mcp`, save the one-time secret, configure OpenCode with the returned credentials, and complete OAuth.
- Manual: rotate the secret and verify the old secret fails.
- Manual: disable/revoke the client and verify existing MCP tokens fail.
