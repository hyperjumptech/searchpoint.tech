import { NextRequest, NextResponse } from "next/server";
import { companyFromHostname } from "@/lib/company";
import fs from "fs";
import path from "path";

export function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const company = companyFromHostname(
    request.nextUrl.searchParams.get("company")
      ? `${host}?company=${request.nextUrl.searchParams.get("company")}`
      : host,
  );

  const filePath = path.join(
    process.cwd(),
    "public",
    "favicons",
    `${company}.ico`,
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
