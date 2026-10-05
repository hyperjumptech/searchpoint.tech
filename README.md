# SearchPoint (SCSE) Web

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building and Running with Docker

To build and run the application using Docker, make sure you have [Docker](https://docs.docker.com/get-docker/) installed on your system.

### Build the Docker Image

```bash
docker build -t scse-web-app -f Dockerfile .
```

### Run the Docker Container

```bash
docker run -p 3000:3000 scse-web-app
```

Now visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using `NEXT_PUBLIC_` Environment Variables in Docker

If your application requires environment variables that start with `NEXT_PUBLIC_` (for example, `NEXT_PUBLIC_API_URL`), you must map them in the Dockerfile so that Next.js can use their values _at build time_ (not just run time).

**How to map environment variables in your Dockerfile:**

1. **Add a new build argument and environment variable mapping _before_ the `RUN bun run build` step.**  
   For example, if your app needs `NEXT_PUBLIC_API_URL`, edit your Dockerfile as follows (above the build step):

   ```dockerfile
   ARG NEXT_PUBLIC_API_URL
   ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

   RUN bun run build
   ```

2. **Then, when building your image, supply the build argument:**

   ```bash
   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t scse-web-app -f Dockerfile .
   ```

**Summary:**

- For every public variable, add one `ARG ...` and one `ENV ...` line in the Dockerfile before the build.
- Pass each needed value to `docker build` via `--build-arg`.

---

**Note:**  
The provided Dockerfile already includes commented instructions where these lines should be inserted:

```dockerfile
# ARG NEXT_PUBLIC_SOMETHING=something
# ENV NEXT_PUBLIC_SOMETHING=$NEXT_PUBLIC_SOMETHING
```

Uncomment and duplicate these lines for each `NEXT_PUBLIC_` variable needed.

## MCP allowlist deployment

The MCP application allowlist is stored in PostgreSQL. Deployments must provide
these server-only variables:

- `DATABASE_URL`: connection string for the external, persistent PostgreSQL database.
- `MCP_ADMIN_USERNAME`: Basic Auth username for `/admin/mcp` and `/api/admin/mcp/*`.
- `MCP_ADMIN_PASSWORD`: Basic Auth password for `/admin/mcp` and `/api/admin/mcp/*`.

On the first protected authorization or MCP request, the application creates the
static-client table and index in a transaction. Keep PostgreSQL outside the web
container: it is the persistent database, so no Docker volume is required or
expected here.

Create clients as an administrator at `/admin/mcp`; Dynamic Client Registration
(DCR) is disabled. Each client has one exact redirect URI and an administrator-
selected set of scopes. The generated client secret is displayed exactly once,
when the client is created or its secret is rotated. Store it immediately; it
cannot be recovered later. Rotation invalidates the previous secret and any
tokens issued with it. Disabling a client prevents new authorization/token
requests and rejects existing MCP tokens; revoking a client is permanent and
also invalidates its credentials and existing tokens.

Allowlist checks fail closed. A missing/expired token, disabled or unknown client,
or unavailable PostgreSQL database cannot access MCP. Database failures return a
safe service/authentication error rather than allowing the request through.

OpenCode can use a loopback redirect such as
`http://127.0.0.1:19876/callback`. Configure the returned client ID and secret
in OpenCode, then complete the authorization-code flow with PKCE.

## OAuth 2.1 / MCP

SearchPoint exposes a lightweight OAuth 2.1 provider for MCP clients at `/mcp`, with RFC 8414 discovery under `/.well-known/`. Clients are provisioned administratively; Dynamic Client Registration (RFC 7591) is disabled.

| Variable                   | Default                      | Purpose                                                                                      |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `OAUTH_ISSUER`             | request origin               | Issuer/base URL used in discovery & tokens                                                   |
| `MCP_RESOURCE_URL`         | `${OAUTH_ISSUER}/mcp`        | RFC 9728 `resource` advertised to clients                                                    |
| `OAUTH_REGISTERED_CLIENTS` | _(optional, deprecated)_    | One-time migration seed for legacy DCR records; `;`-separated `name\|token\|redirect_uri` entries |
| `OAUTH_SCOPES`             | `openid search`              | Scopes clients may request                                                                   |
| `OAUTH_CLIENT_LABEL`       | `Open WebUI (StartGPT SMDV)` | App label shown on the consent screen                                                        |
| `OAUTH_CONSENT_ALWAYS`     | `false`                      | `true` = show consent screen on every interactive flow (dev/testing only)                    |
| `VALKEY_URL`               | _(none → in-memory store)_   | Backing store for `oauth:*` state/code/token keys (required for multi-replica oauth storage) |

`OAUTH_REGISTERED_CLIENTS` is deprecated legacy/DCR seed data only; it is not
imported into static OAuth client rows and is not a client-management API.
Existing DCR clients must be recreated in the static-client UI at
`/admin/mcp` (there is no automatic migration). Remove the variable after
recreating legacy clients. Set `VALKEY_URL` for durable OAuth state across
replicas, plus the required PostgreSQL and admin variables above.

> **Note:** `POST /api/oauth/register` is intentionally disabled and returns
> `404`. There is no `registration_endpoint` in discovery.

- `GET /.well-known/oauth-authorization-server` → authorization code flow with PKCE (S256), without DCR
- `GET /api/oauth/authorize` → 302 to Entra login or magic-link UI
- `POST /api/oauth/token` exchanges `code` (or `refresh_token`) for an access token
- `POST /mcp` speaks JSON-RPC 2.0 (MCP Streamable HTTP, stateless, POST-only; `GET` → 405): supports `initialize`, `ping`, `tools/list`, `tools/call`
- Tools: `search_file` (structured args — search, extension, kind, source, owner_email, updated_after/before, sort, mode, limit, offset — composed server-side into the backend filter DSL) and `get_file` (by `id`); backend JSON is passed through as text content
- Tool execution failures (backend down, session expired, not found) surface as `isError` tool results, not HTTP errors; auth failures stay HTTP 401 challenges

## End to End test

For now test run on local

Install Playwright browsers (one-time)

```
bunx playwright install
```

Run all E2E tests (headless mode)

```
bun run test:e2e
```

Run tests with visible browser window (headed mode)

```
bun run test:e2e:headed
```

Open the Playwright test UI

```
bun run test:e2e:ui
```

View the latest test report

```bash
bun run test:e2e:report
```

---

## Deployment & Release Tagging

Deployments to production and tenant environments are automated via Azure Pipelines (`azure-pipelines.yml`) triggered by Git tags. Pushing a tag will automatically build the Docker image, push it to Azure Container Registry (ACR), and deploy to the corresponding server(s).

### Tagging Matrix

| Tag Pattern | Target Server(s) | Network / Connection | Notes |
| :--- | :--- | :--- | :--- |
| `v*` (e.g. `v1.9.6`) | **All 3 Servers**<br>• Hyperjump (Production)<br>• SMDV<br>• Sinarmas | • Hyperjump: OpenVPN<br>• SMDV: WireGuard<br>• Sinarmas: WireGuard | Any tag **without** `-smdv` or `-sinarmas` suffix triggers parallel deployments to all three environments. |
| `v*-smdv` (e.g. `v1.9.6-smdv`) | **SMDV only** | WireGuard | Targets only the SMDV server; skipped on Hyperjump and Sinarmas. |
| `v*-sinarmas` (e.g. `v1.9.6-sinarmas`) | **Sinarmas only** | WireGuard | Targets only the Sinarmas server; skipped on Hyperjump and SMDV. |

### How to Release via Git Tag

1. **Deploy to all three servers (Hyperjump, SMDV, Sinarmas):**
   ```bash
   git tag v1.9.6
   git push origin v1.9.6
   ```

2. **Deploy only to SMDV:**
   ```bash
   git tag v1.9.6-smdv
   git push origin v1.9.6-smdv
   ```

3. **Deploy only to Sinarmas:**
   ```bash
   git tag v1.9.6-sinarmas
   git push origin v1.9.6-sinarmas
   ```

> **Note:**
> - The pipeline strips the leading `v` from the tag (e.g. `v1.9.6` → `1.9.6`, `v1.9.6-smdv` → `1.9.6-smdv`) to update `package.json` and tag the Docker image in ACR (`scse/search-ui-web`).
> - The production (Hyperjump) deployment pushes both `{version}` and `latest` tags, while tenant deployments (SMDV, Sinarmas) push `{version}` only to avoid clobbering production.
> - The deployment updates `FRONTEND_TAG` in `services/frontend/.env` on the target host and restarts the container via Docker Compose.
