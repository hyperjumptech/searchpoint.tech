import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, OPTIONS } from "./route";
import * as changelogLib from "@/lib/changelog";

describe("/api/changelog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles OPTIONS preflight with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("returns latest and posts array with CORS headers when posts exist", async () => {
    const mockPosts: changelogLib.ChangelogPost[] = [
      {
        slug: "0.29.0",
        title: "Version 0.29.0",
        version: "0.29.0",
        date: "2026-09-17",
        summary: "Summary for 0.29.0",
        content: "Content for 0.29.0",
      },
      {
        slug: "0.28.0",
        title: "Version 0.28.0",
        version: "0.28.0",
        date: "2026-09-01",
        summary: "Summary for 0.28.0",
        content: "Content for 0.28.0",
      },
    ];

    vi.spyOn(changelogLib, "fetchChangelogPosts").mockResolvedValueOnce(
      mockPosts,
    );

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");

    const data = await res.json();
    expect(data.latest).toEqual(mockPosts[0]);
    expect(data.posts).toEqual(mockPosts);
  });

  it("handles empty posts list gracefully with CORS headers", async () => {
    vi.spyOn(changelogLib, "fetchChangelogPosts").mockResolvedValueOnce([]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");

    const data = await res.json();
    expect(data.latest).toBeNull();
    expect(data.posts).toEqual([]);
  });

  it("returns 500 with CORS headers when fetchChangelogPosts throws an error", async () => {
    vi.spyOn(changelogLib, "fetchChangelogPosts").mockRejectedValueOnce(
      new Error("Fetch failed"),
    );

    const res = await GET();
    expect(res.status).toBe(500);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");

    const data = await res.json();
    expect(data.error).toBe("Failed to fetch changelog");
  });
});
