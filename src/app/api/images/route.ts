import { NextRequest, NextResponse } from "next/server";
import { performSearch } from "@/actions/search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const sources = searchParams.get("sources") ?? null;

    // Calculate page from offset and limit
    const page = Math.floor(offset / limit) + 1;

    const data = await performSearch(query, page, limit, "image", sources);

    // Calculate hasMore based on the current offset and limit
    const currentOffset = offset;
    const hasMore = currentOffset + data.results.length < data.pagination.total;

    return NextResponse.json({
      results: data.results,
      pagination: data.pagination,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
