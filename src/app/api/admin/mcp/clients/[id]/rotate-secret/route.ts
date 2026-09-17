import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import {
  rotateStaticClientSecret,
  StaticClientNotFoundError,
} from "@/lib/oauth-static-client";
import {
  invalidRequest,
  repositoryError,
} from "../../../applications/admin-api";

const idSchema = z.string().trim().min(1).max(255);
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  const id = (await context.params).id;
  if (!idSchema.safeParse(id).success) return invalidRequest();
  try {
    return NextResponse.json(await rotateStaticClientSecret(id));
  } catch (error) {
    return error instanceof StaticClientNotFoundError
      ? NextResponse.json({ error: "Client not found" }, { status: 404 })
      : repositoryError(error);
  }
}
