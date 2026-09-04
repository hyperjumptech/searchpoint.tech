import { NextResponse } from "next/server";

import {
  generateClientId,
  generateClientSecret,
  MetadataError,
  redirectUriMatches,
  resolveRegisteredByRedirectUri,
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let meta;
  try {
    meta = validateMetadata(body);
  } catch (err) {
    if (err instanceof MetadataError) {
      return NextResponse.json({ error: err.code }, { status: 400 });
    }
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const redirectUri = meta.redirectUris[0];

  // Token is OPTIONAL for clients that don't support initial access tokens
  // (e.g. Open WebUI 0.11.3 sends no Authorization header on DCR). When a
  // token is present it must be valid AND its entry must own this redirect
  // URI. When absent, the redirect_uri alone must match an allowed entry.
  let registered = token?.trim() ? resolveRegisteredToken(token) : null;
  if (registered) {
    if (!redirectUriMatches(registered.redirectUri, redirectUri)) {
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 403 },
      );
    }
  } else {
    registered = resolveRegisteredByRedirectUri(redirectUri);
    if (!registered) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // registrationTokenId doubles as the duplicate-detection key: the per-app
  // token when supplied, else the env entry name (which owns the redirect URI).
  const tokenId = token?.trim() ? token : registered.name;
  const existing = await getClientByTokenRegistration(tokenId);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "client_already_registered" },
      { status: 409 },
    );
  }

  const clientId = generateClientId();
  const authMethod = meta.tokenEndpointAuthMethod;
  const clientSecret =
    authMethod === "none" ? undefined : generateClientSecret();

  await registerClient({
    id: clientId,
    name: meta.clientName ?? registered.name,
    secret: clientSecret,
    redirectUris: meta.redirectUris,
    scope: meta.scope,
    tokenEndpointAuthMethod: authMethod,
    registrationTokenId: tokenId,
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
