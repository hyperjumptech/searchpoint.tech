import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import {
  getStaticClient,
  updateStaticClient,
  revokeStaticClient,
  StaticClientValidationError,
} from "@/lib/oauth-static-client";
import {
  invalidRequest,
  readJson,
  repositoryError,
} from "../../applications/admin-api";

const idSchema = z.string().trim().min(1).max(255);
const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    redirectUri: z.string().trim().min(1).max(2048).optional(),
    scopes: z.array(z.string().trim().min(1)).min(1).optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

async function getId(context: { params: Promise<{ id: string }> }) {
  const value = (await context.params).id;
  return idSchema.safeParse(value).success ? value : undefined;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  const id = await getId(context);
  if (!id) return invalidRequest();
  try {
    const client = await getStaticClient(id);
    return client
      ? NextResponse.json({ client })
      : NextResponse.json({ error: "Client not found" }, { status: 404 });
  } catch (error) {
    return repositoryError(error);
  }
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  const id = await getId(context);
  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body.valid ? body.value : undefined);
  if (!id || !parsed.success) return invalidRequest();
  try {
    const client = await updateStaticClient(id, parsed.data);
    return client
      ? NextResponse.json({ client })
      : NextResponse.json({ error: "Client not found" }, { status: 404 });
  } catch (error) {
    return error instanceof StaticClientValidationError
      ? invalidRequest()
      : repositoryError(error);
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  const id = await getId(context);
  if (!id) return invalidRequest();
  try {
    const client = await revokeStaticClient(id);
    return client
      ? NextResponse.json({ client })
      : NextResponse.json({ error: "Client not found" }, { status: 404 });
  } catch (error) {
    return repositoryError(error);
  }
}
