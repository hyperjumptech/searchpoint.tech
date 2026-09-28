import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-revalidate-secret");

  if (env.REVALIDATION_SECRET && secret !== env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: "Invalid revalidation secret" },
      { status: 401 },
    );
  }

  try {
    revalidateTag("changelog");
    revalidatePath("/changelog");
    revalidatePath("/changelog/[slug]", "page");

    return NextResponse.json({
      revalidated: true,
      tag: "changelog",
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error revalidating changelog",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
