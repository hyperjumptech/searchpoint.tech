# MCP Client Logo and Consent Connection Layout

## Context

MCP OAuth clients are created in `/admin/mcp` and stored in PostgreSQL
(`mcp_static_oauth_clients`). The consent screen at `/oauth/consent` currently
shows text only (client name, email chip, scopes) inside the shared OAuth
login chrome (tenant header logo, photo aside, footer). Clients have no logo.

This change lets an administrator attach a small client logo and restyles the
consent card to show a visual connection between that client and SearchPoint,
while keeping the existing OAuth page chrome.

## Goal

1. Admin can upload, replace, or remove a logo on create/edit of an MCP
   client.
2. Consent shows client icon (logo or initial) connected to the existing
   tenant SearchPoint logo, with copy closer to a standard OAuth consent
   card.

## Non-goals

- Object storage, `sharp`, or multipart uploads.
- Changing tenant/company logo upload.
- Replacing the OAuth split layout (aside image, header `NavbarLogo`,
  footer).
- Putting logo bytes in Valkey OAuth state.
- End-to-end Playwright coverage of file upload in this iteration.

## User experience

### Admin (`/admin/mcp`)

Create and edit dialogs add a file input (`image/*`: PNG, JPEG, WebP).

- Preview is 32×32.
- The browser draws the image onto a 32×32 canvas and produces
  `toDataURL('image/png')`. That string is `logoDataUrl`.
- Create with no file leaves the logo unset (consent uses an initial).
- Edit with no new file omits `logoDataUrl` so the stored logo is unchanged.
- Edit exposes Remove logo when a logo exists; submit then sends
  `logoDataUrl: null`.
- Reject in the form (do not call the API) if the selected file is larger
  than 2MB or cannot be decoded.

### Consent (`/oauth/consent`)

Keep `src/app/oauth/layout.tsx` unchanged.

Inside the card:

1. Centered connection row: 32×32 client avatar, ellipsis, 32×32 tenant
   logo (`getCompanyLogo` / existing `CompanyLogo`, displayed at 32×32).
2. Title: client display name (fallback `client_id`).
3. Subtitle: `{client} wants to access {tenant app name} on behalf of
   {userEmail}` in one block (no separate email chip).
4. Scope list, tighter “this will allow access to” treatment; keep existing
   known/unknown scope copy from `describeScopes`.
5. Deny / Allow unchanged in behavior.
6. Footer: existing TTL sentence; plus a localhost trust hint when
   `redirect_uri` is loopback `http` (RFC 8252 local MCP clients).

Client avatar rules:

- If `logoDataUrl` is set, render `<img src={logoDataUrl} alt="" width={32}
  height={32}>` (not `next/image`; data URLs are awkward with the image
  optimizer).
- If unset, render a circular initial: first character of the client name
  (fallback `client_id`), case folded for display as a single letter.

Consent error states (missing/expired state, missing email) do not show the
connection row.

## Data model

Add nullable `logo_data_url TEXT` on `mcp_static_oauth_clients`, created with
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` next to the existing
`ensureStaticClientSchema` migration style.

`NULL` means no logo (initial on consent). When set, the value is a PNG data
URL from the admin canvas, approximately 32×32.

Do not store the logo on OAuth `state` in Valkey. The consent server page
loads the client with `getStaticClient(client_id)` and passes `logoDataUrl`
into `ConsentClient`.

## API

Existing JSON create/PATCH for `/api/admin/mcp/clients` and
`/api/admin/mcp/clients/[id]`.

| Body field | Meaning |
| --- | --- |
| `logoDataUrl` string | Set/replace logo |
| `logoDataUrl` JSON `null` | Clear logo |
| field omitted | Leave logo unchanged (PATCH only; create omitted = no logo) |

Server validation when the field is a string:

- Must start with `data:image/png;base64,` (canvas output is PNG).
- Length cap about 20KB.
- Base64 must decode; reject otherwise with 400 and no write.

List/get payloads include `logoDataUrl` (or `null`) so the edit dialog can
preview and decide whether to show Remove.

No new public logo GET route in this iteration; consent uses the data URL
from the client row.

## Error handling

- Invalid `logoDataUrl` on create/PATCH: 400, existing client unchanged.
- Missing logo: consent still works with initial.
- Network/consent decision errors: unchanged.

## Testing

- `oauth-static-client` / admin client routes: set, clear, omit logo; reject
  oversized or non-PNG data URLs.
- Admin page tests: file control and remove on edit.
- Consent client tests: initial vs `<img>` when `logoDataUrl` is present;
  connection row copy; localhost hint when redirect is loopback.

## Implementation notes

- Resize happens only in the browser for this POC. Server does not rasterize;
  it only validates the data URL.
- CSP already allows `img-src 'self' blob: data:`; data URL avatars are
  allowed.
- `ttlDays` stays derived as today (30-day consent TTL).
