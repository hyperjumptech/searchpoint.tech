import { NextResponse } from "next/server";
import { fetchChangelogPosts } from "@/lib/changelog";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const posts = await fetchChangelogPosts();
    const latest = posts.length > 0 ? posts[0] : null;

    return NextResponse.json(
      {
        latest,
        posts,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Failed to fetch changelog:", error);
    return NextResponse.json(
      { error: "Failed to fetch changelog" },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
