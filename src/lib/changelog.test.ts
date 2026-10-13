import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchChangelogPosts,
  fetchChangelogPostBySlug,
  filterChangelogContent,
  loadFallbackPosts,
  parsePostFromRaw,
  preprocessChangelogContent,
} from "./changelog";

describe("changelog service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads fallback posts properly from disk", () => {
    // Act
    const fallbacks = loadFallbackPosts();

    // Assert
    expect(fallbacks.length).toBeGreaterThanOrEqual(3);

    const post29 = fallbacks.find((p) => p.slug === "0.29.0");
    expect(post29).toBeDefined();
    expect(post29?.version).toBe("0.29.0");
    expect(post29?.title).toContain("On-device Concept Engine");
    expect(post29?.content).toContain("Improvements");
  });

  it("sorts fallback posts in descending chronological order", () => {
    // Act
    const fallbacks = loadFallbackPosts();

    // Assert
    expect(fallbacks[0].version).toBe("0.29.0");
    expect(fallbacks[1].version).toBe("0.28.0");
    expect(fallbacks[2].version).toBe("0.27.0");
  });

  it("fetches post by slug from fallback when network is unavailable", async () => {
    // Setup
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network offline"));

    // Act
    const post = await fetchChangelogPostBySlug("0.29.0");

    // Assert
    expect(post).not.toBeNull();
    expect(post?.version).toBe("0.29.0");
    expect(post?.title).toBe("On-device Concept Engine & Responsive UI");
  });

  it("returns null for non-existent slug", async () => {
    // Setup
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network offline"));

    // Act
    const post = await fetchChangelogPostBySlug("999.999.999");

    // Assert
    expect(post).toBeNull();
  });

  it("fetches and parses posts from mock GitHub contents API", async () => {
    // Setup
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

    // Act
    const posts = await fetchChangelogPosts();

    // Assert
    expect(posts).toHaveLength(1);
    expect(posts[0].version).toBe("1.0.0");
    expect(posts[0].title).toBe("Major Milestone 1.0");
    expect(posts[0].badge).toBe("Major");
  });

  it("preprocesses relative video tags and rewrites them to media proxy API", () => {
    // Setup
    const raw = `<video src="./videos/ai-renamer-rule.mp4" autoPlay loop muted playsInline controls></video>`;

    // Act
    const processed = preprocessChangelogContent(raw);

    // Assert
    expect(processed).toContain("<Video");
    expect(processed).toContain(
      'src="/api/changelog/media?path=videos%2Fai-renamer-rule.mp4"',
    );
    expect(processed).toContain("</Video>");
  });

  it("preprocesses GitHub web URLs in video tags to media proxy API", () => {
    // Setup
    const raw = `<video src="https://github.com/hyperjumptech/searchpoint/blob/main/changelog/videos/demo.mp4" controls />`;

    // Act
    const processed = preprocessChangelogContent(raw);

    // Assert
    expect(processed).toContain("<Video");
    expect(processed).toContain(
      `src="/api/changelog/media?url=${encodeURIComponent("https://github.com/hyperjumptech/searchpoint/blob/main/changelog/videos/demo.mp4")}"`,
    );
  });

  it("removes sections labeled with hide: sinarmas when variant is sinarmas", () => {
    // Setup
    const raw = `SearchPoint 0.31.0 extends your search across the apps you use every day, with <!-- hide: sinarmas -->SearchPoint inside StartGPT and <!-- /hide -->new connectors for Outlook and Sticky Notes.

<!-- hide: sinarmas -->
## SearchPoint inside StartGPT

Search everything inside StartGPT!
<!-- /hide -->

## Connect Outlook

Bring your Outlook world into SearchPoint.`;

    // Act
    const filtered = filterChangelogContent(raw, "sinarmas");

    // Assert
    expect(filtered).not.toContain("StartGPT");
    expect(filtered).not.toContain("<!--");
    expect(filtered).toContain(
      "SearchPoint 0.31.0 extends your search across the apps you use every day, with new connectors for Outlook and Sticky Notes.",
    );
    expect(filtered).toContain("## Connect Outlook");
  });

  it("keeps sections labeled with hide: sinarmas and strips comment markers when variant is hyperjump", () => {
    // Setup
    const raw = `SearchPoint 0.31.0 extends your search across the apps you use every day, with <!-- hide: sinarmas -->SearchPoint inside StartGPT and <!-- /hide -->new connectors for Outlook and Sticky Notes.

<!-- hide: sinarmas -->
## SearchPoint inside StartGPT

Search everything inside StartGPT!
<!-- /hide -->

## Connect Outlook

Bring your Outlook world into SearchPoint.`;

    // Act
    const filtered = filterChangelogContent(raw, "hyperjump");

    // Assert
    expect(filtered).toContain("## SearchPoint inside StartGPT");
    expect(filtered).toContain("Search everything inside StartGPT!");
    expect(filtered).toContain(
      "with SearchPoint inside StartGPT and new connectors for Outlook",
    );
    expect(filtered).not.toContain("<!--");
  });

  it("uses variant-specific frontmatter title override when parsing for sinarmas", () => {
    // Setup
    const raw = `---
title: "SearchPoint in StartGPT, Outlook & Sticky Notes"
title_sinarmas: "SearchPoint in Outlook & Sticky Notes"
version: "0.31.0"
date: "2026-10-08"
---
## Connect Outlook
Details here.`;

    // Act
    const sinarmasPost = parsePostFromRaw("0.31.0.md", raw, "sinarmas");
    const hyperjumpPost = parsePostFromRaw("0.31.0.md", raw, "hyperjump");

    // Assert
    expect(sinarmasPost?.title).toBe("SearchPoint in Outlook & Sticky Notes");
    expect(hyperjumpPost?.title).toBe(
      "SearchPoint in StartGPT, Outlook & Sticky Notes",
    );
  });

  it("returns null when entire post has frontmatter hide matching variant", () => {
    // Setup
    const raw = `---
title: "Internal Release"
version: "0.32.0"
date: "2026-10-10"
hide: "sinarmas, smdv"
---
Internal notes.`;

    // Act
    const sinarmasPost = parsePostFromRaw("0.32.0.md", raw, "sinarmas");
    const hyperjumpPost = parsePostFromRaw("0.32.0.md", raw, "hyperjump");

    // Assert
    expect(sinarmasPost).toBeNull();
    expect(hyperjumpPost?.title).toBe("Internal Release");
  });
});
