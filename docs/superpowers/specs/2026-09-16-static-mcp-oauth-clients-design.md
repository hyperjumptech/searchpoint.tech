# Static MCP OAuth Client Credentials

## Context

The current MCP OAuth flow supports Dynamic Client Registration (DCR). A
generic client can register itself using a redirect URI, which creates a
client ID at runtime. This makes client admission dependent on redirect-URI
policy and allows clients to appear outside an explicit administrator-created
credential record.

The product decision is to replace DCR as the normal onboarding flow with
administrator-created OAuth clients that have explicit credentials.

## Goal

Allow an administrator to create and manage MCP OAuth clients from the web
UI. Each client has a generated client ID, a generated client secret, an
administrator-selected scope subset, and exactly one redirect URI. A client
can use MCP only while its record is enabled and its credentials and redirect
URI are valid.

## User experience

The admin UI creates a client with:

- **Name**: human-readable application name.
- **Scope**: one or more scopes selected from the global allowed-scope list;
  the default is `search`.
- **Redirect URI**: exactly one OAuth callback URI.
- **Enabled**: whether the client may authenticate and use MCP.

The server generates the `client_id` and `client_secret`. The secret is shown
once after creation and is never returned by later list/detail APIs. The admin
can rotate the secret, which immediately invalidates the previous secret, and
can disable or revoke the client. Revoked records remain as historical rows
so old credentials cannot be recreated accidentally.

## OAuth behavior

The authorization endpoint accepts only explicitly registered, enabled
clients. It validates:

1. The client ID exists and is enabled.
2. The requested redirect URI exactly equals the stored URI.
3. The requested scopes are a subset of the client scopes and the global
   allowed scopes.

The token endpoint validates the client secret using a constant-time hash
verification strategy. It accepts the supported OAuth client authentication
methods already used by the server, without exposing the secret in responses.
The resulting access token is usable by MCP only while the client remains
enabled and non-revoked.

Disable, revoke, or secret rotation must invalidate the relevant old
credentials immediately. Existing access tokens must be rejected for MCP
after client disable/revoke, rather than relying only on token expiry.

The normal onboarding flow does not use `POST /api/oauth/register`. DCR is
removed from discovery and client registration behavior, or retained only as
an explicitly disabled/deprecated compatibility endpoint that cannot create a
usable MCP client.

## Data model and storage

PostgreSQL is the source of truth for static OAuth clients. A client record
contains:

- generated unique `client_id`;
- one-way `client_secret_hash`;
- client name;
- one exact redirect URI;
- persisted scope set;
- enabled/revoked state;
- creation, update, and optional revocation timestamps.

OAuth token/client state may continue using the existing Valkey storage where
appropriate, but every authorization, token, and MCP access decision must
consult the persistent client state so disable/revoke takes effect across
restarts and replicas.

`OAUTH_REGISTERED_CLIENTS` is deprecated. A one-time, idempotent migration may
import existing static registrations if their secrets are available, but
plaintext secrets must not be reconstructed from hashes. New clients are
created only through the admin UI.

## Admin API and UI

Admin endpoints remain protected by the existing MCP admin Basic Auth.

- `POST /api/admin/mcp/clients`: generate and create a client; response
  includes the secret exactly once.
- `GET /api/admin/mcp/clients`: list metadata, never secrets.
- `PATCH /api/admin/mcp/clients/:id`: update name, scope, redirect URI, or
  enabled state.
- `POST /api/admin/mcp/clients/:id/rotate-secret`: return the new secret once.
- `DELETE /api/admin/mcp/clients/:id` or an equivalent revoke action: mark
  the client revoked without deleting its audit row.

The existing admin page should clearly separate client credentials from MCP
access status. Copy must warn administrators to save the secret when shown;
the server cannot display it again.

## Validation and error behavior

- Client name is required and length-limited.
- Redirect URI is a valid absolute URI, has no fragment, and follows the
  existing OAuth redirect security rules.
- Exactly one redirect URI is stored per client.
- Scope values must come from the configured global allowlist.
- Duplicate client IDs and invalid updates return stable 4xx responses.
- Missing, disabled, revoked, or invalid-secret clients return OAuth-standard
  `invalid_client`/`unauthorized` responses without revealing which check
  failed.
- Database failures fail closed with the existing safe service error behavior.

## Migration and rollout

The deployment must provide PostgreSQL and MCP admin credentials. Existing DCR
tables and records must not silently grant access after the switch. Existing
clients need an explicit migration path or must be recreated in the admin UI.

Discovery metadata must stop advertising a usable `registration_endpoint` once
static-client mode is enabled. Documentation and examples must show the
admin-create flow and the credentials required by OpenCode or another MCP
client.

## Testing

Tests must cover:

- client creation with one-time secret response;
- list/detail never returning secrets;
- exact redirect URI and scope subset validation;
- secret verification and rotation invalidation;
- authorize/token/MCP success for enabled clients;
- immediate rejection after disable/revoke;
- old access token rejection after client disable/revoke;
- admin authentication and all CRUD/rotation endpoints;
- discovery no longer advertising usable DCR;
- migration behavior and absence of accidental access from old DCR records.
