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

## OAuth 2.1 / MCP

SearchPoint exposes a lightweight OAuth 2.1 provider for MCP clients at `/mcp`, with RFC 8414 discovery under `/.well-known/`, plus Dynamic Client Registration (RFC 7591) at `POST /api/oauth/register`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `OAUTH_ISSUER` | request origin | Issuer/base URL used in discovery & tokens |
| `MCP_RESOURCE_URL` | `${OAUTH_ISSUER}/mcp` | RFC 9728 `resource` advertised to clients |
| `OAUTH_REGISTERED_CLIENTS` | _(none → registration disabled)_ | Apps allowed to register via DCR; `;`-separated entries of `name\|token\|redirect_uri` |
| `OAUTH_SCOPES` | `openid search` | Scopes clients may request |
| `OAUTH_CLIENT_LABEL` | `Open WebUI (StartGPT SMDV)` | App label shown on the consent screen |
| `OAUTH_CONSENT_ALWAYS` | `false` | `true` = show consent screen on every interactive flow (dev/testing only) |
| `VALKEY_URL` | _(none → in-memory store)_ | Backing store for `oauth:*` state/code/token keys (required for multi-replica oauth storage) |

Optional in local dev — defaults work with in-memory OAuth storage. In production set `OAUTH_REGISTERED_CLIENTS` and `VALKEY_URL` (multi-replica).

> **Note:** DCR client registration requires `VALKEY_URL` set; without it the in-memory fallback loses registered clients on restart.

- `GET /.well-known/oauth-authorization-server` → authorization code flow with PKCE (S256)
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

```
bun run test:e2e:report
```
