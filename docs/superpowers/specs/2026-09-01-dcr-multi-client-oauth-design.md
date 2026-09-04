# DCR (Dynamic Client Registration) untuk Multi-Client OAuth — Design Spec

**Date:** 2026-09-01
**Status:** Draft — awaiting review before `writing-plans`
**Author:** brainstorming (architectural path)
**Repo:** `poc-search-ui-web` (Next.js 15.5 App Router)

---

## 1. Ringkasan & Tujuan

Sekarang SearchPoint cuma punya **satu static client** (`searchpoint-mcp-static`) yang di-hardcode di `authorize`/`token`/`revoke`. Bos mau SearchPoint bisa **"daftarin aplikasinya"** — banyak konsumen OAuth (Open WebUI, Claude Desktop, VS Code, app internal) yang masing-masing punya `client_id` sendiri, bisa di-revoke per-app, dan hanya **aplikasi tertentu** yang boleh gabung.

Tujuan PRD ini: implement **Dynamic Client Registration (RFC 7591)** dengan **guard terkelola** — tiap aplikasi yang boleh daftar sudah didefinisikan di env config, dan daftar cuma bisa lewat **registration token per-app** + **redirect_uri allowlist anchor** (anti-spoof).

**Analogi:** MCP server = restoran (satu). DCR = tiap pengunjung (Open WebUI, Claude, dst) bikin reservasi dapet meja sendiri (`client_id`). Yang didaftarin itu *kliennya*, bukan *server-nya*. Restoran tetap satu.

**Goals:**
- Multiple OAuth client (MCP + non-MCP) connect ke **MCP server yang sama** (`/mcp`).
- Pendaftaran terkontrol: hanya app yang punya token + redirect_uri yang di-allowlist yang bisa register.
- **Registry-only**: setelah DCR hidup, `authorize`/`token`/`revoke` cuma terima client yang ada di registry — static client lama dihapus (belum rilis, jadi aman).
- Revoke per-app via `DELETE /api/oauth/register/{client_id}`.
- Open WebUI & Claude Desktop auto-register (dua-duanya punya DCR client bawaan).

**Non-Goals (YAGNI):**
- Admin UI / management dashboard — env config aja.
- Full RFC 7592 (GET/PUT/DELETE + `registration_access_token`) — cuma `DELETE`.
- Ubah MCP server / `/mcp` route — tetep satu.
- Ubah backend Go.

---

## 2. Architecture

```
[Open WebUI / Claude Desktop / app lain]
      │  DCR (RFC 7591)                 OAuth flow (authorize → token → /mcp)
      ▼                                    │
┌─────────────────────────────┐            │
│  POST /api/oauth/register   │            │
│  DELETE /api/oauth/register │            │
│  /{client_id}               │            │
└──────────────┬──────────────┘            │
               │  validasi token +         │
               │  redirect_uri anchor      │
               ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│  Valkey registry: oauthKeys.client(id) → ClientRecord   │
│  { id, name, secretHash, redirectUris, scope,           │
│    tokenEndpointAuthMethod, registrationTokenId,        │
│    createdAt }                                          │
└──────────────┬──────────────────────┬───────────────────┘
               │ resolveClient(id)    │
               ▼                      ▼
┌──────────────────────────┐  ┌───────────────────────────┐
│ authorize / token /      │  │  Env OAUTH_REGISTERED_    │
│ revoke (registry-only)   │  │  CLIENTS (parsed di lib/  │
│                          │  │  oauth-dcr.ts)            │
└──────────────────────────┘  └───────────────────────────┘
```

**Komponen baru (Next.js):**
- `src/lib/oauth-dcr.ts` — pure helpers (no valkey): `parseClientsEnv()`, `validateMetadata()`, `generateClientId()`, `generateClientSecret()`, `hashSecret()`, `resolveClient()` (di-export terpisah karena butuh valkey).
- `src/app/api/oauth/register/route.ts` — `POST` (DCR).
- `src/app/api/oauth/register/[client_id]/route.ts` — `DELETE /{client_id}`.
- Perubahan: `src/app/api/oauth/authorize/route.ts`, `token/route.ts`, `revoke/route.ts` → baca registry.
- Perubahan: `src/app/.well-known/oauth-authorization-server/route.ts` → advertise `registration_endpoint`.
- Perubahan: `src/lib/env.ts`, `src/lib/oauth-valkey.ts` (add `oauthKeys.client`).

**Yang disentuh:** `src/lib/env.ts`, `src/lib/oauth-valkey.ts`, 3 route OAuth, 1 well-known route.

**Yang tidak disentuh:** backend Go, `/mcp`, middleware (registration endpoint tetap publik, auth-nya via Bearer token di body header).

---

## 3. Endpoints

### 3.1 Route Table (baru)

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | `/api/oauth/register` | `Authorization: Bearer <registration-token>` | Daftarkan client baru (RFC 7591) |
| DELETE | `/api/oauth/register/{client_id}` | `Authorization: Bearer <registration-token>` | Cabut akses client |

### 3.2 Discovery — advertise `registration_endpoint`

`/.well-known/oauth-authorization-server` tambah field:

```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/api/oauth/authorize",
  "token_endpoint": "http://localhost:3000/api/oauth/token",
  "revocation_endpoint": "http://localhost:3000/api/oauth/revoke",
  "userinfo_endpoint": "http://localhost:3000/api/oauth/userinfo",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "registration_endpoint": "http://localhost:3000/api/oauth/register",
  "scopes_supported": ["openid", "profile", "email", "search", "magic"],
  "...": "..."
}
```

RFC 7591 §2. Client yang support DCR (OpenWebUI, Claude Desktop) auto-detect & auto-register.

---

## 4. `POST /api/oauth/register` — DCR (RFC 7591)

### 4.1 Request

```
POST /api/oauth/register
Authorization: Bearer <registration-token>
Content-Type: application/json

{
  "client_name": "Open WebUI",
  "redirect_uris": ["http://localhost:8080/oauth/clients/mcp:searchpoint/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_post"
}
```

Field wajib dari client (RFC 7591): `redirect_uris` (array non-empty). Yang lain opsional dengan default.

### 4.2 Validasi berurutan

| # | Cek | Gagal → |
|---|-----|---------|
| 1 | `Authorization: Bearer <token>` ada | `401 unauthorized` |
| 2 | Token cocok dengan salah satu entry `OAUTH_REGISTERED_CLIENTS` | `401 unauthorized` |
| 3 | Body JSON valid & `redirect_uris` non-empty | `400 invalid_request` |
| 4 | `redirect_uris[0]` exact-match entry token tsb | `403 invalid_redirect_uri` |
| 5 | `grant_types` ⊆ `{authorization_code, refresh_token}` | `400 invalid_request` |
| 6 | `response_types` ⊆ `{code}` | `400 invalid_request` |
| 7 | `token_endpoint_auth_method` ∈ `{none, client_secret_basic, client_secret_post}` (default `client_secret_post`) | `400 invalid_request` |
| 8 | `scope` (kalau ada) ⊆ `OAUTH_SCOPES` | `400 invalid_scope` |
| 9 | Token ini udah dipake daftar client yang masih aktif | `409 client_already_registered` |

Catatan anchor: cek `redirect_uri` ini yang bikin anti-spoof. `client_name` **tidak** dicek sebagai anchor (bisa di-spoof) — cuma disimpan buat tampilan consent screen.

### 4.3 Generate & simpan

- `client_id` = `searchpoint-mcp-` + random base64url (mis. `searchpoint-mcp-a1b2c3`).
- `client_secret` = random base64url (kecuali `token_endpoint_auth_method === "none"` → kosong).
- Simpan di Valkey `oauthKeys.client(clientId)`:
  ```json
  {
    "id": "searchpoint-mcp-a1b2c3",
    "name": "Open WebUI",
    "secretHash": "sha256 hex",        // hash, bukan plaintext
    "redirectUris": ["..."],
    "scope": "openid search",
    "tokenEndpointAuthMethod": "client_secret_post",
    "registrationTokenId": "<name/token-id dari env>",
    "createdAt": 1730000000
  }
  ```
  TTL: non-expiring (tanpa EX). `client_secret_expires_at: 0`.

### 4.4 Response 201 (RFC 7591 §3.2.1)

```json
{
  "client_id": "searchpoint-mcp-a1b2c3",
  "client_secret": "s3cret...",
  "client_id_issued_at": 1730000000,
  "client_secret_expires_at": 0,
  "redirect_uris": ["http://localhost:8080/oauth/clients/mcp:searchpoint/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_post",
  "client_name": "Open WebUI",
  "scope": "openid search"
}
```

- `client_secret` cuma muncul sekali ini. Setelahnya disimpan sebagai hash.
- `scope` di-echo dari yang divalidasi (intersect `OAUTH_SCOPES`).
- OpenWebUI me-parse respons ini ke `OAuthClientInformationFull` dan nge-override `issuer`/`resource` dari metadata sendiri — jadi kita cukup kasih field standar.

### 4.5 Error mapping

| Kondisi | Status | Error |
|---|---|---|
| Token gak ada / invalid | 401 | `unauthorized` |
| Body invalid / `redirect_uris` kosong | 400 | `invalid_request` |
| redirect_uri gak cocok token | 403 | `invalid_redirect_uri` |
| grant/response type invalid | 400 | `invalid_request` |
| scope di luar `OAUTH_SCOPES` | 400 | `invalid_scope` |
| Token udah kepake | 409 | `client_already_registered` |

---

## 5. Registry-only — ubah `authorize`, `token`, `revoke`

### 5.1 Shared helper `resolveClient(clientId)`

```
resolveClient(clientId):
  record = getJSON(oauthKeys.client(clientId))   // Valkey
  if record: return { source: "dynamic", ...record }
  return null                                    // NO static fallback
```

**Registry-only**: kalau `client_id` gak ada di Valkey → `invalid_client` 401. `OAUTH_CLIENT_ID` / `OAUTH_REDIRECT_URIS` env lama **tidak dipakai lagi** di route OAuth.

### 5.2 `authorize/route.ts`

Sekarang (baris 18, 57-65): cek `client_id === env.OAUTH_CLIENT_ID`, redirect_uri ∈ `env.OAUTH_REDIRECT_URIS`.

Jadi:
```js
const client = await resolveClient(client_id)
if (!client) → 401 invalid_client
if (!client.redirectUris.includes(redirect_uri)) → 400 invalid_request (redirect not allowed)
// scope: intersect client.scope dengan yang diminta
```

### 5.3 `token/route.ts`

Sekarang (baris 73-81): cek `client_id === env.OAUTH_CLIENT_ID` + `client_secret === env.OAUTH_CLIENT_SECRET`.

Jadi:
```js
const client = await resolveClient(client_id)
if (!client) → 401 invalid_client
if (client.tokenEndpointAuthMethod !== "none"):
  if (!client.secretHash || !timingSafeEqual(hash(client_secret), client.secretHash)) → 401
```

### 5.4 `revoke/route.ts`

Sama kayak token: resolve dari registry, validasi secret (kalau bukan `none`).

### 5.5 Konsekuensi migrasi (penting)

Breaking change (aman, belum rilis). **Semua client aktif harus didaftarin ulang via DCR** setelah fitur deploy. OpenWebUI punya auto re-registration (`_preflight_authorization_url` → `register_client`), jadi migrasi mostly otomatis di sisinya. Client lain perlu register manual.

`OAUTH_REDIRECT_URIS` env jadi tidak dipakai di authorize — allowlist redirect pindah ke `OAUTH_REGISTERED_CLIENTS`. Ini mesti jelas di PRD.

---

## 6. `DELETE /api/oauth/register/{client_id}`

Cabut akses client. Auth via **registration token** (dari env), bukan `client_secret` — biar admin cabut app tanpa tau secret client.

```
DELETE /api/oauth/register/{client_id}
Authorization: Bearer <registration-token>
```

Validasi:
1. Token valid (ada di `OAUTH_REGISTERED_CLIENTS`) → else `401`
2. `{client_id}` ada di Valkey → else `404`
3. **Client milik token itu** — `client.registrationTokenId === token.id` → else `403` (biar satu token gak hapus punya token lain)
4. `delKey(client_id)` → `204 No Content`

---

## 7. Env Config

### 7.1 Format `OAUTH_REGISTERED_CLIENTS`

Entry dipisah `;`, field dipisah `|`, format `name|token|redirect_uri`:

```env
OAUTH_REGISTERED_CLIENTS="StartGPT|sp_abc123|http://localhost:8080/oauth/clients/mcp:searchpoint/callback;Claude Desktop|cd_def456|https://claude.ai/oauth/callback"
```

- `name` — label app (boleh spasi, TIDAK boleh berisi `|` atau `;`). Dipakai buat `client_name` & consent screen.
- `token` — registration token app ini. Harus dibawa di `Authorization: Bearer` pas register.
- `redirect_uri` — satu redirect URI yang diizinkan app ini (anchor anti-spoof).

Parsing di `oauth-dcr.ts:parseClientsEnv()`:
- Split `;` → entries
- Tiap entry split `|` → `[name, token, redirect_uri]`
- Kalau malformed → throw (fail-fast di startup, biar typo env ketahuan)

### 7.2 Env baru

```
OAUTH_REGISTERED_CLIENTS=...              # daftar app yang boleh daftar
OAUTH_SCOPES="openid search"              # scopes yang boleh diminta (default "openid search")
```

`OAUTH_SCOPES` replace kebutuhan scopes dari hardcoded. Default `openid search` biar backward-compatible dgn scope yang dipakai sekarang.

### 7.3 Env yang tidak dipakai lagi di route OAuth

`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URIS` — jadi dead di `authorize`/`token`/`revoke`. Cek pemakaian (dilakukan saat review): ketiganya cuma dipakai di 3 route OAuth tersebut, tidak di tempat lain. Keputusan: **hapus dari `env.ts`** beserta validasinya. Ini aman karena belum rilis.

---

## 8. Edge Cases & Keamanan

| Kasus | Behavior |
|---|---|
| Token daftar 2x, redirect_uri sama | `409 client_already_registered` |
| Token dipake, client di-DELETE, token dipake lagi | Boleh daftar lagi (client_id baru) |
| `redirect_uri` mengandung `#` | Ditolak (sama authorize sekarang) |
| `redirect_uri` bukan https / bukan loopback http | Ditolak (RFC 8252) |
| Body minta scope di luar `OAUTH_SCOPES` | `400 invalid_scope` |
| `grant_types` kosong | Default `authorization_code` |
| `token_endpoint_auth_method: none` | Gak generate secret, `secretHash` kosong |
| Valkey bocor | `secretHash` sha256 — secret client tidak bocor plaintext |
| Satu token hapus client punya token lain | `403` — dicek via `registrationTokenId` |
| `OAUTH_REGISTERED_CLIENTS` malformed | Fail-fast di startup (parse error) |

---

## 9. Testing

### 9.1 Unit — `src/lib/oauth-dcr.test.ts`
- `parseClientsEnv` — parse valid, entry ganda, malformed throws
- `validateMetadata` — valid/invalid grant_types, response_types, token_endpoint_auth_method, scope
- `generateClientId` / `generateClientSecret` — prefix & format
- `hashSecret` — deterministic sha256
- `resolveClient` — (mock valkey) dynamic record / null

### 9.2 Route — `src/app/api/oauth/register/route.test.ts`
- `POST`: valid → 201 + client_id/secret; invalid/missing token → 401; redirect_uri mismatch → 403; invalid grant → 400; invalid scope → 400; duplicate → 409
- `DELETE`: valid → 204; invalid token → 401; not found → 404; client milik token lain → 403

### 9.3 Regresi — update route.test.ts yang ada
- `authorize/route.test.ts` — dari static env ke resolveClient (mock valkey)
- `token/route.test.ts` — client_secret validasi dari registry
- `revoke/route.test.ts` — sama
- Full suite + lint + typecheck

---

## 10. Keputusan yang sudah diambil saat review

1. `OAUTH_CLIENT_ID` / `OAUTH_REDIRECT_URIS` / `OAUTH_CLIENT_SECRET` — **hapus dari `env.ts`** (cuma dipakai di 3 route OAuth yang diubah; belum rilis, aman).
2. Format `name|token|redirect_uri` separator `|` — **dipakai** (readable, jarang ada `|` di URI/token yang kita generate).
