import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import {
  ensureMcpAllowlist,
  deleteDcrPolicy,
  updateDcrPolicy,
} from "@/lib/mcp-allowlist";
import { invalidRequest, readJson, repositoryError } from "../admin-api";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    redirectUri: z.string().trim().min(1).max(2048).optional(),
    description: z.string().max(2000).nullable().optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const idSchema = z.string().trim().min(1).max(255);

async function getId(context: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : undefined;
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
    await ensureMcpAllowlist();
    const application = await updateDcrPolicy(id, parsed.data);
    if (!application) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json(application);
  } catch (error) {
    return repositoryError(error, true);
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
    await ensureMcpAllowlist();
    const deleted = await deleteDcrPolicy(id);
    if (!deleted) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return repositoryError(error);
  }
}
