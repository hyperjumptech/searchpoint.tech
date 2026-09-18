# MCP Client Logo and Consent Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let MCP admins attach a 32×32 PNG data-URL logo to a static OAuth client, and restyle the consent card as a client-to-tenant connection without changing OAuth chrome.

**Architecture:** Logos live as nullable `logo_data_url` on `mcp_static_oauth_clients`. The browser resizes uploads to a PNG data URL; JSON create/PATCH set, clear, or omit the field. Consent loads the client row (not Valkey state) and renders an initial or `<img>` beside the existing tenant logo.

**Tech Stack:** Next.js 15 App Router, TypeScript, PostgreSQL (`pg`), React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-18-mcp-client-logo-consent-design.md`

## Global Constraints

- Resize to 32×32 PNG happens in the browser (`canvas` `toDataURL('image/png')`). No `sharp`, multipart, or object storage.
- Server accepts only `data:image/png;base64,` strings, max length 20000 characters.
- JSON `logoDataUrl: null` clears; omitted field on PATCH leaves the column unchanged; omitted on create means no logo.
- Do not store logos on OAuth Valkey `state`.
- Keep `src/app/oauth/layout.tsx` unchanged.
- Client avatar uses `<img>` (or an initial), not `next/image`.
- Consent error states omit the connection row.
- Max selected file size before resize: 2MB.
- Loopback HTTP redirect URIs show a localhost trust hint on consent.

## File map

- `src/lib/mcp-client-logo.ts` — data-URL validation + client initial (no DOM).
- `src/lib/oauth-static-client.ts` — column, `StaticClient.logoDataUrl`, create/update.
- `src/app/api/admin/mcp/clients/route.ts` and `[id]/route.ts` — Zod `logoDataUrl`.
- `src/app/admin/mcp/page.helpers.ts` — payload include/omit/null + file size error.
- `src/app/admin/mcp/logo.ts` — client-only canvas resize.
- `src/app/admin/mcp/page.client.tsx` — file input, preview, remove.
- `src/app/oauth/consent/page.tsx` — load client + tenant + redirect URI.
- `src/app/oauth/consent/page.client.tsx` — connection row and copy.
- Tests beside each of the above.

---

### Task 1: Validate PNG data URLs and persist `logo_data_url`

**Files:**
- Create: `src/lib/mcp-client-logo.ts`
- Create: `src/lib/mcp-client-logo.test.ts`
- Modify: `src/lib/oauth-static-client.ts`
- Modify: `src/lib/oauth-static-client.test.ts`

**Interfaces:**
- Consumes: existing `createStaticClient` / `updateStaticClient` / `rowToClient`.
- Produces:
  - `MAX_LOGO_DATA_URL_LENGTH = 20000`
  - `PNG_DATA_URL_PREFIX = "data:image/png;base64,"`
  - `validateLogoDataUrl(value: string): void` throws `Error` with message `invalid logo` if prefix, length, or base64 decode fails.
  - `clientInitial(name: string): string` — first Unicode letter/digit of trimmed name, uppercased; `"?"` if none.
  - `StaticClient.logoDataUrl: string | null`
  - `StaticClientInput.logoDataUrl?: string | null`
  - `updateStaticClient(id, input)` writes `logo_data_url` only when `'logoDataUrl' in input`.

- [ ] **Step 1: Write failing tests for logo helpers**

Create `src/lib/mcp-client-logo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  clientInitial,
  MAX_LOGO_DATA_URL_LENGTH,
  validateLogoDataUrl,
} from "./mcp-client-logo";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("mcp client logo helpers", () => {
  it("accepts a small PNG data URL", () => {
    expect(() => validateLogoDataUrl(TINY_PNG)).not.toThrow();
  });
  it("rejects non-png prefixes, oversized payloads, and bad base64", () => {
    expect(() => validateLogoDataUrl("data:image/jpeg;base64,aaaa")).toThrow(
      "invalid logo",
    );
    expect(() =>
      validateLogoDataUrl(
        "data:image/png;base64," + "a".repeat(MAX_LOGO_DATA_URL_LENGTH),
      ),
    ).toThrow("invalid logo");
    expect(() => validateLogoDataUrl("data:image/png;base64,$$$")).toThrow(
      "invalid logo",
    );
  });
  it("uses the first letter of the client name as the initial", () => {
    expect(clientInitial("Cursor")).toBe("C");
    expect(clientInitial("  openai")).toBe("O");
    expect(clientInitial("")).toBe("?");
  });
});
```

- [ ] **Step 2: Run helper tests — expect FAIL (module missing)**

Run: `bunx vitest run src/lib/mcp-client-logo.test.ts`

- [ ] **Step 3: Implement helpers**

Create `src/lib/mcp-client-logo.ts`:

```ts
export const MAX_LOGO_DATA_URL_LENGTH = 20_000;
export const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

export function validateLogoDataUrl(value: string): void {
  if (
    !value.startsWith(PNG_DATA_URL_PREFIX) ||
    value.length > MAX_LOGO_DATA_URL_LENGTH
  ) {
    throw new Error("invalid logo");
  }
  const b64 = value.slice(PNG_DATA_URL_PREFIX.length);
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.toString("base64").replace(/=+$/, "") !== b64.replace(/=+$/, "")) {
    throw new Error("invalid logo");
  }
}

export function clientInitial(name: string): string {
  const ch = Array.from(name.trim())[0];
  if (!ch) return "?";
  return ch.toUpperCase();
}
```

If the round-trip base64 check is too strict for the tiny PNG fixture, compare using `Buffer.from(b64, "base64").toString("base64")` equality with a normalized form, or check `buf[0] === 0x89 && buf[1] === 0x50` (PNG magic). Prefer PNG magic bytes `89 50 4E 47` so padding differences do not fail.

- [ ] **Step 4: Re-run helper tests — expect PASS**

Run: `bunx vitest run src/lib/mcp-client-logo.test.ts`

- [ ] **Step 5: Write failing persistence tests**

In `src/lib/oauth-static-client.test.ts` add (same `TINY_PNG` constant). After importing `createStaticClient`, also import `updateStaticClient`. Extend a create mock row with `logo_data_url: null` only when needed.

```ts
it("stores a logo data URL on create and maps it on the client", async () => {
  query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
    rows: [
      {
        client_id: "id",
        name: "app",
        redirect_uri: "https://example.com",
        scopes: ["search"],
        enabled: true,
        revoked: false,
        logo_data_url: TINY_PNG,
      },
    ],
  });
  const result = await createStaticClient({
    name: "app",
    redirectUri: "https://example.com",
    logoDataUrl: TINY_PNG,
  });
  expect(result.client.logoDataUrl).toBe(TINY_PNG);
  expect(query.mock.calls.at(-1)?.[1]).toContain(TINY_PNG);
});

it("rejects an invalid logo before insert", async () => {
  await expect(
    createStaticClient({
      name: "app",
      redirectUri: "https://example.com",
      logoDataUrl: "data:image/jpeg;base64,xx",
    }),
  ).rejects.toThrow("invalid logo");
  expect(query).not.toHaveBeenCalled();
});

it("clears, sets, and omits logo on update", async () => {
  const { updateStaticClient } = await import("./oauth-static-client");
  const current = {
    client_id: "id",
    name: "app",
    redirect_uri: "https://example.com",
    scopes: ["search"],
    enabled: true,
    revoked: false,
    created_at: new Date(),
    updated_at: new Date(),
    revoked_at: null,
    logo_data_url: TINY_PNG,
  };
  query.mockResolvedValue({ rows: [current] });
  await updateStaticClient("id", { logoDataUrl: null });
  const clearSql = String(query.mock.calls.at(-1)?.[0]);
  expect(clearSql).toMatch(/logo_data_url/);
  expect(query.mock.calls.at(-1)?.[1]).toContain(null);

  query.mockClear();
  query.mockResolvedValue({ rows: [{ ...current, logo_data_url: TINY_PNG }] });
  await updateStaticClient("id", { name: "app2" });
  const omitSql = String(query.mock.calls.at(-1)?.[0]);
  expect(omitSql).not.toMatch(/logo_data_url/);
});
```

Adjust mock call indexes to match `ensureStaticClientSchema` (schema query then ALTER). Follow the existing create test: first `query` may be schema; last INSERT params include the logo.

- [ ] **Step 6: Run persistence tests — expect FAIL**

Run: `bunx vitest run src/lib/oauth-static-client.test.ts`

- [ ] **Step 7: Persist the column**

In `ensureStaticClientSchema`, after the `credential_version` ALTER, add:

```ts
await pool.query(
  "ALTER TABLE mcp_static_oauth_clients ADD COLUMN IF NOT EXISTS logo_data_url TEXT",
);
```

Keep the same `if (result && "rowCount" in result)` guard so unit mocks without a result skip ALTERs.

Extend types:

```ts
export type StaticClient = {
  // existing fields...
  logoDataUrl: string | null;
};
export type StaticClientInput = {
  name: string;
  redirectUri: string;
  scopes?: string[];
  enabled?: boolean;
  logoDataUrl?: string | null;
};
type StaticClientRow = {
  // existing fields...
  logo_data_url?: string | null;
};
```

`rowToClient`: `logoDataUrl: row.logo_data_url ?? null`.

In `validate`, if `input.logoDataUrl` is a string, call `validateLogoDataUrl` and wrap failures as `StaticClientValidationError("invalid logo")`. `null` is valid (clear / unset).

`createStaticClient` INSERT add `logo_data_url` with `input.logoDataUrl ?? null` (only after validate).

`updateStaticClient`:

```ts
if (input.logoDataUrl !== undefined) {
  if (input.logoDataUrl !== null) {
    try {
      validateLogoDataUrl(input.logoDataUrl);
    } catch {
      throw new StaticClientValidationError("invalid logo");
    }
  }
}
const next = { /* existing name/uri/scopes/enabled */ };
if ("logoDataUrl" in input) {
  // UPDATE ... logo_data_url=$6 ...
} else {
  // existing UPDATE without logo column
}
```

Prefer one SQL with `logo_data_url = CASE WHEN $6::boolean THEN $7 ELSE logo_data_url END` where `$6` is `'logoDataUrl' in input` and `$7` is the new value or null. That keeps a single statement.

- [ ] **Step 8: Re-run static client tests — expect PASS**

Run: `bunx vitest run src/lib/oauth-static-client.test.ts src/lib/mcp-client-logo.test.ts`

- [ ] **Step 9: Commit**

```bash
git add src/lib/mcp-client-logo.ts src/lib/mcp-client-logo.test.ts src/lib/oauth-static-client.ts src/lib/oauth-static-client.test.ts
git commit -m "$(cat <<'EOF'
feat: persist optional MCP client logo data URLs

EOF
)"
```

---

### Task 2: Accept `logoDataUrl` on admin client JSON APIs

**Files:**
- Modify: `src/app/api/admin/mcp/clients/route.ts`
- Modify: `src/app/api/admin/mcp/clients/[id]/route.ts`
- Modify: `src/app/api/admin/mcp/clients/route.test.ts`

**Interfaces:**
- Consumes: `createStaticClient` / `updateStaticClient` from Task 1.
- Produces: POST body `{ name, redirectUri, scopes?, logoDataUrl?: string | null }`; PATCH same fields optional plus `enabled`; `logoDataUrl: null` is valid PATCH-only payload.

- [ ] **Step 1: Write failing route tests**

Append to `src/app/api/admin/mcp/clients/route.test.ts` using the same `TINY_PNG` as Task 1:

```ts
it("creates with a logo data URL", async () => {
  mocks.create.mockResolvedValue({
    client: { ...client, logoDataUrl: TINY_PNG },
    clientSecret: "secret",
  });
  const response = await POST(
    req({
      name: "App",
      redirectUri: client.redirectUri,
      logoDataUrl: TINY_PNG,
    }),
  );
  expect(response.status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({ logoDataUrl: TINY_PNG }),
  );
});

it("patches null to clear a logo and rejects jpeg data URLs", async () => {
  mocks.update.mockResolvedValue({ ...client, logoDataUrl: null });
  expect(
    (await PATCH(req({ logoDataUrl: null }), ctx)).status,
  ).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(
    "c1",
    expect.objectContaining({ logoDataUrl: null }),
  );
  expect(
    (await PATCH(req({ logoDataUrl: "data:image/jpeg;base64,xx" }), ctx))
      .status,
  ).toBe(400);
  expect(mocks.update).toHaveBeenCalledTimes(1);
});
```

Zod should reject jpeg before `update` is called (second assertion: still one update call).

- [ ] **Step 2: Run route tests — expect FAIL**

Run: `bunx vitest run src/app/api/admin/mcp/clients/route.test.ts`

- [ ] **Step 3: Extend Zod schemas**

Shared shape (inline in both files or a tiny local const):

```ts
logoDataUrl: z
  .string()
  .max(20_000)
  .nullable()
  .optional()
  .refine(
    (value) =>
      value == null || value.startsWith("data:image/png;base64,"),
    "invalid logo",
  ),
```

Add to `inputSchema` in `route.ts` and `updateSchema` in `[id]/route.ts`. Keep `.strict()`. PATCH `{ logoDataUrl: null }` must pass the `.refine((value) => Object.keys(value).length > 0)` check.

Pass `parsed.data` through to `createStaticClient` / `updateStaticClient` unchanged so `undefined` vs `null` is preserved (`z` optional omitted vs null).

- [ ] **Step 4: Re-run route tests — expect PASS**

Run: `bunx vitest run src/app/api/admin/mcp/clients/route.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/mcp/clients/route.ts src/app/api/admin/mcp/clients/[id]/route.ts src/app/api/admin/mcp/clients/route.test.ts
git commit -m "$(cat <<'EOF'
feat: accept MCP client logo on admin JSON APIs

EOF
)"
```

---

### Task 3: Admin create/edit file picker, 32×32 resize, remove

**Files:**
- Modify: `src/app/admin/mcp/page.helpers.ts`
- Create: `src/app/admin/mcp/page.helpers.test.ts` (if none exists; otherwise modify)
- Create: `src/app/admin/mcp/logo.ts`
- Modify: `src/app/admin/mcp/page.client.tsx`
- Modify: `src/app/admin/mcp/page.test.tsx`

**Interfaces:**
- Consumes: Task 2 JSON field semantics.
- Produces:
  - `MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024`
  - `logoFileError(file: File): string | null` — `"Logo must be 2MB or smaller."` when `file.size` exceeds the cap.
  - `buildClientPayload(values, allowed, logo?: { logoDataUrl: string | null } | "omit")` — default `"omit"`; when object, include `logoDataUrl`.
  - `fileToPng32DataUrl(file: File): Promise<string>` in `logo.ts` (browser).

- [ ] **Step 1: Write failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildClientPayload,
  logoFileError,
} from "./page.helpers";

describe("MCP admin logo payload", () => {
  it("omits logo unless the caller passes a logo action", () => {
    expect(
      buildClientPayload({
        name: "A",
        redirectUri: "https://x.test/cb",
        scopes: ["search"],
      }),
    ).toEqual({
      name: "A",
      redirectUri: "https://x.test/cb",
      scopes: ["search"],
    });
  });
  it("includes set and clear logo fields", () => {
    expect(
      buildClientPayload(
        { name: "A", redirectUri: "https://x.test/cb", scopes: ["search"] },
        ["search"],
        { logoDataUrl: "data:image/png;base64,abc" },
      ),
    ).toMatchObject({ logoDataUrl: "data:image/png;base64,abc" });
    expect(
      buildClientPayload(
        { name: "A", redirectUri: "https://x.test/cb", scopes: ["search"] },
        ["search"],
        { logoDataUrl: null },
      ),
    ).toMatchObject({ logoDataUrl: null });
  });
  it("rejects files larger than 2MB", () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.png");
    expect(logoFileError(file)).toMatch(/2MB/);
    expect(logoFileError(new File(["x"], "x.png"))).toBeNull();
  });
});
```

- [ ] **Step 2: Run helper tests — expect FAIL**

Run: `bunx vitest run src/app/admin/mcp/page.helpers.test.ts`

- [ ] **Step 3: Implement helpers**

```ts
export const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024;

export function logoFileError(file: File): string | null {
  return file.size > MAX_LOGO_FILE_BYTES
    ? "Logo must be 2MB or smaller."
    : null;
}

export function buildClientPayload(
  values: { name: string; redirectUri: string; scopes: string[] },
  allowed: readonly string[] = ALLOWED_SCOPES,
  logo: { logoDataUrl: string | null } | "omit" = "omit",
) {
  const payload: {
    name: string;
    redirectUri: string;
    scopes: string[];
    logoDataUrl?: string | null;
  } = {
    name: values.name.trim(),
    redirectUri: values.redirectUri.trim(),
    scopes: values.scopes.filter((scope) => allowed.includes(scope)),
  };
  if (logo !== "omit") payload.logoDataUrl = logo.logoDataUrl;
  return payload;
}
```

Create `src/app/admin/mcp/logo.ts`:

```ts
export async function fileToPng32DataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the image.");
  ctx.drawImage(bitmap, 0, 0, 32, 32);
  bitmap.close();
  return canvas.toDataURL("image/png");
}
```

If `createImageBitmap` is missing in a target browser, fall back to `Image` + `URL.createObjectURL` then `drawImage`.

- [ ] **Step 4: Re-run helper tests — expect PASS**

Run: `bunx vitest run src/app/admin/mcp/page.helpers.test.ts`

- [ ] **Step 5: Write failing admin UI tests**

In `src/app/admin/mcp/page.test.tsx`:

- Extend `McpClient` fixture with `logoDataUrl: null`.
- Mock `./logo`:

```ts
vi.mock("./logo", () => ({
  fileToPng32DataUrl: vi.fn(async () => "data:image/png;base64,FROMFILE"),
}));
```

Create test: attach a small `File` to the Logo input (`getByLabelText("Logo")`), submit create, expect POST body to include `logoDataUrl: "data:image/png;base64,FROMFILE"`.

Edit test: fixture `logoDataUrl: TINY_PNG`, click `Remove logo`, save, expect PATCH body `logoDataUrl: null`.

Existing create test must still pass: no `logoDataUrl` key when no file chosen.

- [ ] **Step 6: Run page tests — expect FAIL**

Run: `bunx vitest run src/app/admin/mcp/page.test.tsx`

- [ ] **Step 7: Wire the dialog**

On `McpClient` add `logoDataUrl: string | null`.

Form state:

```ts
logoFile: File | null;
removeLogo: boolean;
previewUrl: string | null; // object URL or existing data URL
```

`openCreate`: clear file, `removeLogo=false`, `previewUrl=null`.  
`openEdit`: `previewUrl=client.logoDataUrl`, `removeLogo=false`, `logoFile=null`.

UI after scopes:

- `<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Logo" />`
- If `previewUrl`, `<img alt="" width={32} height={32} src={previewUrl} />`
- If edit and (`client.logoDataUrl` or file) and not intending empty: button `Remove logo` sets `removeLogo=true`, clears file, clears preview.

`submit`:

```ts
const sizeError = values.logoFile ? logoFileError(values.logoFile) : null;
if (sizeError) return setFormError(sizeError);
let logo: { logoDataUrl: string | null } | "omit" = "omit";
if (values.logoFile) {
  try {
    logo = { logoDataUrl: await fileToPng32DataUrl(values.logoFile) };
  } catch {
    return setFormError("Could not read the image.");
  }
} else if (mode.kind === "edit" && values.removeLogo) {
  logo = { logoDataUrl: null };
}
body: JSON.stringify(buildClientPayload(values, allowedScopes, logo)),
```

Revoke `URL.revokeObjectURL` for blob previews on unmount / new file.

- [ ] **Step 8: Re-run page tests — expect PASS**

Run: `bunx vitest run src/app/admin/mcp/page.test.tsx src/app/admin/mcp/page.helpers.test.ts`

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/mcp/page.helpers.ts src/app/admin/mcp/page.helpers.test.ts src/app/admin/mcp/logo.ts src/app/admin/mcp/page.client.tsx src/app/admin/mcp/page.test.tsx
git commit -m "$(cat <<'EOF'
feat: upload and remove MCP client logos in admin

EOF
)"
```

---

### Task 4: Consent connection row (client icon, tenant logo, copy)

**Files:**
- Modify: `src/app/oauth/consent/page.tsx`
- Modify: `src/app/oauth/consent/page.client.tsx`
- Create: `src/app/oauth/consent/page.client.test.tsx`

**Interfaces:**
- Consumes: `getStaticClient(clientId).logoDataUrl`, `clientInitial`, tenant `content.productName` and `logo`, OAuth state `redirect_uri`.
- Produces: `ConsentClient` props:

```ts
{
  state: string;
  clientId: string;
  clientName?: string;
  scopes: string;
  userEmail: string;
  ttlDays: number;
  logoDataUrl: string | null;
  resourceName: string;
  tenantLogo: { src: string; alt: string };
  redirectUri: string;
}
```

- [ ] **Step 1: Write failing consent UI tests**

`src/app/oauth/consent/page.client.test.tsx` (`@vitest-environment jsdom`):

Render `ConsentClient` with `logoDataUrl: null`, `clientName: "Cursor"`, `resourceName: "SearchPoint"`, `userEmail: "a@b.com"`, `tenantLogo: { src: "/icons/logo.svg", alt: "Sinarmas" }`, `redirectUri: "http://127.0.0.1/cb"`.

Assert:

- Text `C` (initial) present.
- `img` with `alt="Sinarmas"`.
- Copy matching `/Cursor wants to access SearchPoint on behalf of a@b.com/`.
- Localhost hint matching `/localhost/`.
- No `h1` with only `SearchPoint` as the old card title (header in layout is out of this component).

Second render: `logoDataUrl: TINY_PNG` → `img` with that `src`, no initial `C` as the avatar letter (the connection row uses the image).

Third render: `redirectUri: "https://app.example/cb"` → no localhost hint.

- [ ] **Step 2: Run consent tests — expect FAIL**

Run: `bunx vitest run src/app/oauth/consent/page.client.test.tsx`

- [ ] **Step 3: Load data on the server page**

In `src/app/oauth/consent/page.tsx` (keep `force-dynamic`):

```ts
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getStaticClient } from "@/lib/oauth-static-client";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";

const client = await getStaticClient(stateData.client_id);
const headersList = await headers();
const host =
  headersList.get("x-hostname") ||
  headersList.get("x-forwarded-host") ||
  headersList.get("host") ||
  "";
const tenant = getTenantConfig(resolveTenantId(env.TENANT, host), env.APP_NAME);

<ConsentClient
  ...existing
  logoDataUrl={client?.logoDataUrl ?? null}
  resourceName={tenant.content.productName}
  tenantLogo={{ src: tenant.logo.src, alt: tenant.logo.alt }}
  redirectUri={stateData.redirect_uri}
/>
```

Do not add `logoDataUrl` to Valkey state.

Leave `ConsentError` markup as-is (no connection row).

- [ ] **Step 4: Restyle `ConsentClient`**

Remove the inner “SearchPoint / Secure Corporate Search Engine” heading.

Connection row (centered, `flex items-center justify-center gap-2`):

- Client: if `logoDataUrl`, `<img src={logoDataUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />`; else a `h-8 w-8 rounded-full` circle with `clientInitial(clientName ?? clientId)`.
- Ellipsis: `text-muted-foreground` `···`
- Tenant: `<img src={tenantLogo.src} alt={tenantLogo.alt} width={32} height={32} className="h-8 w-8 object-contain" />` (`<img>` is OK here too so tests do not need to mock `next/image`).

Title: `h2` with `clientName ?? clientId`.

Subtitle:

```
{clientName ?? clientId} wants to access {resourceName} on behalf of {userEmail}
```

Scope list: wrap with a bordered card and heading `This will allow access to:`; keep `describeScopes` items.

Buttons unchanged.

TTL line unchanged.

If `new URL(redirectUri)` protocol is `http:` and hostname is `localhost`, `127.0.0.1`, `[::1]`, or `::1`, show:

`Make sure that you trust {clientName ?? clientId} (localhost). You may be sharing sensitive data with this site or app.`

Use a try/catch around `new URL`; skip the hint if the URI does not parse.

- [ ] **Step 5: Re-run consent tests — expect PASS**

Run: `bunx vitest run src/app/oauth/consent/page.client.test.tsx`

- [ ] **Step 6: Run the related unit suite**

Run: `bunx vitest run src/lib/mcp-client-logo.test.ts src/lib/oauth-static-client.test.ts src/app/api/admin/mcp/clients/route.test.ts src/app/admin/mcp/page.test.tsx src/app/admin/mcp/page.helpers.test.ts src/app/oauth/consent/page.client.test.tsx`

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/oauth/consent/page.tsx src/app/oauth/consent/page.client.tsx src/app/oauth/consent/page.client.test.tsx
git commit -m "$(cat <<'EOF'
feat: show MCP client and tenant logos on consent

EOF
)"
```

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| `logo_data_url` TEXT nullable + ALTER IF NOT EXISTS | 1 |
| Browser 32×32 PNG data URL | 3 |
| Server PNG prefix + ~20KB + decode | 1–2 |
| omit / null / set semantics | 1–3 |
| Logo not in Valkey state | 4 |
| Admin file picker create/edit + remove + 2MB | 3 |
| Consent chrome unchanged | 4 (layout file not modified) |
| Connection row, initials, copy, localhost hint | 4 |
| Error consent without icons | 4 |
| `<img>` for client (and tenant in-card) data/static src | 4 |
| Unit tests listed in spec | 1–4 |
| No Playwright upload | — omitted |

## Type names

Use `logoDataUrl` in TypeScript/JSON and `logo_data_url` in SQL only. Do not introduce `logoUrl` or `logoPng`.
