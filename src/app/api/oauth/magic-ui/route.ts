import { NextResponse } from "next/server";

import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

export async function GET(req: Request) {
  const state = new URL(req.url).searchParams.get("state");
  if (!state)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const stateData = await getJSON(oauthKeys.state(state));
  if (!stateData)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const esc = state.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in to SearchPoint</title>
<style>
body{font-family:system-ui,sans-serif;background:#f6f7f9;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;max-width:24rem;width:100%;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h1{font-size:1.25rem;margin:0 0 1rem}
input{width:100%;box-sizing:border-box;padding:.6rem;border:1px solid #d1d5db;border-radius:8px;margin-bottom:.75rem;font-size:1rem}
button{width:100%;padding:.6rem;background:#111827;color:#fff;border:0;border-radius:8px;font-size:1rem;cursor:pointer}
button:disabled{opacity:.6}
#msg{margin-top:.75rem;font-size:.9rem;color:#374151;min-height:1.2em}
</style>
</head>
<body>
<div class="card">
<h1>Sign in to SearchPoint</h1>
<form id="f">
<input type="hidden" name="state" value="${esc}">
<input type="email" name="email" placeholder="you@example.com" required autofocus>
<button type="submit">Send magic link</button>
</form>
<p id="msg"></p>
</div>
<script>
const msg=document.getElementById('msg'),f=document.getElementById('f'),state=f.state.value;
f.addEventListener('submit',async e=>{
e.preventDefault();
f.email.disabled=true;f.querySelector('button').disabled=true;
const r=await fetch('/api/oauth/magic-ui/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,state})});
const j=await r.json();
if(!j.success){msg.textContent=j.error||'Something went wrong';f.email.disabled=false;f.querySelector('button').disabled=false;return}
msg.textContent='Check your email';
const poll=async()=>{
const pr=await fetch('/api/oauth/poll?state='+encodeURIComponent(state));
const pj=await pr.json();
if(pj.status==='done'&&pj.redirect){window.location=pj.redirect;return}
setTimeout(poll,3000);
};
poll();
});
</script>
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
