# MCP Application Allowlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PostgreSQL-backed, deployment-wide MCP client allowlist with a Basic Auth-protected CRUD UI at `/admin/mcp`.

**Architecture:** Use a small raw SQL repository backed by `pg`, with one database table for allowed OAuth client IDs. Seed the table once from `OAUTH_REGISTERED_CLIENTS`; after the table is populated, PostgreSQL is authoritative. Check the allowlist during token issuance and again on every `/mcp` request so disabling a client immediately invalidates existing tokens.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, PostgreSQL via `pg`, Zod, Vitest, Playwright, existing Tailwind/Radix UI components.

**Spec:** `docs/superpowers/specs/2026-09-15-mcp-application-allowlist-design.md`

## Global Constraints

- Use raw SQL only; do not add an ORM.
- Every user-supplied SQL value must use parameterized queries.
- Keep table and column names static in source code.
- PostgreSQL is the source of truth after initial seeding; do not silently fall back to env configuration.
- Unknown or disabled clients must fail closed during authorization and MCP requests.
- Basic Auth applies only to `/admin/mcp` and `/api/admin/mcp/*`.
- Do not expose OAuth secrets or database details in admin responses or error responses.
- Existing OAuth, Bearer authentication, session-cookie forwarding, and MCP protocol behavior must remain unchanged after the allowlist decision.

## File Map

**Create:**

- `src/lib/postgres.ts`: one lazily connected PostgreSQL pool and test injection/reset seam.
- `src/lib/mcp-allowlist.ts`: SQL schema initialization, env seeding, CRUD, and authorization queries.
- `src/lib/mcp-allowlist.test.ts`: repository and seed tests using a mocked pool/query boundary.
- `src/lib/admin-basic-auth.ts`: Basic Auth parsing, constant-time credential comparison, and response helper.
- `src/lib/admin-basic-auth.test.ts`: auth parsing and response tests.
- `src/app/api/admin/mcp/applications/route.ts`: list/create admin handlers.
- `src/app/api/admin/mcp/applications/[id]/route.ts`: update/delete admin handlers.
- `src/app/api/admin/mcp/applications/route.test.ts`: list/create route tests.
- `src/app/api/admin/mcp/applications/[id]/route.test.ts`: update/delete route tests.
- `src/app/admin/mcp/page.tsx`: admin page server entrypoint.
- `src/app/admin/mcp/page.client.tsx`: client CRUD UI and request state.
- `src/app/admin/mcp/page.test.tsx`: focused UI behavior tests if the project test setup supports component rendering; otherwise cover behavior through Playwright.
- `src/lib/mcp-allowlist.integration.test.ts`: PostgreSQL-backed repository tests when a test database is available, gated by an explicit test database URL.
- `src/app/api/oauth/allowlist.test.ts`: shared authorization behavior tests if a dedicated helper is extracted.

**Modify:**

- `package.json` and lockfile: add `pg` and its TypeScript types.
- `src/lib/env.ts`: parse `DATABASE_URL`, `MCP_ADMIN_USERNAME`, and `MCP_ADMIN_PASSWORD` without exposing them to client code.
- `.env.example`: document the new server-only variables and the migration/seed behavior.
- `src/middleware.ts`: protect `/admin/mcp` and `/api/admin/mcp` with Basic Auth while preserving existing public/OAuth exceptions.
- `src/app/api/oauth/token/route.ts`: check the resolved OAuth client ID before issuing access or refresh tokens.
- `src/app/mcp/route.ts`: check the access-token `client_id` before calling MCP protocol handling.
- `src/app/api/oauth/register/route.ts` or the DCR flow helper, only if tests show that registration must enforce the allowlist before a generated client ID exists; do not make DCR-generated IDs implicitly allowed.

---

### Task 1: Add PostgreSQL Configuration and Pool Boundary

**Files:**
- Modify: `package.json`
- Modify: `src/lib/env.ts`
- Modify: `.env.example`
- Create: `src/lib/postgres.ts`
- Test: `src/lib/postgres.test.ts`

**Interfaces:**
- Produces `getPostgresPool(): Pool` for server-side repository code.
- Produces `closePostgresPool(): Promise<void>` for tests/shutdown.
- Uses `env.DATABASE_URL`; if it is missing, repository authorization must surface a database failure rather than fall back to env allowlisting.

- [ ] **Step 1: Add the failing configuration tests**

Test that `DATABASE_URL`, `MCP_ADMIN_USERNAME`, and `MCP_ADMIN_PASSWORD` are parsed as optional server-only values, while preserving existing env defaults. Test that a pool uses the configured connection string and is reused.

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `bunx vitest run src/lib/postgres.test.ts src/lib/env.test.ts`

Expected: FAIL because the new env fields and pool boundary do not exist.

- [ ] **Step 3: Add `pg` and implement the pool boundary**

Add `pg` and `@types/pg` using the repository's package manager. Implement a lazy singleton pool. Do not connect during module import. If `DATABASE_URL` is missing, throw a typed configuration error when the pool is requested.

- [ ] **Step 4: Run the focused tests to verify success**

Run: `bunx vitest run src/lib/postgres.test.ts src/lib/env.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the dependency/configuration boundary**

```bash
git add package.json bun.lock src/lib/env.ts .env.example src/lib/postgres.ts src/lib/postgres.test.ts
git commit -m "feat: add postgres configuration boundary"
```

### Task 2: Implement the Allowlist Repository and Initial Seed

**Files:**
- Create: `src/lib/mcp-allowlist.ts`
- Create: `src/lib/mcp-allowlist.test.ts`
- Modify: `src/lib/oauth-dcr.ts` only if a small exported parser adapter is needed for seed data.

**Interfaces:**

```ts
export type AllowedApplication = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AllowedApplicationInput = {
  clientId: string;
  name: string;
  description?: string | null;
};

export async function ensureMcpAllowlist(): Promise<void>;
export async function listAllowedApplications(): Promise<AllowedApplication[]>;
export async function createAllowedApplication(input: AllowedApplicationInput): Promise<AllowedApplication>;
export async function updateAllowedApplication(id: string, input: Partial<AllowedApplicationInput> & { enabled?: boolean }): Promise<AllowedApplication | null>;
export async function deleteAllowedApplication(id: string): Promise<boolean>;
export async function isMcpClientAllowed(clientId: string): Promise<boolean>;
```

- [ ] **Step 1: Write repository tests for schema and CRUD**

Mock the pool query boundary and assert exact SQL parameters. Cover table creation, list mapping, create, update, delete, enabled/disabled lookup, empty/too-long validation, duplicate constraint mapping, and missing records.

- [ ] **Step 2: Write seed tests**

Cover an empty table seeding from parsed `OAUTH_REGISTERED_CLIENTS`, idempotent reruns, and the rule that a non-empty table does not import later env changes. Use the stable identifier available from each env registration entry for the seed row and document that generated DCR IDs require explicit admin allowlisting.

- [ ] **Step 3: Run tests to verify failure**

Run: `bunx vitest run src/lib/mcp-allowlist.test.ts`

Expected: FAIL because the repository functions do not exist.

- [ ] **Step 4: Implement static SQL and mapping**

Create `mcp_allowed_applications` with a database-generated ID, unique/indexed `client_id`, bounded text columns, `enabled`, and timestamps. Use `CREATE TABLE IF NOT EXISTS`. Use `$1`, `$2`, etc. for every value. Use a transaction for initialization and seed. Map PostgreSQL unique violations to a repository error that route handlers can return as `409`.

- [ ] **Step 5: Implement seed and authorization semantics**

Make `ensureMcpAllowlist()` initialize the table and seed only when it has zero rows. Make `isMcpClientAllowed()` query PostgreSQL on every call and return `false` for missing/disabled rows. Propagate database failures instead of returning `true` or consulting env directly.

- [ ] **Step 6: Run tests to verify success**

Run: `bunx vitest run src/lib/mcp-allowlist.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the repository**

```bash
git add src/lib/mcp-allowlist.ts src/lib/mcp-allowlist.test.ts src/lib/oauth-dcr.ts
git commit -m "feat: add postgres MCP allowlist repository"
```

### Task 3: Add Constant-Time Basic Auth and Middleware Protection

**Files:**
- Create: `src/lib/admin-basic-auth.ts`
- Create: `src/lib/admin-basic-auth.test.ts`
- Modify: `src/middleware.ts`
- Modify: `src/middleware.test.ts`

**Interfaces:**

```ts
export function isAdminBasicAuthValid(request: Request): boolean;
export function unauthorizedBasicAuthResponse(): Response;
```

- [ ] **Step 1: Write Basic Auth tests**

Cover missing header, malformed base64, wrong username, wrong password, correct credentials, and the `401` response with `WWW-Authenticate: Basic`. Use a constant-time comparison implementation for equal-length buffers and normalize length differences without leaking credentials.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `bunx vitest run src/lib/admin-basic-auth.test.ts src/middleware.test.ts`

Expected: FAIL for the new admin cases.

- [ ] **Step 3: Implement the helper and middleware branches**

Protect `/admin/mcp` and `/api/admin/mcp` before the existing application session redirect logic. Keep `/mcp`, `/.well-known/*`, and `/api/oauth/*` behavior unchanged. Missing admin env values must reject access in production and must not be sent to client bundles.

- [ ] **Step 4: Run focused tests to verify success**

Run: `bunx vitest run src/lib/admin-basic-auth.test.ts src/middleware.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit Basic Auth protection**

```bash
git add src/lib/admin-basic-auth.ts src/lib/admin-basic-auth.test.ts src/middleware.ts src/middleware.test.ts
git commit -m "feat: protect MCP admin routes with basic auth"
```

### Task 4: Add Admin CRUD API

**Files:**
- Create: `src/app/api/admin/mcp/applications/route.ts`
- Create: `src/app/api/admin/mcp/applications/[id]/route.ts`
- Create: `src/app/api/admin/mcp/applications/route.test.ts`
- Create: `src/app/api/admin/mcp/applications/[id]/route.test.ts`

**Interfaces:**

- `GET /api/admin/mcp/applications` returns `{ applications: AllowedApplication[] }`.
- `POST /api/admin/mcp/applications` accepts `{ clientId, name, description? }` and returns `201` with one safe application record.
- `PATCH /api/admin/mcp/applications/:id` accepts any non-empty subset of `{ clientId, name, description, enabled }` and returns the updated safe record.
- `DELETE /api/admin/mcp/applications/:id` returns `204` when deleted.

- [ ] **Step 1: Write route tests**

Mock Basic Auth and repository functions. Cover unauthorized requests, list, valid create, invalid JSON, invalid fields, duplicate `clientId`, valid update, missing update, valid delete, and missing delete. Assert that responses contain no secrets or raw database errors.

- [ ] **Step 2: Run route tests to verify failure**

Run: `bunx vitest run src/app/api/admin/mcp/applications/route.test.ts 'src/app/api/admin/mcp/applications/[id]/route.test.ts'`

Expected: FAIL because the route handlers do not exist.

- [ ] **Step 3: Implement route authentication, Zod validation, and error mapping**

Call the Basic Auth helper at the start of every handler. Parse JSON safely. Validate client IDs and display fields with explicit length limits. Map duplicate errors to `409`, missing records to `404`, validation to `400`, and repository failures to a generic `503` without details.

- [ ] **Step 4: Run route tests to verify success**

Run: `bunx vitest run src/app/api/admin/mcp/applications/route.test.ts 'src/app/api/admin/mcp/applications/[id]/route.test.ts'`

Expected: PASS.

- [ ] **Step 5: Commit the admin API**

```bash
git add src/app/api/admin/mcp/applications
git commit -m "feat: add MCP allowlist admin API"
```

### Task 5: Enforce Allowlist in OAuth and MCP Requests

**Files:**
- Modify: `src/app/api/oauth/token/route.ts`
- Modify: `src/app/mcp/route.ts`
- Create or modify: `src/app/api/oauth/allowlist.test.ts`
- Modify: `src/app/mcp/route.test.ts`

**Interfaces:**

- Both flows call `isMcpClientAllowed(clientId: string): Promise<boolean>` after the client identity is resolved and before issuing/using a token.
- A missing `client_id` is rejected; it is never treated as a legacy allowed client.

- [ ] **Step 1: Add failing OAuth and MCP tests**

Cover token issuance rejection for unregistered and disabled clients, token issuance for enabled clients, MCP rejection for a valid token whose client is now disabled, and database failure returning a fail-closed response. Preserve existing invalid-client and Bearer challenge shapes where applicable.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `bunx vitest run src/app/api/oauth/allowlist.test.ts src/app/mcp/route.test.ts`

Expected: FAIL because the routes do not perform allowlist checks.

- [ ] **Step 3: Add authorization checks**

In the token route, check the final resolved `client_id` before creating access or refresh tokens, including both authorization-code and refresh-token grants. In `/mcp`, check the `client_id` from the access-token payload after token validity checks and before parsing/executing MCP tools. Call `ensureMcpAllowlist()` through the repository boundary before authorization traffic; do not use stale in-memory authorization state.

- [ ] **Step 4: Run focused tests to verify success**

Run: `bunx vitest run src/app/api/oauth/allowlist.test.ts src/app/mcp/route.test.ts src/lib/mcp-protocol.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit authorization enforcement**

```bash
git add src/app/api/oauth/token/route.ts src/app/mcp/route.ts src/app/api/oauth/allowlist.test.ts src/app/mcp/route.test.ts
git commit -m "feat: enforce MCP application allowlist"
```

### Task 6: Build the `/admin/mcp` Management UI

**Files:**
- Create: `src/app/admin/mcp/page.tsx`
- Create: `src/app/admin/mcp/page.client.tsx`
- Create or modify: `src/app/admin/mcp/page.test.tsx`

**Interfaces:**

- The server page renders the client page and performs no database access in the browser bundle.
- The client page consumes the admin API and supports list, create, edit, enable/disable, and delete.

- [ ] **Step 1: Write UI behavior tests or Playwright coverage**

Cover rendering the application list, empty state, create form, edit form, enable/disable action, delete confirmation, loading state, and API error display. Ensure `client_id` is visible but no secret field is rendered.

- [ ] **Step 2: Run UI tests to verify failure**

Run: `bunx vitest run src/app/admin/mcp/page.test.tsx` or, if component tests are not configured, run the targeted Playwright test and verify it fails because the route does not exist.

- [ ] **Step 3: Implement the minimal admin UI**

Use existing UI primitives and project styling. Add a table/list with name, client ID, status, description, timestamps, and actions. Use a form for create/edit and explicit confirmation before delete. Keep fetch calls same-origin so browser Basic Auth credentials are handled by the browser session.

- [ ] **Step 4: Run UI tests to verify success**

Run: `bunx vitest run src/app/admin/mcp/page.test.tsx` and/or `bun run test:e2e -- admin-mcp.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the management UI**

```bash
git add src/app/admin/mcp
git commit -m "feat: add MCP allowlist admin UI"
```

### Task 7: Add Deployment Documentation and End-to-End Verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md` or `TECHNICAL_DOCUMENTATION.md`
- Create: `e2e/admin-mcp.spec.ts`
- Create: `src/lib/mcp-allowlist.integration.test.ts`

**Interfaces:**

- Deployment supplies `DATABASE_URL`, `MCP_ADMIN_USERNAME`, and `MCP_ADMIN_PASSWORD`.
- PostgreSQL schema initialization runs before admin and authorization traffic.

- [ ] **Step 1: Document deployment requirements**

Document PostgreSQL connectivity, required Basic Auth variables, first-start env seeding, fail-closed behavior, and the fact that generated DCR client IDs must be explicitly added to the allowlist. Do not add a Docker volume requirement; PostgreSQL is external and persistent.

- [ ] **Step 2: Add the E2E flow**

Exercise `/admin/mcp` with Basic Auth, create an allowed client, edit metadata, disable it, delete it, and verify the corresponding API statuses. Include MCP verification using a fixture token/client setup that can observe immediate denial after disable.

- [ ] **Step 3: Add optional PostgreSQL integration coverage**

When `TEST_DATABASE_URL` is set, run schema and CRUD tests against an isolated test schema/database. When it is not set, skip the integration suite explicitly rather than silently using production configuration.

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
bun run lint
bun run test
bun run build
bun run test:e2e -- admin-mcp.spec.ts
```

Expected: all configured checks pass; the integration suite is skipped only when `TEST_DATABASE_URL` is absent.

- [ ] **Step 5: Commit deployment documentation and E2E coverage**

```bash
git add .env.example README.md TECHNICAL_DOCUMENTATION.md e2e/admin-mcp.spec.ts src/lib/mcp-allowlist.integration.test.ts
git commit -m "test: verify MCP allowlist administration"
```

## Plan Self-Review

- Spec coverage: persistence, seed authority, raw SQL safety, Basic Auth, admin CRUD, token issuance checks, per-request MCP checks, fail-closed behavior, safe errors, and unit/route/E2E testing are covered by Tasks 1-7.
- Placeholder scan: no implementation step depends on unspecified future work; the DCR note explicitly defines the stable env identifier and explicit admin approval for generated IDs.
- Type consistency: repository types and function signatures are defined in Task 2 and reused by Tasks 4-6.
- Deployment consistency: the repository has no Docker Compose file, and PostgreSQL is external, so no volume mount is added; deployment documentation specifies the required connection environment instead.
