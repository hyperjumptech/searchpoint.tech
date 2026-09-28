import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Tag } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { fetchChangelogPosts } from "@/lib/changelog";
import { changelogMdxComponents } from "./mdx-components";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Changelog — What's New in SearchPoint",
  description:
    "New updates, features, improvements, and fixes across SearchPoint releases.",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function ChangelogPage() {
  const posts = await fetchChangelogPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
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
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Header Section */}
        <div className="mb-16 border-b border-border pb-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Changelog
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            New updates, feature improvements, and fixes across SearchPoint
            releases.
          </p>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No changelog entries found.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {posts.map((post, index) => {
              const formattedDate = formatDate(post.date);
              const isFirst = index === 0;

              return (
                <article
                  key={post.slug}
                  id={post.version}
                  className="grid grid-cols-1 gap-8 border-b border-border/80 pb-16 last:border-b-0 lg:grid-cols-12 lg:gap-12">
                  {/* Left Column (Metadata & Sticky Date) */}
                  <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-24 space-y-3">
                      <time
                        dateTime={post.date}
                        className="block text-sm font-semibold text-muted-foreground">
                        {formattedDate}
                      </time>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/changelog/${post.slug}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs font-mono font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted">
                          <Tag className="h-3 w-3 text-muted-foreground" />v
                          {post.version}
                        </Link>

                        {isFirst && (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Latest
                          </span>
                        )}

                        {post.badge &&
                          post.badge.toLowerCase() !== "latest" && (
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {post.badge}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Content) */}
                  <div className="lg:col-span-8">
                    <header className="mb-4">
                      <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
                        <Link
                          href={`/changelog/${post.slug}`}
                          className="group inline-flex items-center gap-2 hover:text-primary transition-colors">
                          {post.title}
                          <ArrowUpRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                        </Link>
                      </h2>
                    </header>

                    {/* Markdown Body */}
                    <div className="space-y-4 text-foreground/90 leading-7 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-foreground [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:text-foreground [&>p]:leading-7 [&>ul]:space-y-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:leading-7 [&>a]:text-primary [&>a]:underline [&>a:hover]:text-primary/80 [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&_video]:w-full [&_video]:rounded-xl [&_img]:w-full [&_img]:rounded-xl [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl">
                      <MDXRemote
                        source={post.content}
                        components={changelogMdxComponents}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
