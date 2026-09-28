import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchChangelogPosts,
  fetchChangelogPostBySlug,
  loadFallbackPosts,
  preprocessChangelogContent,
} from "./changelog";

describe("changelog service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads fallback posts properly from disk", () => {
    const fallbacks = loadFallbackPosts();
    expect(fallbacks.length).toBeGreaterThanOrEqual(3);

    const post29 = fallbacks.find((p) => p.slug === "0.29.0");
    expect(post29).toBeDefined();
    expect(post29?.version).toBe("0.29.0");
    expect(post29?.title).toContain("On-device Concept Engine");
    expect(post29?.content).toContain("Improvements");
  });

  it("sorts fallback posts in descending chronological order", () => {
    const fallbacks = loadFallbackPosts();
    expect(fallbacks[0].version).toBe("0.29.0");
    expect(fallbacks[1].version).toBe("0.28.0");
    expect(fallbacks[2].version).toBe("0.27.0");
  });

  it("fetches post by slug from fallback when network is unavailable", async () => {
    // Force fetch to fail so it falls back
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network offline"));

    const post = await fetchChangelogPostBySlug("0.29.0");
    expect(post).not.toBeNull();
    expect(post?.version).toBe("0.29.0");
    expect(post?.title).toBe("On-device Concept Engine & Responsive UI");
  });

  it("returns null for non-existent slug", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network offline"));

    const post = await fetchChangelogPostBySlug("999.999.999");
    expect(post).toBeNull();
  });

  it("fetches and parses posts from mock GitHub contents API", async () => {
    const mockGitHubContents = [
      {
        name: "1.0.0.md",
        path: "changelog/1.0.0.md",
        sha: "abc123",
        download_url:
          "https://raw.githubusercontent.com/test/repo/main/changelog/1.0.0.md",
        type: "file",
      },
    ];

    const mockMarkdown = `---
title: "Major Milestone 1.0"
version: "1.0.0"
date: "2026-10-01"
badge: "Major"
summary: "SearchPoint 1.0 has landed!"
---
## Features
- Complete overhaul
`;

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("api.github.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockGitHubContents,
        } as unknown as Response;
      }
      if (urlStr.includes("1.0.0.md")) {
        return {
          ok: true,
          status: 200,
          text: async () => mockMarkdown,
        } as unknown as Response;
      }
      return { ok: false, status: 404 } as unknown as Response;
    });

    const posts = await fetchChangelogPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].version).toBe("1.0.0");
    expect(posts[0].title).toBe("Major Milestone 1.0");
    expect(posts[0].badge).toBe("Major");
  });

  it("preprocesses relative video tags and rewrites them to media proxy API", () => {
    const raw = `<video src="./videos/ai-renamer-rule.mp4" autoPlay loop muted playsInline controls></video>`;
    const processed = preprocessChangelogContent(raw);

    expect(processed).toContain("<Video");
    expect(processed).toContain(
      'src="/api/changelog/media?path=videos%2Fai-renamer-rule.mp4"',
    );
    expect(processed).toContain("</Video>");
  });

  it("preprocesses GitHub web URLs in video tags to media proxy API", () => {
    const raw = `<video src="https://github.com/hyperjumptech/searchpoint/blob/main/changelog/videos/demo.mp4" controls />`;
    const processed = preprocessChangelogContent(raw);

    expect(processed).toContain("<Video");
    expect(processed).toContain(
      `src="/api/changelog/media?url=${encodeURIComponent("https://github.com/hyperjumptech/searchpoint/blob/main/changelog/videos/demo.mp4")}"`,
    );
  });
});
