import "server-only";

import { NextResponse } from "next/server";

import {
  AllowlistValidationError,
  DuplicateDcrPolicyError,
} from "@/lib/mcp-allowlist";

export function invalidRequest() {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export function repositoryError(error: unknown, mapKnownErrors = false) {
  if (mapKnownErrors && error instanceof DuplicateDcrPolicyError) {
    return NextResponse.json(
      { error: "A policy with this redirect URI already exists" },
      { status: 409 },
    );
  }
  if (mapKnownErrors && error instanceof AllowlistValidationError) {
    return invalidRequest();
  }
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

export async function readJson(
  request: Request,
): Promise<{ value?: unknown; valid: boolean }> {
  try {
    return { value: await request.json(), valid: true };
  } catch {
    return { valid: false };
  }
}
