# MCP Tools Design — `search_file` & `get_file` over `/mcp`

**Date:** 2026-08-28
**Status:** Approved design (brainstormed with Denny)
**Depends on:** [OIDC Provider design](2026-08-28-oidc-provider-design.md) — auth layer, `/mcp` route, Valkey token mapping (all already merged on this branch)
**Branch:** `feat/oidc-provider-mcp` (same branch, tested together with OIDC)

## 1. Goal

Implement the MCP (Model Context Protocol) server behavior for the existing `/mcp` route so Open WebUI can discover and call two tools backed by the SearchPoint API:

1. **`search_file`** — `GET /v1/files` (search/list with filter DSL)
2. **`get_file`** — `GET /v1/files/{id}`

The `/mcp` route currently authenticates (Bearer → Valkey → `SCSE_ID`) then raw-proxies to `/v1/files` (ponytail placeholder). This design replaces the raw proxy with a real JSON-RPC handler. OIDC and MCP are tested together.

## 2. Locked decisions (from brainstorm)

| Decision | Choice |
|---|---|
| Protocol implementation | **Hand-rolled JSON-RPC 2.0** (no `@modelcontextprotocol/sdk`) — surface is 5 methods; SDK + Next App Router adapter is overkill. Handler dispatch isolated in its own module so an SDK swap later is contained. |
| Transport | **Streamable HTTP, stateless, POST-only.** No `Mcp-Session-Id`, no SSE. `GET /mcp` → `405` (spec-prescribed for no-SSE servers; MCP healthcheck is POST `initialize`, not GET). Fallback if a naive Open WebUI probe chokes on 405: minimal hold-open SSE on GET (add later only if proven needed). |
| Batching | JSON-RPC batch arrays → single `-32600` error (batching was removed in MCP spec 2025-06-18). |
| Tool input | **Structured args** for `search_file`; server composes the backend filter DSL string. LLM never sees DSL syntax. |
| Tool output | **Full passthrough** of backend JSON as text content (including `allow_list`, `owners`, `hash`; user's explicit choice). Search includes `meta.pagination` so the LLM can page by `total`. |
| Backend response shapes | Search wraps docs in `value[].\_source`; get-by-id wraps in `value.data` (confirmed by Denny). |
| Branch/PR | Same branch `feat/oidc-provider-mcp`; PR #11637 scope grows to cover MCP. |

## 3. Architecture

```
Open WebUI ──POST /mcp (Bearer AT)──▶ src/app/mcp/route.ts
                                       │ rate limit + Bearer auth (unchanged)
                                       │ Bearer → oauth:at:<token> → { scseId, scseExp }
                                       ▼
                             src/lib/mcp-protocol.ts   (pure, new)
                             JSON-RPC 2.0 dispatch:
                             initialize / notifications/initialized /
                             ping / tools/list / tools/call
                                       │ tools/call
                                       ▼
                             src/lib/mcp-tools.ts      (new)
                             search_file | get_file
                                       │ GET /v1/files[?…]  GET /v1/files/{id}
                                       │ Cookie: SCSE_ID=…  (never exposed to client)
                                       ▼
                                  env.BACKEND_BASE_URL
```

- **Stateless:** every request carries its own Bearer token; server holds no per-session state. Allowed by MCP spec (server MAY omit sessions).
- **Version negotiation:** `initialize` response echoes the client's `protocolVersion` if it is one of `2025-06-18`, `2025-03-26`, `2024-11-05`; otherwise respond with `2025-06-18`. `serverInfo.name = "searchpoint-mcp"`, capabilities `{ tools: { listChanged: false } }`.
- **Notifications** (no `id`), including `notifications/initialized` and unknown ones: no body, HTTP `202`.
- **`GET /mcp`** → `405 Method Not Allowed`.
- **No new dependencies, no new env vars, no Valkey changes.** `BACKEND_BASE_URL` (default `https://api.searchpoint.hyperjump.tech`) is the upstream.

## 4. Tool schemas

### `search_file`

Description (for the LLM): search the user's documents across OneDrive/SharePoint/Teams/shared folders/Apple Notes; returns full JSON with hits and pagination.

Input (zod-validated → JSON Schema in `tools/list`):

| arg | type | validation | composes to |
|---|---|---|---|
| `search` | string, optional | — | `search` query param |
| `extension` | string[], optional | lowercase alnum (`/^[a-z0-9]{1,10}$/` per item, input lowercased) | `extension in ('pdf','docx')` |
| `kind` | enum, optional | `document` \| `image` \| `video` \| `other` | `kind eq '<v>'` |
| `source` | enum, optional | `shared folder` \| `apple notes` \| `onedrive` \| `onedrive-business` \| `onedrive-personal` \| `sharepoint` \| `teams` \| `unknown` | `source eq '<v>'` |
| `owner_email` | string, optional | email regex (`/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/`) | `owner_email eq '<v>'` |
| `updated_after` | string, optional | `YYYY-MM-DD` | `updated_at gte '<v>'` |
| `updated_before` | string, optional | `YYYY-MM-DD` | `updated_at lte '<v>'` |
| `sort` | enum, optional | `relevance` \| `updated_at` \| `name` \| `updated_at asc` \| `updated_at desc` \| `name asc` \| `name desc` | `sort` param (default `relevance`) |
| `mode` | enum, optional | `broad` \| `exact` (default `broad`) | `mode` param |
| `limit` | int, optional | must be 1–50, out-of-range rejected `-32602` (default 10) | `limit` param |
| `offset` | int, optional | ≥ 0 (default 0) | `offset` param |

- Multiple filter parts are joined with ` and ` in a fixed order (extension, kind, source, owner_email, updated_after, updated_before). Empty → no `filter` param.
- **Injection safety by construction:** every value passes a whitelist/regex before entering the filter string, so no escaping logic is needed and hostile characters (`'`, `(`, `;`) can never reach the DSL. Invalid values are rejected with `-32602`.
- Query built with `URLSearchParams` (handles encoding of the composed filter and `search`).

### `get_file`

Input: `{ id: string }` (required) — a `value[].\_source.id` from `search_file` results. Backend path: `GET /v1/files/{encodeURIComponent(id)}`.

### Output

Both tools return MCP tool result: `{ content: [{ type: "text", text: "<backend JSON>" }] }` with the **entire parsed backend body** stringified (`value` + `meta` included). No field trimming.

## 5. Error mapping — 3 layers

### Layer 1 — HTTP, before JSON-RPC (existing, unchanged)

| case | response |
|---|---|
| missing Bearer | `401` challenge `invalid_request` |
| AT unknown / expired (incl. `scseExp` in the past) | `401` challenge `invalid_token` + `WWW-Authenticate: Bearer error="invalid_token", resource_metadata=…` |
| rate limit | `429` + `Retry-After` (existing shared `oauth` bucket) |

### Layer 2 — JSON-RPC protocol errors (malformed request → protocol error)

| case | code |
|---|---|
| unparseable JSON | `-32700` |
| batch array / not an object / bad `jsonrpc` field | `-32600` |
| unknown request method | `-32601` |
| invalid params (zod fail) | `-32602` + first issue message |
| unexpected internal error | `-32603` |
| unknown/unroutable notification (no `id`) | swallow → `202` |
| unknown tool name in `tools/call` | `-32602` "Unknown tool: <name>" |

Protocol error responses include `id` from the request (`null` for `-32700`).

### Layer 3 — tool execution errors (valid request, failed execution → tool result `isError: true`, HTTP stays 200)

| backend case | tool result text |
|---|---|
| success | passthrough JSON |
| network error / timeout (AbortSignal, 15 s) | `Backend unavailable` |
| backend `401` | `Session expired — please re-authenticate` (SCSE_ID died while our AT mapping still looks valid; HTTP 401 to the *client* would falsely trigger re-OAuth semantics) |
| backend `404` on `get_file` | `File not found or you do not have access` — fixed message, preserves backend anti-enumeration |
| backend `400` | passthrough body + `isError` (defensive; composition should make this unreachable) |
| backend `5xx` | `Backend error (<status>)` |

## 6. Files

| file | action |
|---|---|
| `src/lib/mcp-protocol.ts` | **new** — pure JSON-RPC dispatcher; receives parsed body + a `callTool` callback; returns `{ status, body }`. Testable without HTTP. |
| `src/lib/mcp-tools.ts` | **new** — tool definitions (name/description/inputSchema) + executors (zod → backend fetch → result). |
| `src/lib/mcp-protocol.test.ts` | **new** — protocol unit tests. |
| `src/lib/mcp-tools.test.ts` | **new** — composition/validation/mapping unit tests. |
| `src/app/mcp/route.ts` | **rewrite** — keep auth + rate limit; replace raw proxy with protocol dispatch; `GET` → 405. |
| `src/app/mcp/route.test.ts` | **extend (exists)** — auth-before-protocol, full `tools/call` with stubbed fetch. |
| `e2e/oauth-mcp.spec.ts` | extend — full-chain test (discovery → token → initialize → tools/list → tools/call with stubbed backend). |

## 7. Testing

**Unit (vitest; mock Valkey + stub `fetch`, same pattern as existing oauth tests):**

- *Protocol:* `initialize` echoes known versions / falls back to `2025-06-18` for unknown; `tools/list` returns exactly 2 tools with JSON Schema; `notifications/initialized` → 202; `ping` → `{}`; unknown method → `-32601`; unknown tool name → `-32602`; malformed JSON → `-32700` with `id: null`; batch array → `-32600`; `id` echoed verbatim (string and number).
- *Tools:* filter composition table — single/multi extension, each enum, `source eq 'shared folder'` (space inside quotes), email, both date bounds, multi-part join with ` and `, no args → no `filter` param; dirty values rejected (`-32602`): `"pdf') or ('"` extension, bad email, bad date; `limit` out of 1–50 rejected; sort defaults; search passthrough of `value._source` array + `meta`; `get_file` passthrough of `value.data`; `encodeURIComponent` on id; 404 → fixed anti-enumeration message; 401 → re-auth message; timeout → "Backend unavailable"; 5xx → "Backend error (status)".
- *Route:* 401 challenge fires before any JSON-RPC processing; tools/call end-to-end through the route with stubbed fetch; `GET /mcp` → 405.

**E2E (extends `e2e/oauth-mcp.spec.ts`):**
One automated chain proving OIDC + MCP together: `/.well-known/oauth-authorization-server` → token → `POST /mcp` initialize → `tools/list` → `tools/call get_file` (stubbed backend 404) → `isError` result. Plus: `/mcp` without token → 401 challenge.

**Manual (Denny, staging):** connect Open WebUI → "Check OAuth Discovery" passes → OAuth login → both tools listed → run `search_file` (`search=pajak`) and `get_file` on a real id. This also proves the GET-405 assumption against the real client.

## 8. Out of scope (future)

- `@modelcontextprotocol/sdk` migration — only if surface grows (resources/prompts/subscriptions/SSE).
- GET SSE fallback — only if Open WebUI probe is proven to choke on 405.
- More tools, resources, prompts.
- Field trimming / token optimization of tool output.
- Refresh-token rotation, RFC 8707 `resource` validation (deferred from OIDC spec).
