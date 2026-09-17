# Web-Managed MCP Dynamic Client Registration

## Context

The current MCP OAuth implementation uses `OAUTH_REGISTERED_CLIENTS` as an
environment-configured registry for Dynamic Client Registration (DCR). This
requires a deployment change whenever a new MCP client, such as OpenCode,
needs to connect. The existing admin page also manages generated client IDs,
which are not known until after DCR has already completed.

## Goal

Allow an administrator to manage DCR eligibility from the web UI without
copying generated client IDs into the admin page. A user should configure only
the remote MCP URL in a compatible client; the client performs DCR, receives a
generated client ID, and proceeds through OAuth automatically.

## User experience

The admin page manages DCR registration policies with these fields:

- **Name**: human-readable label, e.g. `OpenCode`.
- **Redirect URI**: the allowed OAuth callback URI, e.g.
  `http://127.0.0.1:19876/callback`.
- **Enabled**: whether new and existing clients associated with the policy may
  use MCP.
- Optional description for administrative context.

The admin does not enter a client ID, client secret, or registration token.
After an enabled policy exists, a DCR client may register if its requested
redirect URI matches the policy. The generated client ID is internal OAuth
state and is not a required admin input.

For loopback HTTP redirect URIs, matching preserves the current RFC 8252
behavior: scheme, hostname, path, and query must match while the port may be
ephemeral. Non-loopback redirect URIs require an exact match.

## Architecture

PostgreSQL becomes the runtime source of truth for DCR policies. The current
environment registry remains supported only as a backward-compatible initial
seed during migration, if enabled by the implementation plan; it is not
required for adding new clients through the UI.

The data model must distinguish:

1. A **DCR policy**, identified by its configured redirect URI and enabled
   status.
2. A **generated OAuth client**, identified by the client ID returned by DCR.

When DCR receives a registration request:

1. Validate the OAuth client metadata.
2. Find an enabled DCR policy whose redirect URI matches the requested URI.
3. Generate and persist the OAuth client as today.
4. Associate the generated client with the matched policy.
5. Return the normal RFC 7591 registration response.

When `/authorize`, `/token`, or `/mcp` handles the generated client, access is
allowed only if its associated policy still exists and is enabled. Disabling
or deleting a policy therefore revokes MCP access for all generated clients
associated with it without requiring the administrator to find individual
client IDs.

## Security and compatibility

Redirect URI policy is the authorization boundary. Because no registration
token is required, anyone who can submit a matching redirect URI can attempt
DCR. This is intentional for generic clients such as OpenCode, but the UI
must make the enabled state explicit and the server must fail closed when the
database is unavailable.

Existing OAuth client credentials and token storage remain unchanged unless
needed to persist the policy association. Existing statically configured
clients must continue working during migration. Existing generated clients
must not become inaccessible solely because the environment seed is removed;
their policy association must be preserved in PostgreSQL.

## API and UI behavior

The admin API exposes CRUD operations for DCR policies, including enable,
disable, update, and delete. The create and update payloads contain `name`,
`redirectUri`, and optional `description`; `clientId` is not required.

The admin page lists policy name, redirect URI, enabled status, timestamps,
and the number or summary of associated generated clients where available.
It provides add, edit, enable/disable, and delete actions. Deletion must show
a confirmation because it revokes associated MCP access.

DCR failures remain standards-compatible:

- No matching enabled policy: `401 unauthorized`.
- Malformed client metadata: `400 invalid_request` or the existing specific
  DCR error.
- Duplicate or invalid persisted state: the existing safe error mapping.

## Migration and rollout

On first initialization, existing `OAUTH_REGISTERED_CLIENTS` entries may be
seeded as enabled DCR policies. The seed must be idempotent and must not
re-enable a policy that an administrator later disables. After migration,
new policies are created only through the admin UI/database.

The deployment still requires PostgreSQL and admin Basic Auth credentials.
The environment registry can be removed only after existing deployments have
been seeded and verified.

## Testing

Tests must cover:

- Creating, editing, enabling, disabling, and deleting DCR policies.
- Exact redirect matching and loopback port variation.
- DCR success when a matching policy exists.
- DCR rejection when no enabled policy exists.
- Automatic association of generated client IDs with policies.
- Authorization, token, and MCP rejection after policy disable/delete.
- Idempotent environment seeding without re-enabling disabled policies.
- Existing static and previously generated clients during migration.
- Admin authentication and protection of policy endpoints.
