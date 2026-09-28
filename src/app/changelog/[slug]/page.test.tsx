/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ChangelogDetailPage from "./page";
import * as changelogModule from "@/lib/changelog";

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div>{source}</div>,
}));

describe("ChangelogDetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockPosts = [
    {
      slug: "1.0.0",
      title: "Version 1.0.0",
      version: "1.0.0",
      date: "2026-09-28",
      content: "Latest release content",
    },
    {
      slug: "0.9.0",
      title: "Version 0.9.0",
      version: "0.9.0",
      date: "2026-08-15",
      badge: "Latest", // Stale badge
      content: "Older content",
    },
  ];

  it("renders 'Latest' badge automatically when viewing the latest post", async () => {
    vi.spyOn(changelogModule, "fetchChangelogPosts").mockResolvedValue(
      mockPosts,
    );
    vi.spyOn(changelogModule, "fetchChangelogPostBySlug").mockResolvedValue(
      mockPosts[0],
    );

    const page = await ChangelogDetailPage({
      params: Promise.resolve({ slug: "1.0.0" }),
    });
    render(page);

    expect(screen.getByText("Latest")).toBeDefined();
  });

  it("does not render stale 'Latest' badge when viewing an older post", async () => {
    vi.spyOn(changelogModule, "fetchChangelogPosts").mockResolvedValue(
      mockPosts,
    );
    vi.spyOn(changelogModule, "fetchChangelogPostBySlug").mockResolvedValue(
      mockPosts[1],
    );

    const page = await ChangelogDetailPage({
      params: Promise.resolve({ slug: "0.9.0" }),
    });
    render(page);

    expect(screen.queryByText("Latest")).toBeNull();
  });
});
