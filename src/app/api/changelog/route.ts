import { NextResponse } from "next/server";
import { fetchChangelogPosts } from "@/lib/changelog";
import { env } from "@/lib/env";
import { resolveTenantId } from "@/lib/tenant";

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

function resolveRequestHostOrUrl(request?: Request): string {
  if (!request) return "";
  const forwardedHost =
    request.headers?.get("x-hostname") ||
    request.headers?.get("x-forwarded-host") ||
    request.headers?.get("host") ||
    "";
  if (request.url) {
    try {
      const parsed = new URL(request.url);
      if (parsed.search) {
        return `${forwardedHost || parsed.host}${parsed.search}`;
      }
      return forwardedHost || parsed.host;
    } catch {
      return forwardedHost || request.url;
    }
  }
  return forwardedHost;
}

export async function GET(request?: Request) {
  try {
    const variant = request
      ? resolveTenantId(env.TENANT, resolveRequestHostOrUrl(request))
      : undefined;
    const posts = await fetchChangelogPosts(variant);
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
