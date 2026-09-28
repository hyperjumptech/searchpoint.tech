import * as fs from "fs";
import * as path from "path";
import { env } from "@/lib/env";

export interface ChangelogPost {
  slug: string;
  title: string;
  version: string;
  date: string;
  summary?: string;
  badge?: string;
  ogImage?: string;
  content: string;
}

interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  download_url: string | null;
  type: string;
}

function parseFrontmatter(rawContent: string): {
  frontmatter: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = rawContent.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: rawContent };
  }

  const frontmatterBlock = match[1];
  const content = rawContent.slice(match[0].length);
  const frontmatter: Record<string, string> = {};

  for (const line of frontmatterBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Strip leading and trailing quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, content };
}

export function resolveMediaUrl(src?: string): string {
  if (!src) return "";

  // If already an API route, leave as is
  if (src.startsWith("/api/")) return src;

  // Handle GitHub URLs (blob or raw)
  if (src.includes("github.com") || src.includes("raw.githubusercontent.com")) {
    return `/api/changelog/media?url=${encodeURIComponent(src)}`;
  }

  // Handle relative or root-relative paths (e.g. ./videos/demo.mp4, videos/demo.mp4, /videos/demo.mp4)
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    const cleanPath = src.replace(/^\.\//, "").replace(/^\//, "");
    return `/api/changelog/media?path=${encodeURIComponent(cleanPath)}`;
  }

  return src;
}

export function preprocessChangelogContent(content: string): string {
  if (!content) return "";

  // 1. Full <video>...</video> pairs -> convert to <Video>...</Video> and resolve src
  let processed = content.replace(
    /<video\b([\s\S]*?)>([\s\S]*?)<\/video>/g,
    (_match: string, attrs = "", inner = "") => {
      const rAttrs = attrs.replace(
        /\bsrc=(["'])(.*?)\1/i,
        (_: string, q: string, s: string) =>
          `src=${q}${resolveMediaUrl(s)}${q}`,
      );
      const rInner = inner.replace(
        /<source\b([\s\S]*?)\/?>/g,
        (_: string, sAttrs: string) => {
          const uAttrs = sAttrs.replace(
            /\bsrc=(["'])(.*?)\1/i,
            (_: string, q: string, s: string) =>
              `src=${q}${resolveMediaUrl(s)}${q}`,
          );
          return `<source${uAttrs} />`;
        },
      );
      return `<Video${rAttrs}>${rInner}</Video>`;
    },
  );

  // 2. Self-closing <video ... /> or standalone <video ...>
  processed = processed.replace(
    /<video\b([^>]*?)\/?>/g,
    (_match: string, attrs = "") => {
      const rAttrs = attrs.replace(
        /\bsrc=(["'])(.*?)\1/i,
        (_: string, q: string, s: string) =>
          `src=${q}${resolveMediaUrl(s)}${q}`,
      );
      return `<Video${rAttrs} />`;
    },
  );

  // 3. Markdown images ![alt](./...)
  processed = processed.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    (_match: string, alt: string, url: string) =>
      `![${alt}](${resolveMediaUrl(url)})`,
  );

  return processed;
}

function parsePostFromRaw(filename: string, rawContent: string): ChangelogPost {
  const slug = filename.replace(/\.mdx?$/, "");
  const { frontmatter, content } = parseFrontmatter(rawContent);

  // Extract or derive version
  let version = frontmatter.version || "";
  if (!version) {
    const versionMatch = slug.match(/v?(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
  }

  // Extract or derive title
  let title = frontmatter.title || "";
  if (!title) {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    } else {
      title = version ? `Release ${version}` : slug;
    }
  }

  // Extract or derive date
  let date = frontmatter.date || "";
  if (!date) {
    const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      date = dateMatch[1];
    } else {
      date = new Date().toISOString().split("T")[0];
    }
  }

  return {
    slug,
    title,
    version: version || slug,
    date,
    summary: frontmatter.summary,
    badge: frontmatter.badge,
    ogImage: frontmatter.ogImage,
    content: preprocessChangelogContent(content),
  };
}

export function loadFallbackPosts(): ChangelogPost[] {
  try {
    const fallbackDir = path.resolve(
      process.cwd(),
      "src",
      "changelog",
      "fallback-posts",
    );
    if (!fs.existsSync(fallbackDir)) {
      return [];
    }

    const files = fs
      .readdirSync(fallbackDir)
      .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

    const posts: ChangelogPost[] = [];
    for (const file of files) {
      const filePath = path.join(fallbackDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      posts.push(parsePostFromRaw(file, raw));
    }

    return sortPosts(posts);
  } catch (error) {
    console.error("Failed to load fallback changelog posts:", error);
    return [];
  }
}

function sortPosts(posts: ChangelogPost[]): ChangelogPost[] {
  return posts.sort((a, b) => {
    // Sort descending by date
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!isNaN(dateDiff) && dateDiff !== 0) {
      return dateDiff;
    }
    // Fallback: compare versions descending
    return b.version.localeCompare(a.version, undefined, { numeric: true });
  });
}

export async function fetchChangelogPosts(): Promise<ChangelogPost[]> {
  const repo = env.CHANGELOG_GITHUB_REPO;
  const branch = env.CHANGELOG_GITHUB_BRANCH;
  const dir = env.CHANGELOG_GITHUB_DIR;
  const token = env.CHANGELOG_GITHUB_TOKEN;
  const revalidateSeconds = env.CHANGELOG_REVALIDATE_SECONDS;

  if (!repo) {
    return loadFallbackPosts();
  }

  const url = `https://api.github.com/repos/${repo}/contents/${dir}?ref=${encodeURIComponent(
    branch,
  )}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SearchPoint-Web",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: {
        revalidate: revalidateSeconds,
        tags: ["changelog"],
      },
    });

    if (!res.ok) {
      console.warn(
        `GitHub API returned ${res.status} when fetching changelog from ${repo}/${dir}. Falling back to bundled releases.`,
      );
      return loadFallbackPosts();
    }

    const items: GitHubContentItem[] = await res.json();
    if (!Array.isArray(items)) {
      return loadFallbackPosts();
    }

    const mdFiles = items.filter(
      (item) =>
        item.type === "file" &&
        (item.name.endsWith(".md") || item.name.endsWith(".mdx")),
    );

    if (mdFiles.length === 0) {
      return loadFallbackPosts();
    }

    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const downloadUrl =
            file.download_url ||
            `https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`;

          const fileRes = await fetch(downloadUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            next: {
              revalidate: revalidateSeconds,
              tags: [
                "changelog",
                `changelog-${file.name.replace(/\.mdx?$/, "")}`,
              ],
            },
          });

          if (!fileRes.ok) {
            return null;
          }

          const rawText = await fileRes.text();
          return parsePostFromRaw(file.name, rawText);
        } catch (fileErr) {
          console.error(`Failed to fetch markdown file ${file.name}:`, fileErr);
          return null;
        }
      }),
    );

    const validPosts = posts.filter((p): p is ChangelogPost => p !== null);

    if (validPosts.length === 0) {
      return loadFallbackPosts();
    }

    return sortPosts(validPosts);
  } catch (err) {
    console.error("Failed to fetch changelog from GitHub:", err);
    return loadFallbackPosts();
  }
}

export async function fetchChangelogPostBySlug(
  slug: string,
): Promise<ChangelogPost | null> {
  const posts = await fetchChangelogPosts();
  const matched = posts.find((p) => p.slug === slug || p.version === slug);
  if (matched) return matched;

  // If not found in primary list, check fallback directly
  const fallbacks = loadFallbackPosts();
  return fallbacks.find((p) => p.slug === slug || p.version === slug) || null;
}
