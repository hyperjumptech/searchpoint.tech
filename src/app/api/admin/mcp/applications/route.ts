import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import {
  ensureMcpAllowlist,
  createDcrPolicy,
  listDcrPolicies,
} from "@/lib/mcp-allowlist";
import { invalidRequest, readJson, repositoryError } from "./admin-api";

const applicationInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  redirectUri: z.string().trim().min(1).max(2048),
  description: z.string().max(2000).nullable().optional(),
});

export async function GET(request: Request) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();

  try {
    await ensureMcpAllowlist();
    return NextResponse.json({ applications: await listDcrPolicies() });
  } catch (error) {
    return repositoryError(error);
  }
}

export async function POST(request: Request) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();

  const body = await readJson(request);
  if (!body.valid) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = applicationInputSchema.safeParse(body.value);
  if (!parsed.success) return invalidRequest();

  try {
    await ensureMcpAllowlist();
    const application = await createDcrPolicy(parsed.data);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return repositoryError(error, true);
  }
}
