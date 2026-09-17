# MCP Application Allowlist Design

## Goal

Replace the deployment's implicit MCP application access policy with a
PostgreSQL-backed allowlist managed through a Basic Auth-protected admin UI.
The configuration is deployment-wide. An application is identified by its
OAuth `client_id`, and disabling or deleting an application must take effect
for already-issued access tokens on the next MCP request.

## Scope

### In scope

- PostgreSQL persistence using raw, parameterized SQL.
- Initial seeding from `OAUTH_REGISTERED_CLIENTS` when the table is empty.
- CRUD UI at `/admin/mcp`.
- CRUD API under `/api/admin/mcp/applications`.
- Basic Auth using `MCP_ADMIN_USERNAME` and `MCP_ADMIN_PASSWORD`.
- Allowlist checks during token issuance and every `POST /mcp` request.
- Unit, route, and E2E coverage for authorization and admin behavior.

### Out of scope

- Creating or registering OAuth clients from the admin UI.
- Per-tenant or per-user MCP configuration.
- Application credentials or secret management.
- Replacing the existing OAuth or MCP protocol implementation.

## Data Model

Create `mcp_allowed_applications` with:

- `id`: database-generated primary key.
- `client_id`: non-empty OAuth client identifier, unique and indexed.
- `name`: display name.
- `description`: nullable display text.
- `enabled`: boolean, default `true`.
- `created_at` and `updated_at`: database timestamps.

The admin API returns only these fields. It never returns OAuth secrets or
other credentials.

## Configuration Authority and Seeding

On first initialization, when `mcp_allowed_applications` is empty, parse
`OAUTH_REGISTERED_CLIENTS` and insert each registered client as enabled. The
seed operation must be idempotent.

After the table has at least one row, PostgreSQL is the source of truth. Later
changes to `OAUTH_REGISTERED_CLIENTS` must not re-enable or restore applications
that an administrator disabled or deleted.

If PostgreSQL is unavailable, authorization fails closed. The server must not
silently fall back to the environment configuration after initialization.

## Request and Authorization Flow

OAuth token and authorization flows check the requested `client_id` against
the allowlist. Unknown or disabled clients receive the existing OAuth-style
authorization failure and do not receive a new usable token.

Every MCP request also performs a fresh allowlist check using the `client_id`
stored in the access-token payload. This second check is required so that
disabling or deleting an application invalidates its existing tokens
immediately. A missing or disabled client is rejected without invoking MCP
tool execution.

The existing Bearer authentication, token storage, session-cookie forwarding,
and MCP protocol handling remain unchanged after the allowlist decision.

## Admin Routes and Authentication

The admin surface consists of:

- `GET /admin/mcp`: server-rendered or client-enhanced management page.
- `POST /api/admin/mcp/applications`: create an allowlist entry.
- `GET /api/admin/mcp/applications`: list entries.
- `PATCH /api/admin/mcp/applications/:id`: edit metadata or enabled state.
- `DELETE /api/admin/mcp/applications/:id`: remove an entry.

All admin routes require HTTP Basic Auth using environment values:

- `MCP_ADMIN_USERNAME`
- `MCP_ADMIN_PASSWORD`

The password comparison must be constant-time. Missing credentials in
production fail closed. Unauthorized requests return `401` and a
`WWW-Authenticate: Basic` header.

Basic Auth applies only to the admin page and admin API. `/mcp`, OAuth
discovery, and OAuth protocol endpoints continue using their existing public
and Bearer-authenticated behavior.

## SQL and Validation Rules

- Use parameterized SQL for every user-supplied value.
- Keep table and column names static in source code.
- Validate `client_id`, `name`, and `description` with non-empty/length limits
  before querying or writing.
- Use a unique database constraint for `client_id` and map conflicts to HTTP
  `409`.
- Use transactions for multi-query initialization or updates.
- Keep migrations or initialization SQL idempotent.

## Error Behavior

- Unknown or disabled OAuth client: standard OAuth authorization failure.
- Unknown or disabled MCP client: unauthorized/forbidden response consistent
  with the existing MCP Bearer flow.
- PostgreSQL failure during authorization: fail closed.
- Invalid admin payload: `400`.
- Duplicate `client_id`: `409`.
- Missing admin record: `404`.
- Missing or invalid Basic Auth: `401`.

Error responses must not reveal whether a client was previously registered or
contain database details.

## Testing Strategy

Add coverage for:

- Repository CRUD, duplicate handling, validation, and parameterized values.
- Idempotent seed behavior from `OAUTH_REGISTERED_CLIENTS`.
- Token issuance rejection for unknown and disabled clients.
- MCP rejection immediately after an existing client's allowlist entry is
  disabled or deleted.
- Fail-closed behavior when PostgreSQL is unavailable.
- Basic Auth success, missing credentials, and invalid credentials.
- Admin API CRUD and error responses.
- E2E flow: authenticate to `/admin/mcp`, create/disable an application, and
  verify MCP access changes accordingly.

## Operational Notes

The PostgreSQL connection configuration must be provided by deployment
environment variables already supported by the service or by the chosen raw
SQL client configuration. No ORM is introduced. The deployment must run the
schema initialization/migration before serving admin or authorization traffic.

This design assumes the existing OAuth token payload continues to include
`client_id`. If a token path omits it, that path must be rejected rather than
treated as an allowed legacy client.
