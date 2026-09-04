import { NextResponse } from "next/server";

import {
  resolveRegisteredByName,
  resolveRegisteredToken,
} from "@/lib/oauth-dcr";
import { deleteClient, resolveClient } from "@/lib/oauth-dcr-store";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ client_id: string }> },
) {
  const auth = req.headers.get("authorization");
  const credential = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!credential || credential.trim() === "") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // The credential is the per-app token OR the env entry name (clients that
  // registered without a token store the entry name as registrationTokenId).
  const registered =
    resolveRegisteredToken(credential) ?? resolveRegisteredByName(credential);
  if (!registered) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { client_id } = await params;
  const client = await resolveClient(client_id);
  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const tokenId = resolveRegisteredToken(credential)?.token ?? registered.name;
  if (client.registrationTokenId !== tokenId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await deleteClient(client_id);
  return new NextResponse(null, { status: 204 });
}
