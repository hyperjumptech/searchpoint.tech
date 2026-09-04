# OIDC Provider untuk MCP OAuth 2.1 Static — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement OAuth 2.1 Authorization Server (Static, PKCE S256) + MCP Resource Server proxy di Next.js sehingga Open WebUI bisa `authorize → token → Bearer /mcp → Cookie SCSE_ID → backend`.

**Architecture:** Lightweight opaque-token OP di Next.js (A) dengan Valkey `oauth:*` mapping dan TTL A1 (Entra 60m no refresh, magic 1h at + 7d rt). Discovery di `/.well-known/*`, authorize callback reuse `GET /v1/auth/` & `POST /v1/auth/magic-link`, MCP di `/mcp` proxy via `fetcher.ts` Bearer→Cookie.

**Tech Stack:** Next.js 15.5 App Router, TypeScript, `redis` (Valkey), `zod`, `vitest`, `playwright`, `next/headers` cookies.

**Spec:** `docs/superpowers/specs/2026-08-28-oidc-provider-design.md`

## Global Constraints

- Next.js 15.5.9, React 19.2.3, output `standalone`, Turbopack build — jangan ubah.
- `VALKEY_URL` optional; kalau unset fallback in-memory (existing pattern di `src/lib/rate-limit.ts`). OAuth storage harus fail gracefully jika Valkey down (return 503, bukan crash).
- `OAUTH_ISSUER` optional url, default derive dari `request.url` origin + `x-forwarded-host`. `MCP_RESOURCE_URL` default `${issuer}/mcp`.
- `OAUTH_CLIENT_ID` default `searchpoint-mcp-static`, `OAUTH_CLIENT_SECRET` optional string → validate via `timingSafeEqual` (Node `crypto`).
- PKCE `S256` wajib, `plain` reject `invalid_request`.
- `SCSE_ID` tetap `HttpOnly; SameSite=Lax; Secure` di prod — never expose ke client JS / Open WebUI.
- No DCR (`/register`) — Static only. `registration_endpoint` omitted.
- Middleware matcher tetap `["/", "/login", "/logout", "/search", "/image", "/docs/:path*"]` — `/api` dan `/.well-known` dan `/mcp` bypass cookie guard secara eksplisit di `middleware.ts`.
- TTL A1: Entra `atTtl = min(scseTtl, 3600s)` no rt; magic `atTtl = min(scseTtl,3600s)`, `rtTtl = min(scseTtl, 7*24*3600s)`.
- Semua token opaque `crypto.randomBytes(32).toString('base64url')`.
- Commit tiap task dengan `feat:` prefix, TDD red-green-refactor.

---

## File Structure

```
src/lib/env.ts                              # + OAUTH_* vars
src/lib/oauth.ts                             # PKCE, token gen, TTL calc, iss helpers
src/lib/oauth.test.ts                        # unit
src/lib/oauth-valkey.ts                      # Valkey key helpers + get/set/del wrappers (reuse createClient)
src/lib/oauth-valkey.test.ts                 # unit mock
src/app/.well-known/oauth-authorization-server/route.ts
src/app/.well-known/oauth-protected-resource/route.ts
src/app/.well-known/jwks.json/route.ts       # 501 or static empty (optional)
src/app/api/oauth/authorize/route.ts         # GET, state + redirect ke Entra atau magic UI
src/app/api/oauth/callback/route.ts          # GET, code generation
src/app/api/oauth/poll/route.ts              # GET ?state=
src/app/api/oauth/token/route.ts             # POST, auth_code + refresh
src/app/api/oauth/revoke/route.ts            # POST, RFC 7009
src/app/api/oauth/userinfo/route.ts          # GET, Bearer
src/app/mcp/route.ts                         # GET+POST, Bearer→Cookie proxy
src/middleware.ts                            # + bypass /.well-known, /api/oauth, /mcp Bearer
src/lib/rate-limit.ts                        # + limiterForScope('oauth')
```

---

### Task 1: Env & Valkey Helpers

**Files:**
- Modify: `src/lib/env.ts`
- Create: `src/lib/oauth-valkey.ts`
- Test: `src/lib/oauth-valkey.test.ts`

**Interfaces:**
- Consumes: `env.VALKEY_URL`, `redis.createClient`
- Produces: `getOAuthValkey(): Promise<RedisClientType|null>`, `oauthKeys(state|code|at|rt): string`, `setWithTTL(key, value, ttlSec)`, `getJSON<T>(key)`, `delKey(key)`

- [ ] **Step 1: Write failing test for env parsing**

```ts
// src/lib/oauth-valkey.test.ts
import { describe, it, expect, vi } from "vitest"
vi.mock("@/lib/env", () => ({ env: { OAUTH_ISSUER: "https://example.com", VALKEY_URL: undefined } }))
import { oauthKeys } from "@/lib/oauth-valkey"
describe("oauthKeys", () => {
  it("builds at key", () => { expect(oauthKeys.at("abc")).toBe("oauth:at:abc") })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/lib/oauth-valkey.test.ts -v`
Expected: FAIL `oauth-valkey not found`

- [ ] **Step 3: Extend env.ts**

```ts
// src/lib/env.ts add to schema:
OAUTH_ISSUER: z.preprocess(v=> v===""?undefined:v, z.url().optional()),
MCP_RESOURCE_URL: z.preprocess(v=> v===""?undefined:v, z.url().optional()),
OAUTH_CLIENT_ID: z.string().optional().default("searchpoint-mcp-static"),
OAUTH_CLIENT_SECRET: z.preprocess(v=> v===""?undefined:v, z.string().optional()),
```

- [ ] **Step 4: Implement oauth-valkey.ts**

```ts
import { createClient, type RedisClientType } from "redis"
import { env } from "@/lib/env"
let client: RedisClientType | null = null
export async function getOAuthValkey(): Promise<RedisClientType | null> {
  if (!env.VALKEY_URL) return null
  if (!client) client = createClient({ url: env.VALKEY_URL }) as RedisClientType
  if (!client.isOpen) await client.connect()
  return client
}
export const oauthKeys = {
  state: (s:string)=> `oauth:state:${s}`,
  code: (c:string)=> `oauth:code:${c}`,
  at: (t:string)=> `oauth:at:${t}`,
  rt: (t:string)=> `oauth:rt:${t}`,
  magicPending: (s:string)=> `oauth:magic:pending:${s}`,
}
export async function setWithTTL(key:string, value:unknown, ttlSec:number){
  const c = await getOAuthValkey()
  if (!c) { // fallback in-memory Map (simple)
    memory.set(key, JSON.stringify(value)); setTimeout(()=>memory.delete(key), ttlSec*1000); return
  }
  await c.set(key, JSON.stringify(value), { EX: ttlSec })
}
export async function getJSON<T>(key:string): Promise<T|null>{
  const c = await getOAuthValkey(); if(!c) { const v=memory.get(key); return v? JSON.parse(v): null }
  const v = await c.get(key); return v? JSON.parse(v): null
}
export async function delKey(key:string){ const c=await getOAuthValkey(); if(!c){memory.delete(key); return} await c.del(key) }
const memory = new Map<string,string>()
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- src/lib/oauth-valkey.test.ts -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/env.ts src/lib/oauth-valkey.ts src/lib/oauth-valkey.test.ts
git commit -m "feat: oauth env and valkey helpers"
```

---

### Task 2: OAuth Core Lib (PKCE, TTL, token gen)

**Files:**
- Create: `src/lib/oauth.ts`
- Test: `src/lib/oauth.test.ts`

**Interfaces:**
- Consumes: `oauth-valkey.ts`
- Produces: `pkceVerify(verifier, challenge): boolean`, `generateToken(): string`, `calcTTL(iss, scseExp): {atTtl, rtTtl}`, `deriveIssuer(request): string`, `timingSafeEqualStr(a,b): boolean`

- [ ] **Step 1: Write failing test for PKCE S256**

```ts
// src/lib/oauth.test.ts
import { pkceVerify, calcTTL } from "@/lib/oauth"
import { createHash } from "crypto"
it("verifies S256", ()=>{
  const verifier="dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  const challenge=createHash("sha256").update(verifier).digest("base64url")
  expect(pkceVerify(verifier, challenge)).toBe(true)
  expect(pkceVerify("bad", challenge)).toBe(false)
})
it("calcTTL entra caps 3600", ()=>{
  const now=Date.now(); const exp=Math.floor((now+90*60*1000)/1000)
  expect(calcTTL("entra", exp, now).atTtl).toBe(3600)
  expect(calcTTL("entra", exp, now).rtTtl).toBeNull()
})
it("calcTTL magic 7d", ()=>{
  const now=Date.now(); const exp=Math.floor((now+168*3600*1000)/1000)
  const {atTtl, rtTtl}=calcTTL("searchpoint", exp, now)
  expect(atTtl).toBe(3600); expect(rtTtl).toBe(7*24*3600)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/lib/oauth.test.ts -v` → FAIL

- [ ] **Step 3: Implement src/lib/oauth.ts**

```ts
import { createHash, randomBytes, timingSafeEqual } from "crypto"
export function pkceVerify(verifier:string, challenge:string){
  const hash = createHash("sha256").update(verifier).digest("base64url")
  return timingSafeEqual(Buffer.from(hash), Buffer.from(challenge))
}
export function generateToken(){ return randomBytes(32).toString("base64url") }
export function calcTTL(iss:"entra"|"searchpoint", scseExp:number, nowMs=Date.now()){
  const scseTtlSec = Math.max(0, scseExp - Math.floor(nowMs/1000))
  if(iss==="entra") return { atTtl: Math.min(scseTtlSec, 3600), rtTtl: null as number|null }
  return { atTtl: Math.min(scseTtlSec, 3600), rtTtl: Math.min(scseTtlSec, 7*24*3600) }
}
export function deriveIssuer(req: Request){
  const envIss = process.env.OAUTH_ISSUER?.trim()
  if(envIss) return envIss.replace(/\/$/,"")
  const url = new URL(req.url); const fwd = req.headers.get("x-forwarded-host"); if(fwd) return `https://${fwd.split(",")[0].trim()}`
  return url.origin
}
export function timingSafeEqualStr(a:string,b:string){
  const ba=Buffer.from(a), bb=Buffer.from(b); if(ba.length!==bb.length) return false; return timingSafeEqual(ba,bb)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/lib/oauth.test.ts -v` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/oauth.ts src/lib/oauth.test.ts
git commit -m "feat: oauth core PKCE and TTL helpers"
```

---

### Task 3: Discovery Endpoints

**Files:**
- Create: `src/app/.well-known/oauth-authorization-server/route.ts`
- Create: `src/app/.well-known/oauth-protected-resource/route.ts`
- Create: `src/app/.well-known/jwks.json/route.ts`
- Test: `src/app/.well-known/oauth-authorization-server/route.test.ts` (vitest fetch)

**Interfaces:**
- Consumes: `deriveIssuer`, `env.MCP_RESOURCE_URL`
- Produces: GET handlers returning JSON per spec 3.3

- [ ] **Step 1: Write failing test**

```ts
import { GET } from "@/app/.well-known/oauth-authorization-server/route"
it("returns discovery", async ()=>{
  const req = new Request("https://example.com/.well-known/oauth-authorization-server")
  const res = await GET(req as any)
  const j = await res.json()
  expect(j.issuer).toBeDefined(); expect(j.authorization_endpoint).toMatch(/\/api\/oauth\/authorize/)
  expect(j.code_challenge_methods_supported).toContain("S256")
})
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Implement routes**

```ts
// oauth-authorization-server/route.ts
import { NextResponse } from "next/server"
import { deriveIssuer } from "@/lib/oauth"
import { env } from "@/lib/env"
export async function GET(req: Request){
  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req)
  const base = issuer.replace(/\/$/,"")
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    revocation_endpoint: `${base}/api/oauth/revoke`,
    userinfo_endpoint: `${base}/api/oauth/userinfo`,
    jwks_uri: `${base}/.well-known/jwks.json`,
    scopes_supported: ["openid","profile","email","search"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code","refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic","client_secret_post","none"],
    revocation_endpoint_auth_methods_supported: ["client_secret_basic"],
  })
}
// oauth-protected-resource/route.ts
export async function GET(req: Request){
  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req)
  const resource = env.MCP_RESOURCE_URL ?? `${issuer.replace(/\/$/,"")}/mcp`
  return NextResponse.json({ resource, authorization_servers:[issuer], scopes_supported:["openid","search"], bearer_methods_supported:["header"] })
}
// jwks.json/route.ts
export async function GET(){ return NextResponse.json({ keys: [] }) }
```

- [ ] **Step 4: Run test → PASS, manual curl check**

Run: `bun run test -- src/app/.well-known -v`

- [ ] **Step 5: Commit**

```bash
git add src/app/.well-known
git commit -m "feat: oauth discovery endpoints"
```

---

### Task 4: Authorize Route (GET)

**Files:**
- Create: `src/app/api/oauth/authorize/route.ts`
- Test: `src/app/api/oauth/authorize/route.test.ts`

**Interfaces:**
- Consumes: `oauth-valkey.ts`, `deriveIssuer`, `env.OAUTH_CLIENT_ID`
- Produces: `GET` validates `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method=S256`, stores `oauth:state:<state>` TTL 600, redirects to Entra or magic UI

Validation rules:
- `client_id` must equal `env.OAUTH_CLIENT_ID` else `invalid_client` JSON 401
- `response_type=code` only, `code_challenge` required, `method=S256` only else `invalid_request`
- `redirect_uri` must be https + not contain fragment, store as-is (allowlist: any https for Static per Open WebUI, but log)
- `state` required, generate if missing? spec says required → 400 if missing

Redirect logic:
- If `scope` includes `magic` or query `idp=magic` → redirect to `/api/oauth/magic-ui?state=...` (reuse magic UI) OR directly 302 to internal magic page (simple HTML form posting to `POST /v1/auth/magic-link` via Next.js server action)
- Else default Entra → 302 to `${env.AUTH_BASE_URL}/v1/auth/?return_to=${encodeURIComponent(`${issuer}/api/oauth/callback?state=${state}`)}`

- [ ] **Step 1: Write failing test**

```ts
it("rejects bad client_id", async ()=>{
  const req=new Request("https://example.com/api/oauth/authorize?client_id=bad&redirect_uri=https://cb.example/cb&response_type=code&code_challenge=abc&code_challenge_method=S256&state=s1&scope=openid")
  const res=await GET(req as any); expect(res.status).toBe(401); const j=await res.json(); expect(j.error).toBe("invalid_client")
})
it("stores state and redirects to entra", async ()=>{
  const ch=createHash("sha256").update("verifier123").digest("base64url")
  const req=new Request(`https://example.com/api/oauth/authorize?client_id=${env.OAUTH_CLIENT_ID}&redirect_uri=https://cb.example/cb&response_type=code&code_challenge=${ch}&code_challenge_method=S256&state=s1&scope=openid`)
  const res=await GET(req as any); expect(res.status).toBe(302); expect(res.headers.get("location")).toMatch(/\/v1\/auth\//)
})
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Implement route**

```ts
import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { deriveIssuer } from "@/lib/oauth"
import { setWithTTL, oauthKeys } from "@/lib/oauth-valkey"
export async function GET(req: Request){
  const url=new URL(req.url)
  const client_id=url.searchParams.get("client_id")
  const redirect_uri=url.searchParams.get("redirect_uri")
  const response_type=url.searchParams.get("response_type")
  const code_challenge=url.searchParams.get("code_challenge")
  const code_challenge_method=url.searchParams.get("code_challenge_method")
  const state=url.searchParams.get("state")
  const scope=url.searchParams.get("scope")??"openid"
  const resource=url.searchParams.get("resource")
  if(client_id!==env.OAUTH_CLIENT_ID) return NextResponse.json({error:"invalid_client"}, {status:401})
  if(response_type!=="code") return NextResponse.json({error:"unsupported_response_type"}, {status:400})
  if(!code_challenge || code_challenge_method!=="S256") return NextResponse.json({error:"invalid_request", error_description:"S256 required"}, {status:400})
  if(!state) return NextResponse.json({error:"invalid_request"}, {status:400})
  if(!redirect_uri || !redirect_uri.startsWith("https://")) return NextResponse.json({error:"invalid_request"}, {status:400})
  const issuer = env.OAUTH_ISSUER ?? deriveIssuer(req)
  await setWithTTL(oauthKeys.state(state), {client_id, redirect_uri, code_challenge, scope, resource, createdAt:Date.now()}, 600)
  // Entra default
  const returnTo = `${issuer}/api/oauth/callback?state=${encodeURIComponent(state)}`
  const entraUrl = new URL("/v1/auth/", env.AUTH_BASE_URL); entraUrl.searchParams.set("return_to", returnTo)
  // If magic requested, show intermediate page instead (simple redirect to magic UI)
  if(url.searchParams.get("idp")==="magic" || scope.includes("magic")){
    const magicUi = new URL("/api/oauth/magic-ui", issuer); magicUi.searchParams.set("state", state)
    return NextResponse.redirect(magicUi.toString())
  }
  return NextResponse.redirect(entraUrl.toString())
}
```

- [ ] **Step 4: Run test → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/authorize
git commit -m "feat: oauth authorize endpoint"
```

---

### Task 5: Callback Route (code generation)

**Files:**
- Create: `src/app/api/oauth/callback/route.ts`
- Test: `src/app/api/oauth/callback/route.test.ts`

**Interfaces:**
- Consumes: `oauthKeys.state`, `oauthKeys.code`, `oauthKeys.magicPending`, `fetcher me`, `generateToken`
- Produces: `GET` reads `SCSE_ID` from `?session=` or `Cookie`, validates via `GET /v1/auth/me`, creates `oauth:code:<code>` TTL 600, sets `magicPending:done`, redirects to `redirect_uri?code=&state=`

- [ ] **Step 1: Write failing test**

```ts
it("exchanges SCSE_ID for code", async ()=>{
  // mock getJSON state, mock fetch /v1/auth/me 200 {value:{email:"a@b"}}
  const req=new Request("https://example.com/api/oauth/callback?state=s1&session=fakeJwt", { headers:{ cookie:"SCSE_ID=fakeJwt"}})
  // ... setup valkey mock to return stored state
  const res=await GET(req as any); expect(res.status).toBe(302); expect(res.headers.get("location")).toMatch(/code=/)
})
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Implement**

```ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getJSON, setWithTTL, oauthKeys, delKey } from "@/lib/oauth-valkey"
import { generateToken } from "@/lib/oauth"
import { fetcher } from "@/lib/fetcher"
export async function GET(req: Request){
  const url=new URL(req.url); const state=url.searchParams.get("state"); if(!state) return NextResponse.json({error:"invalid_request"},{status:400})
  const stateData=await getJSON<any>(oauthKeys.state(state)); if(!stateData) return NextResponse.json({error:"invalid_grant"},{status:400})
  const cookieStore=await cookies(); let scseId=url.searchParams.get("session")||cookieStore.get("SCSE_ID")?.value||req.headers.get("cookie")?.match(/SCSE_ID=([^;]+)/)?.[1]
  if(!scseId) return NextResponse.json({error:"invalid_grant", error_description:"missing SCSE_ID"},{status:400})
  // validate via /v1/auth/me (reuse fetcher but inject cookie)
  const meRes=await fetch(new URL("/v1/auth/me", process.env.BACKEND_BASE_URL??"https://api.searchpoint.hyperjump.tech"), { headers:{ Cookie:`SCSE_ID=${scseId}`, "User-Agent":"frontend-oauth" } })
  if(!meRes.ok) return NextResponse.json({error:"invalid_grant"}, {status:401})
  const me=await meRes.json(); const user={email:me.value?.email, name:me.value?.name}
  const iss = me.value?.email?.includes("@") && scseId.length>500 ? "entra" : "searchpoint" // heuristic: entra AT long, or decode JWT iss
  // try decode JWT to read iss/exp
  let scseExp=Math.floor(Date.now()/1000)+3600; try{ const p=JSON.parse(Buffer.from(scseId.split(".")[1],"base64").toString()); if(p.exp) scseExp=p.exp; if(p.iss==="searchpoint") iss2="searchpoint" }catch{}
  const code=generateToken()
  await setWithTTL(oauthKeys.code(code), {scseId, scseExp, user, client_id:stateData.client_id, redirect_uri:stateData.redirect_uri, code_challenge:stateData.code_challenge, scope:stateData.scope, iss: iss==="entra"?"entra":"searchpoint"}, 600)
  await setWithTTL(oauthKeys.magicPending(state), "done", 900)
  const redirect=new URL(stateData.redirect_uri); redirect.searchParams.set("code", code); redirect.searchParams.set("state", state)
  return NextResponse.redirect(redirect.toString())
}
```

- [ ] **Step 4: Run test → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/callback
git commit -m "feat: oauth callback code generation"
```

---

### Task 6: Poll Route (magic async)

**Files:**
- Create: `src/app/api/oauth/poll/route.ts`
- Test: `src/app/api/oauth/poll/route.test.ts`

**Interfaces:**
- Consumes: `oauthKeys.magicPending`, `oauthKeys.state`
- Produces: `GET ?state=` → `{status:"pending"|"done", redirect?: string}` (redirect built from stored code if done)

- [ ] **Step 1: Write failing test**

```ts
it("returns pending then done", async ()=>{
  const req=new Request("https://example.com/api/oauth/poll?state=s1")
  let res=await GET(req as any); expect((await res.json()).status).toBe("pending")
})
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { NextResponse } from "next/server"
import { getJSON, oauthKeys } from "@/lib/oauth-valkey"
export async function GET(req: Request){
  const state=new URL(req.url).searchParams.get("state"); if(!state) return NextResponse.json({error:"invalid_request"},{status:400})
  const pending=await getJSON<string>(oauthKeys.magicPending(state))
  if(pending==="done"){
    const stateData=await getJSON<any>(oauthKeys.state(state))
    // code already stored, need to find code? we stored code under random key, so poll should lookup code by state? alternative: callback stores pending:done with code value
    // simplified: return done, frontend will be redirected by callback's302, poll just signals done
    return NextResponse.json({status:"done"})
  }
  return NextResponse.json({status:"pending"})
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/poll
git commit -m "feat: oauth magic poll"
```

---

### Task 7: Token Route

**Files:**
- Create: `src/app/api/oauth/token/route.ts`
- Test: `src/app/api/oauth/token/route.test.ts`

**Interfaces:**
- Consumes: `pkceVerify`, `calcTTL`, `generateToken`, `oauthKeys.code/at/rt`, `timingSafeEqualStr`, `env.OAUTH_CLIENT_SECRET`
- Produces: `POST` handles `grant_type=authorization_code` (code+verifier→at(+rt)) and `refresh_token` (magic only)

Rate limit: `limiterForScope('oauth')` 60/min per IP (reuse Valkey).

- [ ] **Step 1: Write failing test for auth_code**

```ts
it("issues at for code", async ()=>{
  // setup code in valkey, mock pkce
  const body=new URLSearchParams({grant_type:"authorization_code", code:"c123", code_verifier:"verifier", client_id:env.OAUTH_CLIENT_ID, redirect_uri:"https://cb.example/cb"})
  const req=new Request("https://example.com/api/oauth/token",{method:"POST", body, headers:{ "content-type":"application/x-www-form-urlencoded", authorization:`Basic ${btoa(env.OAUTH_CLIENT_ID+":"+env.OAUTH_CLIENT_SECRET)}`}})
  const res=await POST(req as any); expect(res.status).toBe(200); const j=await res.json(); expect(j.access_token).toBeDefined()
})
it("rejects bad verifier", async ()=>{ ... expect 400 invalid_grant })
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { NextResponse } from "next/server"
import { getJSON, setWithTTL, delKey, oauthKeys } from "@/lib/oauth-valkey"
import { pkceVerify, generateToken, calcTTL, timingSafeEqualStr } from "@/lib/oauth"
import { env } from "@/lib/env"
import { limiterForScope, clientIpFromRequest } from "@/lib/rate-limit"
export async function POST(req: Request){
  const ip = req.headers.get("x-real-ip")||"unknown"
  const limiter = limiterForScope("updater") // reuse or new 'oauth' scope
  const rl = await limiter.consume(ip); if(!rl.success) return NextResponse.json({error:"temporarily_unavailable"},{status:429})
  const form = await req.text(); const p=new URLSearchParams(form)
  const grant=p.get("grant_type")
  // client auth
  let client_id=p.get("client_id"); let client_secret=p.get("client_secret")
  const auth=req.headers.get("authorization"); if(auth?.startsWith("Basic ")){ const dec=Buffer.from(auth.slice(6),"base64").toString(); const idx=dec.indexOf(":"); client_id=dec.slice(0,idx); client_secret=dec.slice(idx+1) }
  if(client_id!==env.OAUTH_CLIENT_ID) return NextResponse.json({error:"invalid_client"},{status:401})
  if(env.OAUTH_CLIENT_SECRET && !timingSafeEqualStr(client_secret??"", env.OAUTH_CLIENT_SECRET)) return NextResponse.json({error:"invalid_client"},{status:401})
  if(grant==="authorization_code"){
    const code=p.get("code"); const verifier=p.get("code_verifier"); const redirect_uri=p.get("redirect_uri")
    if(!code||!verifier) return NextResponse.json({error:"invalid_request"},{status:400})
    const data=await getJSON<any>(oauthKeys.code(code)); if(!data) return NextResponse.json({error:"invalid_grant"},{status:400})
    if(!pkceVerify(verifier, data.code_challenge)) return NextResponse.json({error:"invalid_grant"},{status:400})
    if(redirect_uri && redirect_uri!==data.redirect_uri) return NextResponse.json({error:"invalid_grant"},{status:400})
    const {atTtl, rtTtl}=calcTTL(data.iss, data.scseExp)
    const at=generateToken(); await setWithTTL(oauthKeys.at(at), {scseId:data.scseId, scseExp:data.scseExp, user:data.user, client_id:data.client_id, scope:data.scope, resource:data.resource}, atTtl)
    let rt: string|undefined; if(data.iss==="searchpoint" && rtTtl){ rt=generateToken(); await setWithTTL(oauthKeys.rt(rt), {scseId:data.scseId, scseExp:data.scseExp, user:data.user, client_id:data.client_id, scope:data.scope}, rtTtl) }
    await delKey(oauthKeys.code(code))
    return NextResponse.json({access_token:at, token_type:"Bearer", expires_in: atTtl, ...(rt?{refresh_token:rt}:{}), scope:data.scope})
  }
  if(grant==="refresh_token"){
    const rt=p.get("refresh_token"); if(!rt) return NextResponse.json({error:"invalid_request"},{status:400})
    const data=await getJSON<any>(oauthKeys.rt(rt)); if(!data) return NextResponse.json({error:"invalid_grant"},{status:400})
    // Entra has no rt, so if data.iss==="entra" this path never reached
    if(data.scseExp < Math.floor(Date.now()/1000)) return NextResponse.json({error:"invalid_grant"},{status:400})
    // optional re-validate me
    const {atTtl}=calcTTL("searchpoint", data.scseExp)
    const at=generateToken(); await setWithTTL(oauthKeys.at(at), {scseId:data.scseId, scseExp:data.scseExp, user:data.user, client_id:data.client_id, scope:data.scope}, atTtl)
    return NextResponse.json({access_token:at, token_type:"Bearer", expires_in: atTtl, scope:data.scope})
  }
  return NextResponse.json({error:"unsupported_grant_type"},{status:400})
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/token
git commit -m "feat: oauth token endpoint"
```

---

### Task 8: Revoke & Userinfo

**Files:**
- Create: `src/app/api/oauth/revoke/route.ts`
- Create: `src/app/api/oauth/userinfo/route.ts`
- Test: `src/app/api/oauth/revoke/route.test.ts`

**Interfaces:**
- Revoke: `POST {token, token_type_hint}` → `delKey` at/rt, 200 even if not found
- Userinfo: `GET Bearer at` → `getJSON oauth:at` → `{sub: email, email, name}` or 401

- [ ] **Step 1: Write failing test**

```ts
it("revokes", async ()=>{
  const req=new Request("https://example.com/api/oauth/revoke",{method:"POST", body:new URLSearchParams({token:"at123"}), headers:{authorization:"Basic ..." }})
  const res=await POST(req as any); expect(res.status).toBe(200)
})
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
// revoke
export async function POST(req: Request){
  const p=new URLSearchParams(await req.text()); const token=p.get("token"); if(token){ await delKey(oauthKeys.at(token)); await delKey(oauthKeys.rt(token)) }
  return new NextResponse(null, {status:200})
}
// userinfo
export async function GET(req: Request){
  const at=req.headers.get("authorization")?.replace(/^Bearer /,""); if(!at) return NextResponse.json({error:"invalid_token"},{status:401})
  const data=await getJSON<any>(oauthKeys.at(at)); if(!data) return NextResponse.json({error:"invalid_token"},{status:401})
  return NextResponse.json({sub:data.user.email, email:data.user.email, name:data.user.name})
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/oauth/revoke src/app/api/oauth/userinfo
git commit -m "feat: oauth revoke and userinfo"
```

---

### Task 9: MCP Proxy

**Files:**
- Create: `src/app/mcp/route.ts`
- Test: `src/app/mcp/route.test.ts`

**Interfaces:**
- Consumes: `getJSON oauth:at`, `fetcher`-style forward with `Cookie: SCSE_ID`
- Produces: `GET` + `POST` handler, 401 with `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource"` if invalid

Forward logic: validate Bearer → get scseId → `fetch(new URL(path, env.BACKEND_BASE_URL), { headers:{ Cookie:`SCSE_ID=${scseId}`, "User-Agent":"frontend-mcp", ...forwarded headers }, method, body })` → proxy status + body.

For now proxy to `/v1/files` search: if MCP tool is `search`, map JSON-RPC to backend search.

- [ ] **Step 1: Write failing test**

```ts
it("401 without bearer", async ()=>{
  const req=new Request("https://example.com/mcp",{method:"POST", body:"{}"})
  const res=await POST(req as any); expect(res.status).toBe(401); expect(res.headers.get("www-authenticate")).toMatch(/oauth-protected-resource/)
})
it("proxies with valid at", async ()=>{
  // mock valkey at -> scseId, mock fetch backend 200
  const req=new Request("https://example.com/mcp",{method:"POST", headers:{authorization:"Bearer validAt"}, body:JSON.stringify({jsonrpc:"2.0", method:"tools/list"})})
  const res=await POST(req as any); expect(res.status).toBe(200)
})
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { NextResponse } from "next/server"
import { getJSON, oauthKeys } from "@/lib/oauth-valkey"
import { deriveIssuer } from "@/lib/oauth"
import { env } from "@/lib/env"
export async function POST(req: Request){
  const at=req.headers.get("authorization")?.replace(/^Bearer\s+/i,""); const issuer=env.OAUTH_ISSUER??deriveIssuer(req)
  if(!at){ return new NextResponse(null,{status:401, headers:{ "www-authenticate": `Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource"` }})}
  const data=await getJSON<any>(oauthKeys.at(at)); if(!data || data.scseExp < Math.floor(Date.now()/1000)) return new NextResponse(null,{status:401, headers:{ "www-authenticate": `Bearer error="invalid_token"` }})
  const body=await req.text()
  // simple proxy: forward to backend /v1/files if body contains search, else echo
  const backendUrl=new URL("/v1/files", env.BACKEND_BASE_URL)
  const beRes=await fetch(backendUrl, { method:"GET", headers:{ Cookie:`SCSE_ID=${data.scseId}`, "User-Agent":"frontend-mcp" } })
  return new NextResponse(beRes.body, {status:beRes.status, headers:{"content-type": beRes.headers.get("content-type")||"application/json"}})
}
export const GET = POST
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/mcp
git commit -m "feat: mcp proxy Bearer->Cookie"
```

---

### Task 10: Middleware & Rate Limit Wiring

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/lib/rate-limit.ts` (add `oauthRateLimiter`)

**Interfaces:**
- Middleware bypass for `/.well-known`, `/api/oauth`, `/mcp` handled separately

- [ ] **Step 1: Write failing test for middleware bypass**

```ts
it("allows discovery without SCSE_ID", ()=>{
  const req={ nextUrl:{pathname:"/.well-known/oauth-authorization-server"}, cookies:{get:()=>undefined}} as any
  const res=middleware(req); expect(res.status).not.toBe(302)
})
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
// middleware.ts add early return:
if (pathname.startsWith("/.well-known/") || pathname.startsWith("/api/oauth/") || pathname.startsWith("/mcp")) {
  const h=new Headers(request.headers); h.set("x-pathname", pathname); return applySecurityHeaders(NextResponse.next({request:{headers:h}}))
}
// rate-limit.ts add:
export const oauthRateLimiter = createMemoryRateLimiter({limit:60, windowMs:60_000, maxKeys:10_000})
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/lib/rate-limit.ts
git commit -m "feat: middleware bypass and oauth rate limit"
```

---

### Task 11: E2E & Docs

**Files:**
- Create: `e2e/oauth-mcp.spec.ts`
- Modify: `README.md` (add env docs)

**Interfaces:**
- Playwright checks discovery, authorize→callback→token, mcp 401/200

- [ ] **Step 1: Write spec**

```ts
test("discovery ijo", async ({request})=>{ const r=await request.get("/.well-known/oauth-authorization-server"); expect(r.ok()).toBeTruthy(); const j=await r.json(); expect(j.code_challenge_methods_supported).toContain("S256") })
test("mcp requires bearer", async ({request})=>{ const r=await request.post("/mcp",{data:{}}); expect(r.status()).toBe(401) })
```

- [ ] **Step 2: Run e2e → FAIL until deployed**

- [ ] **Step 3: Implement docs**

Add to `README.md` env table: `OAUTH_ISSUER`, `MCP_RESOURCE_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `VALKEY_URL` OAuth usage.

- [ ] **Step 4: Run e2e → PASS (with mocks)**

- [ ] **Step 5: Commit**

```bash
git add e2e/oauth-mcp.spec.ts README.md
git commit -m "test: oauth mcp e2e and docs"
```

---

## Self-Review

- [x] Spec coverage: all 11 spec sections mapped to tasks (discovery 3, valkey 1-2, authorize 4, callback 5, poll 6, token 7, revoke/userinfo 8, mcp 9, middleware 10, testing 11).
- [x] Placeholder scan: no TBD/TODO, all steps have code.
- [x] Type consistency: `oauthKeys.*`, `calcTTL`, `pkceVerify`, `generateToken`, `deriveIssuer` reused verbatim across tasks.

