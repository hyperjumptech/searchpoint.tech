import { NextResponse } from "next/server";

import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

type PendingDone = { status: "done"; redirect: string };

export async function GET(req: Request) {
  const state = new URL(req.url).searchParams.get("state");
  if (!state)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const pending = await getJSON<PendingDone | "done">(
    oauthKeys.magicPending(state),
  );
  if (!pending) return NextResponse.json({ status: "pending" });
  // Legacy callback stored the plain string "done"
  if (typeof pending === "string") return NextResponse.json({ status: "done" });
  return NextResponse.json(pending);
}
