/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ChangelogPage from "./page";
import * as changelogModule from "@/lib/changelog";

// Mock next-mdx-remote/rsc since it runs in server components
vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div>{source}</div>,
}));

describe("ChangelogPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("automatically renders 'Latest' badge for the latest version, even without badge frontmatter", async () => {
    vi.spyOn(changelogModule, "fetchChangelogPosts").mockResolvedValue([
      {
        slug: "1.0.0",
        title: "Version 1.0.0",
        version: "1.0.0",
        date: "2026-09-28",
        content: "New release without badge frontmatter",
      },
      {
        slug: "0.9.0",
        title: "Version 0.9.0",
        version: "0.9.0",
        date: "2026-08-15",
        badge: "Latest", // Old post still had 'Latest' in markdown
        content: "Older release notes",
      },
      {
        slug: "0.8.0",
        title: "Version 0.8.0",
        version: "0.8.0",
        date: "2026-07-01",
        badge: "Feature",
        content: "Feature release notes",
      },
    ]);

    const page = await ChangelogPage();
    render(page);

    const latestBadges = screen.getAllByText("Latest");
    // There should be only ONE "Latest" badge, and it must belong to 1.0.0
    expect(latestBadges).toHaveLength(1);

    const firstArticle = document.getElementById("1.0.0");
    expect(firstArticle).not.toBeNull();
    expect(firstArticle?.textContent).toContain("Latest");

    // The older post 0.9.0 had badge: "Latest" in frontmatter, but it should not have "Latest"
    const secondArticle = document.getElementById("0.9.0");
    expect(secondArticle).not.toBeNull();
    expect(secondArticle?.textContent).not.toContain("Latest");

    // The post with badge: "Feature" should display its badge
    const thirdArticle = document.getElementById("0.8.0");
    expect(thirdArticle).not.toBeNull();
    expect(thirdArticle?.textContent).toContain("Feature");
  });
});
