# OIDC Provider untuk MCP OAuth 2.1 (Open WebUI) — Design Spec

**Date:** 2026-08-28
**Status:** Draft — awaiting review before `writing-plans`
**Author:** brainstorming (architectural path)
**Repo:** `poc-search-ui-web` (Next.js 15.5 App Router)

---

## 1. Ringkasan & Tujuan

Menyediakan **OIDC Provider / OAuth 2.1 Authorization Server** di dalam Next.js `scse-web` agar **Open WebUI (sebagai OAuth client)** bisa connect ke MCP server kita via **OAuth 2.1 Static** (tanpa DCR). Tujuan akhirnya: Open WebUI dapat `access_token` → pakai `Authorization: Bearer` untuk hit **MCP di Next.js (`/mcp`)** → Next.js proxy ke **SearchPoint Backend (`api.searchpoint.hyperjump.tech`)** dengan `Cookie: SCSE_ID`.

**Analogi:** Next.js = resepsionis hotel, `SCSE_ID` = kunci brankas asli (jangan dikasih ke tamu), `access_token` = kartu harian resepsionis, `refresh_token` = kartu mingguan (hanya untuk tamu magic-link).

**Goals:**
- Discovery ijo di Open WebUI (`Check OAuth Discovery`).
- Support 2 IdP existing: **Entra (Microsoft)** dan **Magic Link** tanpa ubah backend Go.
- Handle dual lifetime `SCSE_ID`: Entra ~60-90 menit (stateless JWKS, no refresh), Magic 168h = 7 hari (stateless `iss: searchpoint`, fixed, no revoke).
- Domain configurable per tenant (SMDV, Sinarmas, prod, staging) via env.

**Non-Goals (YAGNI):**
- DCR (`POST /oauth/register`) — Static only dulu.
- Ubah `service/internal/platform/middleware/auth.go` atau `magiclink/token.go`.
- Sessions table / refresh di backend.

---

## 2. Architecture

```
[Open WebUI] -- OAuth 2.1 + PKCE S256 (Static) --> [Next.js scse-web] -- Cookie: SCSE_ID --> [Backend api.searchpoint]
     |  discovery, authorize, token, revoke              |  Valkey (REDIS)                 |  GET /v1/auth/
     |  Bearer at -> POST /mcp (Streamable HTTP)         |  oauth:* mapping TTL            |  POST /v1/auth/magic-link
     |                                                   |                                 |  POST /v1/auth/magic-link/confirm
     |                                                   |                                 |  GET  /v1/auth/me
```

**Komponen baru (Next.js):**
- `/.well-known/oauth-authorization-server` + `/.well-known/oauth-protected-resource` + `/.well-known/jwks.json` (optional untuk opaque).
- `/api/oauth/authorize` (GET) — validasi Static client + PKCE, simpan `oauth:state`.
- `/api/oauth/callback` (GET, internal) — dipanggil setelah Entra/magic sukses, generate `code`.
- `/api/oauth/token` (POST) — `authorization_code` + `refresh_token` (magic only).
- `/api/oauth/revoke` (POST, RFC 7009) + `/api/oauth/userinfo` (GET) + `/api/oauth/poll` (GET, untuk magic polling).
- `/mcp` (GET + POST, Streamable HTTP) — Resource Server proxy.

**Yang disentuh:** `src/lib/env.ts`, `src/middleware.ts`, `src/lib/rate-limit.ts`, `next.config.ts` (headers).

**Yang tidak disentuh:** Backend Go (stateless verify).

---

## 3. Endpoints & Discovery

### 3.1 Route Table

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/.well-known/oauth-authorization-server` | none | RFC 8414 discovery |
| GET | `/.well-known/oauth-protected-resource` | none | RFC 9728 resource metadata |
| GET | `/.well-known/jwks.json` | none | (optional, kalau pakai JWT at) |
| GET | `/api/oauth/authorize` | none (validasi client_id) | Start OAuth, redirect ke Entra atau UI magic |
| GET | `/api/oauth/callback` | Cookie SCSE_ID | Internal, generate code, redirect ke Open WebUI |
| GET | `/api/oauth/poll?state=...` | none | Poll untuk magic async |
| POST | `/api/oauth/token` | client_secret_basic/post | `grant_type=authorization_code` atau `refresh_token` |
| POST | `/api/oauth/revoke` | client_secret | RFC 7009 |
| GET | `/api/oauth/userinfo` | Bearer at | OIDC userinfo |
| GET/POST | `/mcp` | Bearer at | MCP Streamable HTTP proxy |

`middleware.ts` skip `SCSE_ID` guard untuk `/.well-known/*` dan `/api/oauth/*`. `/mcp` guard via Bearer, 401 → `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource"`.

### 3.2 Domain Configurable

```ts
// src/lib/env.ts
OAUTH_ISSUER: z.url().optional() // e.g. https://searchpoint.smdv.hyperjump.tech
MCP_RESOURCE_URL: z.url().optional() // default `${OAUTH_ISSUER}/mcp`
OAUTH_CLIENT_ID: z.string().default("searchpoint-mcp-static")
OAUTH_CLIENT_SECRET: z.string().optional() // di-hash timingSafe di /token
```

- Jika `OAUTH_ISSUER` kosong → derive dari `new URL(request.url).origin` (hormati `x-forwarded-host`).
- Discovery `issuer`, `authorization_endpoint`, dll. dibangun dari `OAUTH_ISSUER`.
- Per-tenant deploy tinggal isi `services/frontend/.env` (sesuai `TECHNICAL_DOCUMENTATION.md` SMDV/Sinarmas stage) — no rebuild.

### 3.3 Discovery Payload (biar ijo di Open WebUI)

`GET /.well-known/oauth-authorization-server`:
```json
{
  "issuer": "https://searchpoint-web.hyperjump.tech",
  "authorization_endpoint": "https://searchpoint-web/api/oauth/authorize",
  "token_endpoint": "https://searchpoint-web/api/oauth/token",
  "revocation_endpoint": "https://searchpoint-web/api/oauth/revoke",
  "userinfo_endpoint": "https://searchpoint-web/api/oauth/userinfo",
  "jwks_uri": "https://searchpoint-web/.well-known/jwks.json",
  "scopes_supported": ["openid","profile","email","search"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code","refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic","client_secret_post","none"],
  "revocation_endpoint_auth_methods_supported": ["client_secret_basic"]
}
```

`GET /.well-known/oauth-protected-resource`:
```json
{
  "resource": "https://searchpoint-web/mcp",
  "authorization_servers": ["https://searchpoint-web"],
  "scopes_supported": ["openid","search"],
  "bearer_methods_supported": ["header"]
}
```
`registration_endpoint` **di-omit** karena Static only. Open WebUI `Check OAuth Discovery` hanya fetch & parse — tidak hit MCP.

---

## 4. Valkey Schema & TTL Dual Lifetime (A1)

Reuse `VALKEY_URL` existing.

### 4.1 Keys

```
oauth:state:<state>    -> { client_id, redirect_uri, code_challenge, scope, resource, createdAt } TTL 10m
oauth:code:<code>      -> { scseId, scseExp, user:{email,name}, client_id, redirect_uri, code_challenge, scope, iss } TTL 10m
oauth:at:<at>          -> { scseId, scseExp, user, client_id, scope, resource } TTL atTtl
oauth:rt:<rt>          -> { scseId, scseExp, user, client_id, scope } TTL rtTtl (only magic)
oauth:magic:pending:<state> -> "pending"|"done" TTL 15m (untuk polling)
```

Semua token opaque `crypto.randomBytes(32).toString('base64url')`.

### 4.2 TTL A1

```ts
const scseTtlMs = scseExp*1000 - Date.now()
if (iss === "entra") { // Microsoft AT, exp dari token.Expiry ~60-90m
  atTtl = Math.min(scseTtlMs, 3600*1000)
  rt = null // no refresh, expired = login ulang via GET /v1/auth/
} else { // searchpoint magic, 168h
  atTtl = Math.min(scseTtlMs, 3600*1000) // cap 1 jam
  rtTtl = Math.min(scseTtlMs, 7*24*3600*1000) // sampai scse habis
}
```

- Entra 60m → at 60m, no rt. Revoke via `DEL oauth:at:*` cukup.
- Magic 7d → at 1 jam + rt 7 hari. `POST /token grant_type=refresh_token` cek `oauth:rt` ada + `scseExp > now` + `GET /v1/auth/me` dengan `Cookie: SCSE_ID` masih 200 → issue at baru.

Hapus domain dari allow-list **tidak eject** session aktif sampai exp (Phase 1 no revoke). Mitigasi: `DEL oauth:rt:*` di Valkey untuk eject manual.

---

## 5. Flows

### 5.1 Entra (sync, short-lived)

```
Open WebUI GET /api/oauth/authorize?client_id,redirect_uri,code_challenge,state,resource,scope
  -> Next.js validasi client_id==env, PKCE S256, redirect_uri allowlist, simpan oauth:state 10m
  -> 302 ke GET /v1/auth/?return_to=https://web/api/oauth/callback?state=XYZ
Browser -> Microsoft login -> GET /v1/auth/redirect -> Set-Cookie SCSE_ID=<MS AT, Expires=token.Expiry>
  -> 302 ke /api/oauth/callback?state=XYZ (bawa Cookie)
Next.js callback: baca SCSE_ID, GET /v1/auth/me (JWKS verify), dapat user, generate code, SET oauth:code 10m,
  -> 302 ke redirect_uri?code=<code>&state=<state> (Open WebUI)
Open WebUI POST /api/oauth/token {code, code_verifier, client_id, client_secret} -> 200 {access_token, expires_in, token_type:"Bearer"} (no refresh)
```

### 5.2 Magic Link (async, long-lived)

```
Open WebUI -> /authorize (sama) -> Next.js tampilkan UI magic (reuse sendMagicLink) dengan hidden return_to=/api/oauth/callback?state=XYZ
User input email -> POST /v1/auth/magic-link {email, return_to} -> backend kirim email, SET oauth:magic:pending:XYZ="pending"
Next.js tampilkan polling page "Cek email, jangan tutup tab" + JS poll GET /api/oauth/poll?state=XYZ tiap 3s

[Tab lain] User klik email -> GET /v1/auth/magic-link/redirect?token=... -> POST /v1/auth/magic-link/confirm {token}
  -> Set-Cookie SCSE_ID=<JWT iss:searchpoint, exp now+168h> -> 302 ke return_to (/api/oauth/callback?state=XYZ?session=...)
Next.js callback: ambil SCSE_ID dari ?session atau cookie, GET /v1/auth/me, SET oauth:code 10m, SET oauth:magic:pending:XYZ="done"
Polling page dapet {status:"done", redirect:"https://openwebui/callback?code=..."} -> auto redirect ke Open WebUI
Open WebUI POST /token -> 200 {access_token (1h), refresh_token (7d), expires_in:3600}
```

PKCE: `code_challenge` disimpan di `oauth:state` & `oauth:code`, `/token` wajib `S256(code_verifier)==challenge`.

---

## 6. Token & MCP Proxy

**Analogi resepsionis:** `access_token` = kartu harian, `refresh_token` = kartu mingguan, `SCSE_ID` = kunci brankas.

**`POST /token` (authorization_code):**
- Validasi `client_id`/`client_secret` (timingSafeEqual), `code` ada di Valkey, `code_verifier` match, `redirect_uri` sama, `resource` sama.
- Generate `at` + (jika magic) `rt`, SET dengan TTL A1, DEL `oauth:code`, return JSON.

**`POST /token` (refresh_token, magic only):**
- Validasi `rt` ada, `scseExp > now`, optional `GET /v1/auth/me` masih 200, issue `at` baru 1 jam.

**`POST /mcp`:**
- Baca `Authorization: Bearer <at>`, `GET oauth:at:<at>` dari Valkey, cek `scseExp > now`, ambil `scseId`, forward via `fetcher()` dengan `Cookie: SCSE_ID=<scseId>` ke `BACKEND_BASE_URL/v1/files` atau handler MCP sebenarnya. Return response ke Open WebUI. 401 jika missing/expired → `WWW-Authenticate` dengan `resource_metadata`.

---

## 7. Security & Error

- PKCE S256 wajib, `plain` → `invalid_request`.
- Rate limit `POST /token` & `/mcp` via `src/lib/rate-limit.ts` (Valkey fixed-window 60/min per IP, fallback in-memory).
- `SCSE_ID` tetap `HttpOnly; SameSite=Lax; Secure` di prod, never expose ke JS.
- OAuth errors JSON per RFC 6749: `invalid_request`, `invalid_client`, `invalid_grant`, `unsupported_grant_type`, `invalid_scope`.
- `state` & `code` one-time use, TTL 10m.
- No sessions table — stateless, revoke via Valkey DEL.

---

## 8. Env & File Changes

**`src/lib/env.ts` tambah:**
```
OAUTH_ISSUER, MCP_RESOURCE_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

**Files baru:**
```
src/app/.well-known/oauth-authorization-server/route.ts
src/app/.well-known/oauth-protected-resource/route.ts
src/app/.well-known/jwks.json/route.ts (optional)
src/app/api/oauth/authorize/route.ts
src/app/api/oauth/callback/route.ts
src/app/api/oauth/poll/route.ts
src/app/api/oauth/token/route.ts
src/app/api/oauth/revoke/route.ts
src/app/api/oauth/userinfo/route.ts
src/app/mcp/route.ts
src/lib/oauth.ts (PKCE, token gen, Valkey helpers)
src/lib/oauth-valkey.ts (key helpers)
```

**Files modif:**
```
src/middleware.ts — skip /.well-known/*, /api/oauth/*; Bearer check untuk /mcp
next.config.ts — headers (optional)
```

**Per-tenant env (`services/frontend/.env`):**
```
OAUTH_ISSUER=https://searchpoint.<tenant>.hyperjump.tech
MCP_RESOURCE_URL=https://searchpoint.<tenant>.hyperjump.tech/mcp
OAUTH_CLIENT_ID=searchpoint-mcp-<tenant>
OAUTH_CLIENT_SECRET=<random 32B base64url>
```

---

## 9. Testing

- **Unit (vitest):** PKCE S256, TTL math, Valkey mock, client_secret timingSafe.
- **E2E (Playwright):** discovery 200, authorize→Entra mock 302→callback→token, magic polling flow, `/mcp` 401 tanpa Bearer, 200 dengan Bearer, refresh magic 200, refresh Entra 400, `Check OAuth Discovery` ijo (discovery parse).
- **Manual:** `curl /.well-known/oauth-authorization-server | jq`, `curl /mcp -H "Authorization: Bearer bad"` → 401.

---

## 10. Deployment Notes

- Tidak perlu ubah `azure-pipelines.yml` — env baru di-inject via `services/frontend/.env` di stage SMDV/Sinarmas (sudah ada pattern `WireGuard` di `TECHNICAL_DOCUMENTATION.md`).
- Valkey sudah ada — tidak perlu migrasi DB.
- Rollback: hapus routes `/mcp` & `/.well-known/*` → Open WebUI fallback ke Bearer none.

---

## 11. Open Questions (resolved)

- Q1: Proxy vs direct → Proxy via Next.js (Bearer→Cookie translation) — resolved.
- Q2: Mapping → opaque at → scseId di Valkey — resolved.
- Q3: Domain configurable → via `OAUTH_ISSUER`/`MCP_RESOURCE_URL` — resolved.
- Q4: TTL A1 → at 1h + rt 7d untuk magic, Entra no rt — resolved.
- Q5: Static vs DCR → Static only — resolved.

---

## Self-Review

- [x] Placeholder scan: no TBD/TODO.
- [x] Internal consistency: Entra short vs magic long reflected in TTL & refresh.
- [x] Scope check: single spec, not too large, fits one plan.
- [x] Ambiguity: issuer configurable, Static client, PKCE S256 explicit.
