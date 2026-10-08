import * as fs from "fs";
import * as path from "path";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function parseRange(
  rangeHeader: string,
  size: number,
): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : size - 1;

  if (isNaN(start)) start = 0;
  if (isNaN(end) || end >= size) end = size - 1;
  if (start > end) return null;

  return { start, end };
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
  "Access-Control-Expose-Headers":
    "Content-Range, Content-Length, Accept-Ranges",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function createMediaResponse(
  buffer: Buffer,
  contentType: string,
  rangeHeader: string | null,
): Response {
  const totalSize = buffer.byteLength;

  if (rangeHeader) {
    const range = parseRange(rangeHeader, totalSize);
    if (range) {
      const { start, end } = range;
      const chunk = buffer.subarray(start, end + 1);

      return new Response(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.byteLength),
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Length": String(totalSize),
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const urlParam = searchParams.get("url");
  const pathParam = searchParams.get("path");

  if (!urlParam && !pathParam) {
    return NextResponse.json(
      { error: "Missing required 'path' or 'url' query parameter" },
      { status: 400 },
    );
  }

  let filename = "media.mp4";
  let targetUrl: string | null = null;

  if (pathParam) {
    const cleanPath = pathParam.replace(/^\.\//, "");
    if (cleanPath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    filename = cleanPath.split("/").pop() || "media.mp4";

    // 1. Check local fallback files first
    const localFallbackPath = path.resolve(
      process.cwd(),
      "src",
      "changelog",
      "fallback-posts",
      cleanPath,
    );

    if (fs.existsSync(localFallbackPath)) {
      try {
        const fileBuffer = fs.readFileSync(localFallbackPath);
        return createMediaResponse(
          fileBuffer,
          getContentType(filename),
          request.headers.get("range"),
        );
      } catch (err) {
        console.error("Failed to read local fallback media:", err);
      }
    }

    // 2. Build GitHub Raw URL
    const repo = env.CHANGELOG_GITHUB_REPO;
    const branch = env.CHANGELOG_GITHUB_BRANCH;
    const dir = env.CHANGELOG_GITHUB_DIR;

    if (!repo) {
      return NextResponse.json(
        { error: "Changelog repository not configured" },
        { status: 404 },
      );
    }

    let fullPath = cleanPath;
    if (dir && !cleanPath.startsWith(`${dir}/`)) {
      fullPath = `${dir}/${cleanPath}`;
    }
    targetUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${fullPath}`;
  } else if (urlParam) {
    let resolved = urlParam;

    // Convert github.com/.../blob/... to raw.githubusercontent.com/...
    const blobMatch = resolved.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
    );
    if (blobMatch) {
      const [, owner, repo, branch, filePath] = blobMatch;
      resolved = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    }

    targetUrl = resolved;
    filename = urlParam.split("/").pop()?.split("?")[0] || "media.mp4";
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "SearchPoint-Web",
    };

    if (env.CHANGELOG_GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.CHANGELOG_GITHUB_TOKEN}`;
    }

    const res = await fetch(targetUrl, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream media returned ${res.status}` },
        { status: res.status },
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return createMediaResponse(
      buffer,
      getContentType(filename),
      request.headers.get("range"),
    );
  } catch (error) {
    console.error("Failed to proxy changelog media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 502 },
    );
  }
}
