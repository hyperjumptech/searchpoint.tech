import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { fetchChangelogPostBySlug, fetchChangelogPosts } from "@/lib/changelog";
import { changelogMdxComponents } from "../mdx-components";

export const revalidate = 60;
export const dynamicParams = true;

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function generateStaticParams() {
  const posts = await fetchChangelogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchChangelogPostBySlug(slug);

  if (!post) {
    return {
      title: "Release Not Found — SearchPoint Changelog",
    };
  }

  return {
    title: `${post.title} — SearchPoint Changelog`,
    description:
      post.summary || `Release notes for SearchPoint v${post.version}`,
    openGraph: {
      title: `${post.title} — SearchPoint Changelog`,
      description:
        post.summary || `Release notes for SearchPoint v${post.version}`,
      type: "article",
      publishedTime: post.date,
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
  };
}

export default async function ChangelogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchChangelogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const posts = await fetchChangelogPosts();
  const isLatest =
    posts.length > 0 &&
    (posts[0].slug === post.slug || posts[0].version === post.version);
  const formattedDate = formatDate(post.date);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            All Releases
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/#download"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
              Download App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <article>
          {/* Post Header */}
          <div className="mb-10 space-y-4 border-b border-border pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <time
                dateTime={post.date}
                className="text-sm font-medium text-muted-foreground">
                {formattedDate}
              </time>

              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-mono font-medium text-foreground">
                <Tag className="h-3 w-3 text-muted-foreground" />v{post.version}
              </span>

              {isLatest && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Latest
                </span>
              )}

              {post.badge && post.badge.toLowerCase() !== "latest" && (
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {post.badge}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl text-foreground">
              {post.title}
            </h1>
          </div>

          {/* Markdown Content */}
          <div className="space-y-6 text-foreground/90 leading-7 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-foreground [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-foreground [&>p]:leading-7 [&>ul]:space-y-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:leading-7 [&>a]:text-primary [&>a]:underline [&>a:hover]:text-primary/80 [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&_video]:w-full [&_video]:rounded-xl [&_img]:w-full [&_img]:rounded-xl [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl">
            <MDXRemote
              source={post.content}
              components={changelogMdxComponents}
            />
          </div>

          {/* Bottom Navigation */}
          <div className="mt-16 border-t border-border pt-8">
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to all updates
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
