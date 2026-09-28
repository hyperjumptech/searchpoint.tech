import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = (pathSegments || []).join("/");

  const targetUrl = new URL(
    `/api/changelog/media?path=${encodeURIComponent(`videos/${filePath}`)}`,
    request.url,
  );

  return NextResponse.rewrite(targetUrl);
}
