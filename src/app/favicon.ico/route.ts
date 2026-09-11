import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { env } from "@/lib/env";
import { resolveTenantId } from "@/lib/tenant";

export function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  // TENANT pins the deployment. The ?company= override is deliberately gone:
  // a deployment must not be able to serve another tenant's icon on request.
  const tenant = resolveTenantId(env.TENANT, host);

  const filePath = path.join(
    process.cwd(),
    "public",
    "favicons",
    `${tenant}.ico`,
  );

  try {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
