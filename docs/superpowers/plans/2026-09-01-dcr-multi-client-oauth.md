# DCR (Dynamic Client Registration) Multi-Client OAuth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memungkinkan banyak OAuth client (Open WebUI, Claude Desktop, dll) daftar ke SearchPoint via Dynamic Client Registration (RFC 7591), terkontrol lewat env allowlist + registration token per-app, dan `authorize`/`token`/`revoke` baca client dari Valkey registry (registry-only).

**Architecture:** `POST /api/oauth/register` validasi `Authorization: Bearer <registration-token>` + anchor `redirect_uri` dari env `OAUTH_REGISTERED_CLIENTS`, generate `client_id`/`client_secret`, simpan di Valkey (`oauthKeys.client(id)`, secret di-hash). `authorize`/`token`/`revoke` pakai `resolveClient()` dari registry. `DELETE /register/{id}` untuk cabut akses. Advertise `registration_endpoint` di discovery metadata.

**Tech Stack:** Next.js 15.5 App Router, TypeScript, Redis/Valkey (via `redis` package), Zod (env), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-01-dcr-multi-client-oauth-design.md`

## Global Constraints

- **Format env:** `OAUTH_REGISTERED_CLIENTS` = entry dipisah `;`, field dipisah `|`: `name|token|redirect_uri`. Name TIDAK boleh berisi `|`/`;`. Malformed → fail-fast di startup.
- **Anchor:** `redirect_uri` exact-match entry token. `client_name` TIDAK dicek sebagai anchor — cuma disimpan buat tampilan.
- **Registry-only:** `authorize`/`token`/`revoke` TIDAK lagi pakai `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`/`OAUTH_REDIRECT_URIS`. Client harus ada di Valkey, else `invalid_client` 401.
- **Secret:** disimpan sebagai `secretHash` (sha256 hex), bukan plaintext. `client_secret` plaintext cuma muncul sekali di respons `POST /register`.
- **Scope:** `OAUTH_SCOPES` default `openid search`. Scope yang diminta harus ⊆ `OAUTH_SCOPES`, else `400 invalid_scope`.
- **redirect_uri rules** (dari authorize): harus `https://` atau loopback `http://` (RFC 8252, `localhost`/`127.0.0.1`/`[::1]`), TIDAK boleh mengandung `#`.
- **Status codes:** `401 unauthorized`, `400 invalid_request`/`invalid_scope`, `403 invalid_redirect_uri`, `404`, `409 client_already_registered`, `201` sukses register, `204` sukses delete.
- **Valkey TTL:** client records non-expiring via `setPersistent` (helper baru di `oauth-valkey.ts`). State/code/at/rt TTL tetap seperti sekarang.
- **Test framework:** Vitest, pola hoisted mock (`vi.hoisted` + `vi.mock`) seperti test OAuth yang ada.

---

### Task 1: Env baru + helper parsing `oauth-dcr.ts`

**Files:**
- Modify: `src/lib/env.ts`
- Create: `src/lib/oauth-dcr.ts`
- Test: `src/lib/oauth-dcr.test.ts`

**Interfaces:**
- Consumes: `env` dari `@/lib/env` (zod schema)
- Produces:
  - `type RegisteredClient = { name: string; token: string; redirectUri: string }`
  - `type ParsedClientsEnv = { clients: RegisteredClient[]; byToken: Map<string, RegisteredClient> }`
  - `parseClientsEnv(raw: string): ParsedClientsEnv` — throws `Error` kalau malformed
  - `resolveRegisteredToken(token: string): RegisteredClient | null` — lookup token dari env
  - `validateMetadata(body: unknown): { redirectUris: string[]; grantTypes: string[]; responseTypes: string[]; tokenEndpointAuthMethod: string; scope?: string; clientName?: string }` — throws dengan error code
  - `generateClientId(): string` → `searchpoint-mcp-<random base64url>`
  - `generateClientSecret(): string` → random base64url
  - `hashSecret(secret: string): string` → sha256 hex
  - `OAUTH_SCOPES` export dari env (`string`, default `"openid search"`)

- [ ] **Step 1: Write the failing test** — `src/lib/oauth-dcr.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import {
  parseClientsEnv,
  resolveRegisteredToken,
  validateMetadata,
  generateClientId,
  generateClientSecret,
  hashSecret,
} from "@/lib/oauth-dcr";

const VALID_RAW =
  "StartGPT|sp_abc123|http://localhost:8080/oauth/clients/mcp:searchpoint/callback;" +
  "Claude Desktop|cd_def456|https://claude.ai/oauth/callback";

describe("parseClientsEnv", () => {
  it("parses multiple entries with name, token, redirect_uri", () => {
    const { clients } = parseClientsEnv(VALID_RAW);
    expect(clients).toHaveLength(2);
    expect(clients[0]).toEqual({
      name: "StartGPT",
      token: "sp_abc123",
      redirectUri: "http://localhost:8080/oauth/clients/mcp:searchpoint/callback",
    });
    expect(clients[1].name).toBe("Claude Desktop");
  });

  it("builds a byToken lookup", () => {
    const { byToken } = parseClientsEnv(VALID_RAW);
    expect(byToken.get("sp_abc123")?.redirectUri).toContain("mcp:searchpoint");
    expect(byToken.get("cd_def456")?.name).toBe("Claude Desktop");
  });

  it("throws on malformed entry (missing fields)", () => {
    expect(() => parseClientsEnv("StartGPT|sp_abc123")).toThrow();
    expect(() => parseClientsEnv("StartGPT||http://x")).toThrow();
    expect(() => parseClientsEnv("|sp_abc123|http://x")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => parseClientsEnv("")).toThrow();
  });
});

describe("resolveRegisteredToken", () => {
  it("returns the matching registered client", () => {
    expect(resolveRegisteredToken("sp_abc123")?.name).toBe("StartGPT");
  });

  it("returns null for unknown token", () => {
    expect(resolveRegisteredToken("nope")).toBeNull();
  });
});

describe("validateMetadata", () => {
  const base = { redirect_uris: ["http://localhost:8080/cb"] };

  it("accepts valid minimal metadata", () => {
    const out = validateMetadata({ ...base });
    expect(out.redirectUris).toEqual(["http://localhost:8080/cb"]);
    expect(out.grantTypes).toEqual(["authorization_code"]);
    expect(out.responseTypes).toEqual(["code"]);
    expect(out.tokenEndpointAuthMethod).toBe("client_secret_post");
  });

  it("rejects non-https / non-loopback redirect_uri", () => {
    expect(() => validateMetadata({ redirect_uris: ["http://evil.example/cb"] })).toThrow(/redirect_uri/i);
  });

  it("rejects redirect_uri with fragment", () => {
    expect(() => validateMetadata({ redirect_uris: ["https://cb.example/cb#x"] })).toThrow(/redirect_uri/i);
  });

  it("rejects empty redirect_uris", () => {
    expect(() => validateMetadata({ redirect_uris: [] })).toThrow(/redirect_uri/i);
  });

  it("rejects invalid grant_types", () => {
    expect(() => validateMetadata({ ...base, grant_types: ["client_credentials"] })).toThrow(/grant/i);
  });

  it("rejects invalid response_types", () => {
    expect(() => validateMetadata({ ...base, response_types: ["token"] })).toThrow(/response/i);
  });

  it("rejects invalid token_endpoint_auth_method", () => {
    expect(() => validateMetadata({ ...base, token_endpoint_auth_method: "client_secret_jwt" })).toThrow(/auth_method/i);
  });

  it("rejects scope outside allowed set", () => {
    expect(() => validateMetadata({ ...base, scope: "openid admin" })).toThrow(/scope/i);
  });

  it("accepts scope inside allowed set", () => {
    const out = validateMetadata({ ...base, scope: "openid search" });
    expect(out.scope).toBe("openid search");
  });
});

describe("generateClientId / generateClientSecret / hashSecret", () => {
  it("generateClientId has searchpoint-mcp- prefix", () => {
    expect(generateClientId()).toMatch(/^searchpoint-mcp-/);
  });

  it("generateClientSecret returns non-empty string", () => {
    expect(generateClientSecret().length).toBeGreaterThan(16);
  });

  it("hashSecret is deterministic sha256 hex", () => {
    const a = hashSecret("s3cret");
    const b = hashSecret("s3cret");
    expect(a).toBe(b);
    expect(a).toBe(createHash("sha256").update("s3cret").digest("hex"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/lib/oauth-dcr.test.ts -v`
Expected: FAIL — `Cannot find module '@/lib/oauth-dcr'`

- [ ] **Step 3: Add env vars ke `src/lib/env.ts`**

Tambahkan ke schema (di area OAuth):

```ts
OAUTH_REGISTERED_CLIENTS: z.preprocess((val) => {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional()),
OAUTH_SCOPES: z.string().optional().default("openid search"),
```

**Catatan:** JANGAN hapus `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`/`OAUTH_REDIRECT_URIS` di task ini — masih dipakai route sampai Task 4-6 selesai. Hapus di Task 7.

- [ ] **Step 4: Implement `src/lib/oauth-dcr.ts`**

```ts
import { createHash, randomBytes } from "crypto";

import { env } from "@/lib/env";

export type RegisteredClient = {
  name: string;
  token: string;
  redirectUri: string;
};

export type ParsedClientsEnv = {
  clients: RegisteredClient[];
  byToken: Map<string, RegisteredClient>;
};

export function parseClientsEnv(raw: string): ParsedClientsEnv {
  const clients: RegisteredClient[] = [];
  const byToken = new Map<string, RegisteredClient>();
  const entries = raw.split(";").filter((e) => e.trim() !== "");
  if (entries.length === 0) throw new Error("OAUTH_REGISTERED_CLIENTS is empty");
  for (const entry of entries) {
    const parts = entry.split("|");
    if (parts.length !== 3 || !parts[0].trim() || !parts[1].trim() || !parts[2].trim()) {
      throw new Error(`Malformed OAUTH_REGISTERED_CLIENTS entry: "${entry}"`);
    }
    const rc: RegisteredClient = {
      name: parts[0].trim(),
      token: parts[1].trim(),
      redirectUri: parts[2].trim(),
    };
    clients.push(rc);
    byToken.set(rc.token, rc);
  }
  return { clients, byToken };
}

let parsed: ParsedClientsEnv | null = null;

function getParsed(): ParsedClientsEnv {
  if (!parsed) parsed = parseClientsEnv(env.OAUTH_REGISTERED_CLIENTS ?? "");
  return parsed;
}

export function resolveRegisteredToken(token: string): RegisteredClient | null {
  return getParsed().byToken.get(token) ?? null;
}

export const ALLOWED_GRANT_TYPES = ["authorization_code", "refresh_token"];
export const ALLOWED_RESPONSE_TYPES = ["code"];
export const ALLOWED_AUTH_METHODS = ["none", "client_secret_basic", "client_secret_post"];

function isLoopbackHttp(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol !== "http:") return false;
    return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch {
    return false;
  }
}

function assertValidRedirectUri(uri: string): void {
  if (!uri || uri.includes("#")) {
    throw new Error("invalid redirect_uri");
  }
  const ok = uri.startsWith("https://") || isLoopbackHttp(uri);
  if (!ok) throw new Error("invalid redirect_uri");
}

export function validateMetadata(body: unknown): {
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  scope?: string;
  clientName?: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("invalid_request");
  }
  const b = body as Record<string, unknown>;
  const redirectUrisRaw = b.redirect_uris;
  if (!Array.isArray(redirectUrisRaw) || redirectUrisRaw.length === 0) {
    throw new Error("invalid redirect_uri");
  }
  const redirectUris = redirectUrisRaw.map(String);
  for (const uri of redirectUris) assertValidRedirectUri(uri);

  const grantTypesRaw = Array.isArray(b.grant_types) ? (b.grant_types as unknown[]).map(String) : ["authorization_code"];
  for (const g of grantTypesRaw) {
    if (!ALLOWED_GRANT_TYPES.includes(g)) throw new Error("invalid grant_types");
  }

  const responseTypesRaw = Array.isArray(b.response_types) ? (b.response_types as unknown[]).map(String) : ["code"];
  for (const r of responseTypesRaw) {
    if (!ALLOWED_RESPONSE_TYPES.includes(r)) throw new Error("invalid response_types");
  }

  const authMethod =
    typeof b.token_endpoint_auth_method === "string" ? b.token_endpoint_auth_method : "client_secret_post";
  if (!ALLOWED_AUTH_METHODS.includes(authMethod)) throw new Error("invalid token_endpoint_auth_method");

  let scope: string | undefined;
  const scopeRaw = typeof b.scope === "string" ? b.scope : undefined;
  if (scopeRaw !== undefined) {
    const requested = scopeRaw.split(/[\s,]+/).filter(Boolean);
    const allowed = env.OAUTH_SCOPES.split(/[\s,]+/).filter(Boolean);
    for (const s of requested) {
      if (!allowed.includes(s)) throw new Error("invalid scope");
    }
    scope = requested.join(" ");
  }

  const clientName = typeof b.client_name === "string" && b.client_name.trim() ? b.client_name.trim() : undefined;

  return {
    redirectUris,
    grantTypes: grantTypesRaw,
    responseTypes: responseTypesRaw,
    tokenEndpointAuthMethod: authMethod,
    scope,
    clientName,
  };
}

export function generateClientId(): string {
  return `searchpoint-mcp-${randomBytes(9).toString("base64url")}`;
}

export function generateClientSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- src/lib/oauth-dcr.test.ts -v`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/env.ts src/lib/oauth-dcr.ts src/lib/oauth-dcr.test.ts
git commit -m "feat: DCR env config + pure helpers (parse/validate/generate)"
```

---

### Task 2: Valkey client registry key + `resolveClient`

**Files:**
- Modify: `src/lib/oauth-valkey.ts`
- Create: `src/lib/oauth-dcr-store.ts`
- Test: `src/lib/oauth-dcr-store.test.ts`

**Interfaces:**
- Consumes: `oauthKeys` dari `@/lib/oauth-valkey`, `getJSON`/`setWithTTL`/`delKey` dari `@/lib/oauth-valkey`, `hashSecret` dari `@/lib/oauth-dcr`
- Produces:
  - `type ClientRecord = { id: string; name?: string; secretHash?: string; redirectUris: string[]; scope?: string; tokenEndpointAuthMethod: string; registrationTokenId: string; createdAt: number }`
  - `registerClient(input: { id: string; name?: string; secret?: string; redirectUris: string[]; scope?: string; tokenEndpointAuthMethod: string; registrationTokenId: string }): Promise<void>` — set non-expiring record di `oauthKeys.client(id)` dengan `secretHash` (via `setPersistent`)
  - `resolveClient(clientId: string): Promise<ClientRecord | null>`
  - `deleteClient(clientId: string): Promise<void>`
  - `clientExists(clientId: string): Promise<boolean>`
  - `getClientByTokenRegistration(tokenId: string): Promise<string[]>` — daftar client_id milik satu registration token (buat cek `409`)

**Ruling from ledger (pre-flight):** gunakan `setPersistent(key, value)` helper baru di `oauth-valkey.ts` untuk non-expiring record — bukan `setWithTTL(..., undefined)` (yang di memory-fallback langsung kehapus karena `setTimeout(undefined)` = 0ms). Helper ini akan dibuat di Step 3 Task 2 ini juga.

- [ ] **Step 1: Write the failing test** — `src/lib/oauth-dcr-store.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";

const { mockGetJSON, mockSetPersistent, mockDelKey } = vi.hoisted(() => ({
  mockGetJSON: vi.fn(),
  mockSetPersistent: vi.fn(async () => {}),
  mockDelKey: vi.fn(async () => {}),
}));

vi.mock("@/lib/oauth-valkey", () => ({
  getJSON: mockGetJSON,
  setWithTTL: vi.fn(async () => {}),
  setPersistent: mockSetPersistent,
  delKey: mockDelKey,
  oauthKeys: {
    client: (id: string) => `oauth:client:${id}`,
  },
}));

vi.mock("@/lib/oauth-dcr", () => ({
  hashSecret: (s: string) => `hash(${s})`,
}));

import {
  registerClient,
  resolveClient,
  deleteClient,
  clientExists,
  getClientByTokenRegistration,
} from "@/lib/oauth-dcr-store";

const record = {
  id: "searchpoint-mcp-a1b2c3",
  name: "Open WebUI",
  secretHash: "hash(sekret)",
  redirectUris: ["http://localhost:8080/cb"],
  scope: "openid search",
  tokenEndpointAuthMethod: "client_secret_post",
  registrationTokenId: "sp_abc123",
  createdAt: 1000,
};

describe("registerClient", () => {
  it("stores a hashed client record persistently", async () => {
    await registerClient({
      id: record.id,
      name: record.name,
      secret: "sekret",
      redirectUris: record.redirectUris,
      scope: record.scope,
      tokenEndpointAuthMethod: record.tokenEndpointAuthMethod,
      registrationTokenId: record.registrationTokenId,
    });
    expect(mockSetPersistent).toHaveBeenCalledWith(
      "oauth:client:searchpoint-mcp-a1b2c3",
      expect.objectContaining({
        secretHash: "hash(sekret)",
        registrationTokenId: "sp_abc123",
      }),
    );
  });
});

describe("resolveClient", () => {
  it("returns record when found", async () => {
    mockGetJSON.mockResolvedValue(record);
    await expect(resolveClient("searchpoint-mcp-a1b2c3")).resolves.toEqual(record);
  });

  it("returns null when not found", async () => {
    mockGetJSON.mockResolvedValue(null);
    await expect(resolveClient("nope")).resolves.toBeNull();
  });
});

describe("deleteClient / clientExists / getClientByTokenRegistration", () => {
  it("deleteClient calls delKey", async () => {
    await deleteClient("searchpoint-mcp-a1b2c3");
    expect(mockDelKey).toHaveBeenCalledWith("oauth:client:searchpoint-mcp-a1b2c3");
  });

  it("clientExists true when record found", async () => {
    mockGetJSON.mockResolvedValue(record);
    await expect(clientExists("searchpoint-mcp-a1b2c3")).resolves.toBe(true);
  });

  it("getClientByTokenRegistration returns client ids for a token", async () => {
    mockGetJSON.mockImplementation(async (key: string) =>
      key === "oauth:client:searchpoint-mcp-a1b2c3" ? record : null,
    );
    const ids = await getClientByTokenRegistration("sp_abc123");
    expect(ids).toContain("searchpoint-mcp-a1b2c3");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/lib/oauth-dcr-store.test.ts -v`
Expected: FAIL — cannot find module

- [ ] **Step 3: Add `client` key + `setPersistent` helper ke `src/lib/oauth-valkey.ts`**

Tambahkan key ke objek `oauthKeys`:

```ts
client: (id: string) => `oauth:client:${id}`,
```

Tambahkan helper `setPersistent` (set tanpa TTL — non-expiring, dipakai buat client records yang harus persist):

```ts
export async function setPersistent(key: string, value: unknown) {
  const c = await getOAuthValkey();
  if (!c) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    memory.set(key, JSON.stringify(value));
    // no setTimeout — key persists until process exits
    return;
  }
  await c.set(key, JSON.stringify(value));
}
```

- [ ] **Step 4: Implement `src/lib/oauth-dcr-store.ts`**

```ts
import { hashSecret } from "@/lib/oauth-dcr";
import { delKey, getJSON, oauthKeys, setPersistent } from "@/lib/oauth-valkey";

export type ClientRecord = {
  id: string;
  name?: string;
  secretHash?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
  createdAt: number;
};

export async function registerClient(input: {
  id: string;
  name?: string;
  secret?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
}): Promise<void> {
  const record: ClientRecord = {
    id: input.id,
    name: input.name,
    secretHash: input.secret ? hashSecret(input.secret) : undefined,
    redirectUris: input.redirectUris,
    scope: input.scope,
    tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
    registrationTokenId: input.registrationTokenId,
    createdAt: Math.floor(Date.now() / 1000),
  };
  // Non-expiring client record (persistent across restarts).
  await setPersistent(oauthKeys.client(input.id), record);
}

export async function resolveClient(clientId: string): Promise<ClientRecord | null> {
  return getJSON<ClientRecord>(oauthKeys.client(clientId));
}

export async function deleteClient(clientId: string): Promise<void> {
  await delKey(oauthKeys.client(clientId));
}

export async function clientExists(clientId: string): Promise<boolean> {
  return (await resolveClient(clientId)) !== null;
}

// Replaced with real index in Task 3. Stub for now.
export async function getClientByTokenRegistration(_tokenId: string): Promise<string[]> {
  return [];
}
```

**Catatan:** `getClientByTokenRegistration` di task ini cuma stub (return `[]`). Implementasi penuh pakai registration index ada di Task 3. Kalau plan dijalankan task-by-task, ini yang diharapkan.

- [ ] **Step 5: Update test untuk fungsi yang benar-benar diimplementasi**

Hapus test `getClientByTokenRegistration` dari file test (dipindah ke Task 3), biar suite task ini hijau:

```ts
// Hapus blok "getClientByTokenRegistration returns client ids for a token"
// dan import getClientByTokenRegistration dari test.
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bun run test -- src/lib/oauth-dcr-store.test.ts -v`
Expected: ALL PASS (setelah hapus test stub)

- [ ] **Step 7: Commit**

```bash
git add src/lib/oauth-valkey.ts src/lib/oauth-dcr-store.ts src/lib/oauth-dcr-store.test.ts
git commit -m "feat: valkey client registry (resolveClient/registerClient/deleteClient)"
```

---

### Task 3: Registration index (cek duplikat token) + update store

**Files:**
- Modify: `src/lib/oauth-dcr-store.ts`
- Modify: `src/lib/oauth-dcr-store.test.ts`
- Modify: `src/lib/oauth-valkey.ts`

**Interfaces:**
- Consumes: `oauthKeys` dari `@/lib/oauth-valkey` (perlu index key baru)
- Produces:
  - `registerClient(input)` — sekarang JUGA nulis index `oauthKeys.clientByToken(tokenId)` berisi array client_id
  - `getClientByTokenRegistration(tokenId: string): Promise<string[]>` — baca index
  - `deleteClient(clientId)` — juga hapus client_id dari index token-nya

- [ ] **Step 1: Add `clientByToken` key ke `src/lib/oauth-valkey.ts`**

```ts
client: (id: string) => `oauth:client:${id}`,
clientByToken: (tokenId: string) => `oauth:client:bytoken:${tokenId}`,
```

- [ ] **Step 2: Write the failing test** — tambahkan ke `oauth-dcr-store.test.ts`

```ts
const mockGetJSONForIndex = vi.fn(async (key: string) => {
  if (key === "oauth:client:bytoken:sp_abc123") return ["searchpoint-mcp-a1b2c3"];
  return record;
});

it("getClientByTokenRegistration reads the token index", async () => {
  mockGetJSON.mockImplementation(mockGetJSONForIndex);
  const ids = await getClientByTokenRegistration("sp_abc123");
  expect(ids).toEqual(["searchpoint-mcp-a1b2c3"]);
});

it("deleteClient removes id from the token index", async () => {
  mockGetJSON.mockImplementation(async (key: string) =>
    key === "oauth:client:bytoken:sp_abc123" ? ["searchpoint-mcp-a1b2c3", "other"] : null,
  );
  await deleteClient("searchpoint-mcp-a1b2c3");
  // setPersistent called with updated index (without the deleted id)
  const calls = mockSetPersistent.mock.calls.filter((c) => String(c[0]).includes("bytoken"));
  expect(calls.length).toBeGreaterThan(0);
  expect(calls[0][1]).toEqual(["other"]);
});
```

- [ ] **Step 3: Implement index di `src/lib/oauth-dcr-store.ts`**

Ganti implementasi `registerClient` (tambah index write) dan `deleteClient` (hapus dari index), serta `getClientByTokenRegistration`:

```ts
import { delKey, getJSON, oauthKeys, setPersistent } from "@/lib/oauth-valkey";
import { hashSecret } from "@/lib/oauth-dcr";

export type ClientRecord = {
  id: string;
  name?: string;
  secretHash?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
  createdAt: number;
};

export async function registerClient(input: {
  id: string;
  name?: string;
  secret?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
}): Promise<void> {
  const record: ClientRecord = {
    id: input.id,
    name: input.name,
    secretHash: input.secret ? hashSecret(input.secret) : undefined,
    redirectUris: input.redirectUris,
    scope: input.scope,
    tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
    registrationTokenId: input.registrationTokenId,
    createdAt: Math.floor(Date.now() / 1000),
  };
  await setPersistent(oauthKeys.client(input.id), record);

  // Maintain per-token index for duplicate-registration detection.
  const indexKey = oauthKeys.clientByToken(input.registrationTokenId);
  const existing = (await getJSON<string[]>(indexKey)) ?? [];
  await setPersistent(indexKey, [...new Set([...existing, input.id])]);
}

export async function resolveClient(clientId: string): Promise<ClientRecord | null> {
  return getJSON<ClientRecord>(oauthKeys.client(clientId));
}

export async function deleteClient(clientId: string): Promise<void> {
  const record = await resolveClient(clientId);
  if (record) {
    const indexKey = oauthKeys.clientByToken(record.registrationTokenId);
    const existing = (await getJSON<string[]>(indexKey)) ?? [];
    const next = existing.filter((id) => id !== clientId);
    if (next.length > 0) {
      await setPersistent(indexKey, next);
    } else {
      await delKey(indexKey);
    }
  }
  await delKey(oauthKeys.client(clientId));
}

export async function clientExists(clientId: string): Promise<boolean> {
  return (await resolveClient(clientId)) !== null;
}

export async function getClientByTokenRegistration(tokenId: string): Promise<string[]> {
  return (await getJSON<string[]>(oauthKeys.clientByToken(tokenId))) ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/lib/oauth-dcr-store.test.ts -v`
Expected: ALL PASS (termasuk test index)

- [ ] **Step 5: Commit**

```bash
git add src/lib/oauth-valkey.ts src/lib/oauth-dcr-store.ts src/lib/oauth-dcr-store.test.ts
git commit -m "feat: registration token index for duplicate detection"
```

---

### Task 4: `POST /api/oauth/register` (DCR endpoint)

**Files:**
- Create: `src/app/api/oauth/register/route.ts`
- Test: `src/app/api/oauth/register/route.test.ts`

**Interfaces:**
- Consumes: `resolveRegisteredToken` + `validateMetadata` + `generateClientId` + `generateClientSecret` dari `@/lib/oauth-dcr`; `registerClient` + `getClientByTokenRegistration` dari `@/lib/oauth-dcr-store`
- Produces: `POST` handler untuk `/api/oauth/register` — 201 + RFC 7591 body, atau error mapped

- [ ] **Step 1: Write the failing test** — `src/app/api/oauth/register/route.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockResolveToken, mockValidate, mockGenId, mockGenSecret, mockRegister, mockGetByToken } = vi.hoisted(() => ({
  mockResolveToken: vi.fn(),
  mockValidate: vi.fn(),
  mockGenId: vi.fn(() => "searchpoint-mcp-a1b2c3"),
  mockGenSecret: vi.fn(() => "sekret-abc"),
  mockRegister: vi.fn(async () => {}),
  mockGetByToken: vi.fn(async () => []),
}));

vi.mock("@/lib/oauth-dcr", () => ({
  resolveRegisteredToken: mockResolveToken,
  validateMetadata: mockValidate,
  generateClientId: mockGenId,
  generateClientSecret: mockGenSecret,
  hashSecret: vi.fn((s: string) => `hash(${s})`),
}));

vi.mock("@/lib/oauth-dcr-store", () => ({
  registerClient: mockRegister,
  getClientByTokenRegistration: mockGetByToken,
  resolveClient: vi.fn(),
  clientExists: vi.fn(),
  deleteClient: vi.fn(),
}));

import { POST } from "@/app/api/oauth/register/route";

const validClient = {
  redirectUris: ["http://localhost:8080/oauth/clients/mcp:searchpoint/callback"],
  grantTypes: ["authorization_code", "refresh_token"],
  responseTypes: ["code"],
  tokenEndpointAuthMethod: "client_secret_post",
  clientName: "Open WebUI",
  scope: "openid search",
};

function regReq(token: string | null, body: unknown) {
  return new Request("http://localhost:3000/api/oauth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/oauth/register", () => {
  beforeEach(() => {
    mockResolveToken.mockReset();
    mockValidate.mockReset();
    mockGenId.mockReset();
    mockGenSecret.mockReset();
    mockRegister.mockClear();
    mockGetByToken.mockClear();
    mockResolveToken.mockReturnValue({ name: "StartGPT", token: "sp_abc123", redirectUri: "http://localhost:8080/oauth/clients/mcp:searchpoint/callback" });
    mockValidate.mockReturnValue(validClient);
    mockGetByToken.mockResolvedValue([]);
  });

  it("returns 401 when token missing", async () => {
    const res = await POST(regReq(null, validClient) as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token invalid", async () => {
    mockResolveToken.mockReturnValue(null);
    const res = await POST(regReq("bad", validClient) as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("returns 403 when redirect_uri does not match token", async () => {
    mockValidate.mockReturnValue({ ...validClient, redirectUris: ["https://evil.example/cb"] });
    const res = await POST(regReq("sp_abc123", validClient) as unknown as Request);
    expect(res.status).toBe(403);
  });

  it("returns 400 when validateMetadata throws", async () => {
    mockValidate.mockImplementation(() => {
      throw new Error("invalid scope");
    });
    const res = await POST(regReq("sp_abc123", validClient) as unknown as Request);
    expect(res.status).toBe(400);
  });

  it("returns 409 when token already registered an active client", async () => {
    mockGetByToken.mockResolvedValue(["searchpoint-mcp-xyz"]);
    const res = await POST(regReq("sp_abc123", validClient) as unknown as Request);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "client_already_registered" });
  });

  it("registers and returns 201 with client credentials", async () => {
    const res = await POST(regReq("sp_abc123", validClient) as unknown as Request);
    expect(res.status).toBe(201);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.client_id).toBe("searchpoint-mcp-a1b2c3");
    expect(j.client_secret).toBe("sekret-abc");
    expect(j.redirect_uris).toEqual(validClient.redirectUris);
    expect(j.token_endpoint_auth_method).toBe("client_secret_post");
    expect(j.client_id_issued_at).toEqual(expect.any(Number));
    expect(j.client_secret_expires_at).toBe(0);
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "searchpoint-mcp-a1b2c3",
        secret: "sekret-abc",
        registrationTokenId: "sp_abc123",
      }),
    );
  });

  it("does not generate secret when token_endpoint_auth_method is none", async () => {
    mockValidate.mockReturnValue({ ...validClient, tokenEndpointAuthMethod: "none" });
    const res = await POST(regReq("sp_abc123", validClient) as unknown as Request);
    expect(res.status).toBe(201);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.client_secret).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/app/api/oauth/register/route.test.ts -v`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement `src/app/api/oauth/register/route.ts`**

```ts
import { NextResponse } from "next/server";

import {
  generateClientId,
  generateClientSecret,
  resolveRegisteredToken,
  validateMetadata,
} from "@/lib/oauth-dcr";
import {
  getClientByTokenRegistration,
  registerClient,
} from "@/lib/oauth-dcr-store";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const registered = resolveRegisteredToken(token);
  if (!registered) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let meta;
  try {
    meta = validateMetadata(body);
  } catch {
    // Map known validation errors to 400; redirect_uri mismatch handled below.
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (meta.redirectUris[0] !== registered.redirectUri) {
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 403 });
  }

  const existing = await getClientByTokenRegistration(token);
  if (existing.length > 0) {
    return NextResponse.json({ error: "client_already_registered" }, { status: 409 });
  }

  const clientId = generateClientId();
  const authMethod = meta.tokenEndpointAuthMethod;
  const clientSecret = authMethod === "none" ? undefined : generateClientSecret();

  await registerClient({
    id: clientId,
    name: meta.clientName ?? registered.name,
    secret: clientSecret,
    redirectUris: meta.redirectUris,
    scope: meta.scope,
    tokenEndpointAuthMethod: authMethod,
    registrationTokenId: token,
  });

  return NextResponse.json(
    {
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
      redirect_uris: meta.redirectUris,
      grant_types: meta.grantTypes,
      response_types: meta.responseTypes,
      token_endpoint_auth_method: authMethod,
      client_name: meta.clientName ?? registered.name,
      scope: meta.scope ?? "openid search",
    },
    { status: 201 },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/app/api/oauth/register/route.test.ts -v`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/register/route.ts src/app/api/oauth/register/route.test.ts
git commit -m "feat: POST /api/oauth/register (RFC 7591 DCR with token guard)"
```

---

### Task 5: `DELETE /api/oauth/register/{client_id}`

**Files:**
- Modify: `src/app/api/oauth/register/route.ts`
- Modify: `src/app/api/oauth/register/route.test.ts`

**Interfaces:**
- Consumes: `resolveRegisteredToken` dari `@/lib/oauth-dcr`; `deleteClient` + `resolveClient` dari `@/lib/oauth-dcr-store`
- Produces: `DELETE` handler di route yang sama — 204 / 401 / 404 / 403

- [ ] **Step 1: Write the failing test** — tambahkan ke `register/route.test.ts`

```ts
const { mockDeleteClient, mockResolveClient } = vi.hoisted(() => ({
  mockDeleteClient: vi.fn(async () => {}),
  mockResolveClient: vi.fn(),
}));
// tambahkan ke mock "@/lib/oauth-dcr-store":
//   deleteClient: mockDeleteClient,
//   resolveClient: mockResolveClient,

import { DELETE } from "@/app/api/oauth/register/route";

function delReq(token: string | null, clientId: string) {
  return new Request(`http://localhost:3000/api/oauth/register/${clientId}`, {
    method: "DELETE",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

it("DELETE returns 401 when token missing", async () => {
  const res = await DELETE(delReq(null, "searchpoint-mcp-a1b2c3") as unknown as Request);
  expect(res.status).toBe(401);
});

it("DELETE returns 404 when client not found", async () => {
  mockResolveToken.mockReturnValue({ name: "StartGPT", token: "sp_abc123", redirectUri: "..." });
  mockResolveClient.mockResolvedValue(null);
  const res = await DELETE(delReq("sp_abc123", "searchpoint-mcp-nope") as unknown as Request);
  expect(res.status).toBe(404);
});

it("DELETE returns 403 when client belongs to another token", async () => {
  mockResolveToken.mockReturnValue({ name: "StartGPT", token: "sp_abc123", redirectUri: "..." });
  mockResolveClient.mockResolvedValue({ id: "c", registrationTokenId: "cd_def456", redirectUris: [] } as never);
  const res = await DELETE(delReq("sp_abc123", "searchpoint-mcp-c") as unknown as Request);
  expect(res.status).toBe(403);
});

it("DELETE returns 204 and deletes when authorized", async () => {
  mockResolveToken.mockReturnValue({ name: "StartGPT", token: "sp_abc123", redirectUri: "..." });
  mockResolveClient.mockResolvedValue({ id: "searchpoint-mcp-a1b2c3", registrationTokenId: "sp_abc123", redirectUris: [] } as never);
  const res = await DELETE(delReq("sp_abc123", "searchpoint-mcp-a1b2c3") as unknown as Request);
  expect(res.status).toBe(204);
  expect(mockDeleteClient).toHaveBeenCalledWith("searchpoint-mcp-a1b2c3");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/app/api/oauth/register/route.test.ts -v`
Expected: FAIL — `DELETE` not exported

- [ ] **Step 3: Implement `DELETE` handler di `src/app/api/oauth/register/route.ts`**

```ts
import { deleteClient, getClientByTokenRegistration, registerClient, resolveClient } from "@/lib/oauth-dcr-store";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ client_id: string }> },
) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const registered = resolveRegisteredToken(token);
  if (!registered) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { client_id } = await params;
  const client = await resolveClient(client_id);
  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (client.registrationTokenId !== token) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await deleteClient(client_id);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/app/api/oauth/register/route.test.ts -v`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/register/route.ts src/app/api/oauth/register/route.test.ts
git commit -m "feat: DELETE /api/oauth/register/:client_id (revoke client)"
```

---

### Task 6: Registry-only — ubah `authorize`, `token`, `revoke`

**Files:**
- Modify: `src/app/api/oauth/authorize/route.ts`
- Modify: `src/app/api/oauth/token/route.ts`
- Modify: `src/app/api/oauth/revoke/route.ts`
- Modify: `src/app/api/oauth/authorize/route.test.ts`
- Modify: `src/app/api/oauth/token/route.test.ts`
- Modify: `src/app/api/oauth/revoke/route.test.ts`

**Interfaces:**
- Consumes: `resolveClient` dari `@/lib/oauth-dcr-store`; `hashSecret` dari `@/lib/oauth-dcr` (untuk compare secret)
- Produces: route yang validate client dari registry, bukan env statis

- [ ] **Step 1: Update authorize test — mock resolveClient**

Di `src/app/api/oauth/authorize/route.test.ts`, tambahkan mock:

```ts
const { mockResolveClient } = vi.hoisted(() => ({
  mockResolveClient: vi.fn(),
}));

vi.mock("@/lib/oauth-dcr-store", () => ({
  resolveClient: mockResolveClient,
}));
```

Tambahkan test case baru:

```ts
it("rejects unknown client (registry-only)", async () => {
  mockResolveClient.mockResolvedValue(null);
  const req = new Request(
    `https://example.com/api/oauth/authorize?response_type=code&client_id=unknown&redirect_uri=https://cb.example/cb&code_challenge=ch&code_challenge_method=S256&state=s1&scope=openid`,
  );
  const res = await GET(req as unknown as Request);
  expect(res.status).toBe(401);
});

it("rejects redirect_uri not in client registry", async () => {
  mockResolveClient.mockResolvedValue({
    id: "searchpoint-mcp-a1b2c3",
    redirectUris: ["http://localhost:8080/cb"],
    tokenEndpointAuthMethod: "client_secret_post",
  } as never);
  const req = new Request(
    `https://example.com/api/oauth/authorize?response_type=code&client_id=searchpoint-mcp-a1b2c3&redirect_uri=https://evil.example/cb&code_challenge=ch&code_challenge_method=S256&state=s1&scope=openid`,
  );
  const res = await GET(req as unknown as Request);
  expect(res.status).toBe(400);
});
```

**Perbaiki test yang ada:** semua test yang pakai `client_id=searchpoint-mcp-static` & `redirect_uri=https://cb.example/cb` harus di-update — mock `mockResolveClient` return record dengan `redirectUris: ["https://cb.example/cb"]`, dan `client_id` di URL pakai `searchpoint-mcp-a1b2c3`. `beforeEach` harus set `mockResolveClient.mockResolvedValue(...)` default yang cocok.

- [ ] **Step 2: Implement registry-only di `authorize/route.ts`**

Ubah bagian validasi client (baris 18 & 57-65):

```ts
import { resolveClient } from "@/lib/oauth-dcr-store";
// hapus import env kalau tidak dipakai lagi, cek dulu

// ... di GET, setelah ambil client_id & redirect_uri:

const client = await resolveClient(client_id);
if (!client) {
  return NextResponse.json({ error: "invalid_client" }, { status: 401 });
}
if (!client.redirectUris.includes(redirect_uri)) {
  return NextResponse.json(
    { error: "invalid_request", error_description: "redirect_uri not allowed" },
    { status: 400 },
  );
}
```

Hapus blok validasi `client_id !== env.OAUTH_CLIENT_ID` (baris 18-19) dan blok `allowedUris` (baris 57-65). Pastikan `redirect_uri` validation (https/loopback/#) yang ada SEBELUM resolveClient tetap dipertahankan — itu validasi format, bukan registry.

**Perhatian:** scope validation — tambahkan intersect dengan `client.scope`:

```ts
// setelah resolveClient sukses, sebelum setWithTTL state:
const requestedScope = scope.split(/[\s,]+/).filter(Boolean);
const allowedScope = (client.scope ?? "openid search").split(/[\s,]+/).filter(Boolean);
if (requestedScope.some((s) => !allowedScope.includes(s))) {
  return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
}
```

- [ ] **Step 3: Update token test — mock resolveClient**

Di `src/app/api/oauth/token/route.test.ts`, tambahkan mock `@/lib/oauth-dcr-store` dengan `resolveClient`. Update test yang ada: ganti `client_id=searchpoint-mcp-static` & `client_secret=secret123` → client dari registry dengan `secretHash`. `mockResolveClient` default:

```ts
mockResolveClient.mockResolvedValue({
  id: "searchpoint-mcp-a1b2c3",
  secretHash: "hash(secret123)",
  redirectUris: ["https://cb.example/cb"],
  tokenEndpointAuthMethod: "client_secret_post",
} as never);
```

Tambahkan test baru:

```ts
it("rejects unknown client", async () => {
  mockResolveClient.mockResolvedValue(null);
  // POST dengan client_id=unknown
  expect(res.status).toBe(401);
});

it("rejects wrong client_secret", async () => {
  mockResolveClient.mockResolvedValue({
    id: "searchpoint-mcp-a1b2c3",
    secretHash: "hash(sekret-lain)",
    redirectUris: ["https://cb.example/cb"],
    tokenEndpointAuthMethod: "client_secret_post",
  } as never);
  // POST dengan client_secret=secret123 (tidak match)
  expect(res.status).toBe(401);
});
```

- [ ] **Step 4: Implement registry-only di `token/route.ts`**

Ubah validasi client (baris 73-81):

```ts
import { hashSecret } from "@/lib/oauth-dcr";
import { resolveClient } from "@/lib/oauth-dcr-store";

// ganti blok:
// if (client_id !== env.OAUTH_CLIENT_ID) { ... }
// if (env.OAUTH_CLIENT_SECRET && !timingSafeEqualStr(...)) { ... }

const client = await resolveClient(client_id);
if (!client) {
  return NextResponse.json({ error: "invalid_client" }, { status: 401 });
}
if (client.tokenEndpointAuthMethod !== "none") {
  const secretOk =
    client.secretHash &&
    hashSecret(client_secret ?? "") === client.secretHash;
  if (!secretOk) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
}
```

Hapus import `timingSafeEqualStr` kalau tidak dipakai lagi.

- [ ] **Step 5: Update revoke test — mock resolveClient**

Di `src/app/api/oauth/revoke/route.test.ts`, tambahkan mock `@/lib/oauth-dcr-store` + `hashSecret`. Update test yang ada mirip token.

- [ ] **Step 6: Implement registry-only di `revoke/route.ts`**

Ubah validasi client (baris 30-38):

```ts
import { hashSecret } from "@/lib/oauth-dcr";
import { resolveClient } from "@/lib/oauth-dcr-store";

const client = await resolveClient(client_id);
if (!client) {
  return NextResponse.json({ error: "invalid_client" }, { status: 401 });
}
if (client.tokenEndpointAuthMethod !== "none") {
  const secretOk =
    client.secretHash &&
    hashSecret(client_secret ?? "") === client.secretHash;
  if (!secretOk) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
}
```

- [ ] **Step 7: Run all OAuth tests**

Run: `bun run test -- src/app/api/oauth`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/api/oauth/authorize src/app/api/oauth/token src/app/api/oauth/revoke
git commit -m "feat: authorize/token/revoke read clients from registry (registry-only)"
```

---

### Task 7: Hapus env statis + advertise `registration_endpoint`

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/app/.well-known/oauth-authorization-server/route.ts`
- Modify: `src/app/.well-known/oauth-authorization-server/route.test.ts`
- Modify: `.env.example`
- Modify: `.env`

**Interfaces:**
- Consumes: — (cleanup)
- Produces: metadata dengan `registration_endpoint`; env bersih tanpa `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`/`OAUTH_REDIRECT_URIS`

- [ ] **Step 1: Write the failing test** — update well-known route test

Di `src/app/.well-known/oauth-authorization-server/route.test.ts`, tambahkan:

```ts
it("advertises registration_endpoint", async () => {
  const res = await GET(new Request("https://example.com/.well-known/oauth-authorization-server"));
  const j = await res.json();
  expect(j.registration_endpoint).toBe("https://example.com/api/oauth/register");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/app/.well-known/oauth-authorization-server/route.test.ts -v`
Expected: FAIL — `registration_endpoint` undefined

- [ ] **Step 3: Advertise `registration_endpoint` di metadata route**

```ts
return NextResponse.json({
  issuer: base,
  authorization_endpoint: `${base}/api/oauth/authorize`,
  token_endpoint: `${base}/api/oauth/token`,
  revocation_endpoint: `${base}/api/oauth/revoke`,
  userinfo_endpoint: `${base}/api/oauth/userinfo`,
  jwks_uri: `${base}/.well-known/jwks.json`,
  registration_endpoint: `${base}/api/oauth/register`,
  scopes_supported: ["openid", "profile", "email", "search", "magic"],
  // ...sisanya sama
});
```

- [ ] **Step 4: Hapus env statis dari `src/lib/env.ts`**

Hapus dari schema:
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_REDIRECT_URIS`

**Cek:** grep `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` / `OAUTH_REDIRECT_URIS` di `src` — harus 0 pemakaian di non-test (Task 6 sudah bersihin route). Kalau ada yang tersisa, berhenti & cek.

- [ ] **Step 5: Update `.env.example` & `.env`**

`.env.example` — ganti section OAuth:

```env
# --- OAuth / MCP ---
OAUTH_ISSUER=
OAUTH_REGISTERED_CLIENTS=StartGPT|sp_abc123|http://localhost:8080/oauth/clients/mcp:searchpoint/callback
OAUTH_SCOPES=openid search
```

Hapus `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URIS` dari `.env` dan `.env.example`.

**Perhatian:** `.env` berisi secret lokal — jangan commit perubahan secret ke git. Edit manual di editor.

- [ ] **Step 6: Run tests + lint + typecheck**

Run: `bun run test`
Expected: ALL PASS (27+ test files)

Run: `bun run lint`
Expected: 0 errors (1 pre-existing warning di `authorize/route.test.ts` boleh tetap)

Run: `bunx tsc --noEmit`
Expected: hanya 5 pre-existing error di `resolve-magic-link.test.ts` / `detect-os.test.ts` (documented sebelumnya)

- [ ] **Step 7: Commit**

```bash
git add src/lib/env.ts src/app/.well-known/oauth-authorization-server .env.example
git commit -m "feat: advertise registration_endpoint; remove static client env"
```

---

## Self-Review

**Spec coverage:**
- §3.2 discovery `registration_endpoint` → Task 7 ✅
- §4 POST /register + §4.2 validasi berurutan + §4.4 response + §4.5 errors → Task 1 (helpers), Task 3 (index), Task 4 (route) ✅
- §5 registry-only authorize/token/revoke + §5.5 migrasi → Task 6 ✅
- §6 DELETE /register/{id} → Task 5 ✅
- §7 env config + format `name|token|redirect_uri` → Task 1 + Task 7 ✅
- §7.3 hapus env statis → Task 7 ✅
- §8 edge cases → Task 1 (redirect rules), Task 4 (duplicate 409, none), Task 5 (ownership 403) ✅
- §9 testing → tiap task ✅

**Placeholder scan:** tidak ada TBD/TODO. Semua step punya kode konkret.

**Type consistency:**
- `validateMetadata` return shape (`redirectUris`, `grantTypes`, `responseTypes`, `tokenEndpointAuthMethod`, `scope?`, `clientName?`) konsisten di Task 1 & Task 4 ✅
- `registerClient` input shape konsisten di Task 2/3/4 ✅
- `resolveClient(clientId) → ClientRecord | null` konsisten di Task 2/5/6 ✅
- `getClientByTokenRegistration(tokenId) → string[]` konsisten di Task 3/4 ✅
- `ClientRecord.registrationTokenId` dipakai di Task 5 (ownership check) & Task 6 ✅

**Catatan yang perlu diperhatikan eksekutor:**
- Task 2 Step 4 `getClientByTokenRegistration` adalah stub (return `[]`) yang di-replace Task 3 — sengaja, biar tiap task tetap punya test cycle sendiri.
- Non-expiring client records pakai `setPersistent(key, value)` helper (Task 2 Step 3) — bukan `setWithTTL(..., undefined)` yang di memory-fallback langsung kehapus. Ruling dari pre-flight scan.
- Task 6 mengubah banyak test — eksekutor harus baca seluruh test file dulu sebelum edit, jangan cuma patch blok yang ditampilkan.
