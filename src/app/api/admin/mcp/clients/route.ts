import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isAdminBasicAuthValid,
  unauthorizedBasicAuthResponse,
} from "@/lib/admin-basic-auth";
import {
  createStaticClient,
  listStaticClients,
  StaticClientValidationError,
} from "@/lib/oauth-static-client";
import {
  invalidRequest,
  readJson,
  repositoryError,
} from "../applications/admin-api";
import { env } from "@/lib/env.server";

function allowedScopes() {
  const configured = (env.OAUTH_SCOPES ?? "").split(/[\s,]+/).filter(Boolean);
  return configured.includes("search") ? configured : ["search", ...configured];
}

const logoDataUrlSchema = z
  .string()
  .max(20_000)
  .nullable()
  .optional()
  .refine(
    (value) => value == null || value.startsWith("data:image/png;base64,"),
    "invalid logo",
  );

const inputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    redirectUri: z.string().trim().min(1).max(2048),
    scopes: z.array(z.string().trim().min(1)).min(1).optional(),
    logoDataUrl: logoDataUrlSchema,
  })
  .strict();

export async function GET(request: Request) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  try {
    return NextResponse.json({
      clients: await listStaticClients(),
      allowedScopes: allowedScopes(),
    });
  } catch (error) {
    return repositoryError(error);
  }
}

export async function POST(request: Request) {
  if (!isAdminBasicAuthValid(request)) return unauthorizedBasicAuthResponse();
  const body = await readJson(request);
  const parsed = inputSchema.safeParse(body.valid ? body.value : undefined);
  if (!body.valid)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (!parsed.success) return invalidRequest();
  try {
    const result = await createStaticClient(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof StaticClientValidationError) return invalidRequest();
    if ((error as { code?: string })?.code === "23505")
      return NextResponse.json(
        { error: "Client already exists" },
        { status: 409 },
      );
    return repositoryError(error);
  }
}
