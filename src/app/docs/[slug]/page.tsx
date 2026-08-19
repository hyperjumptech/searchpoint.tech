/* eslint-disable @next/next/no-html-link-for-pages */
import * as fs from "fs";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import * as path from "path";

export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

function Container({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight?: boolean;
}) {
  return (
    <div
      className={`container mx-auto max-w-7xl px-6 md:px-8 lg:px-12 ${minHeight ? "min-h-screen" : ""}`}>
      {children}
    </div>
  );
}

function resolveDocPath(docsPublicPath: string, slug: string) {
  const candidates = [
    path.resolve(docsPublicPath, `${slug}.md`),
    path.resolve(docsPublicPath, `${slug}.mdx`),
  ];
  const containmentPrefix = docsPublicPath + path.sep;

  for (const candidate of candidates) {
    if (!candidate.startsWith(containmentPrefix)) {
      continue;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

async function getDocContent(slug: string) {
  const docsPublicPath = path.resolve(process.cwd(), "src", "docs", "public");
  const filePath = resolveDocPath(docsPublicPath, slug);

  if (!filePath) {
    notFound();
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Extract frontmatter manually
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = fileContent.match(frontmatterRegex);
  let title = slug;
  let content = fileContent;

  if (match) {
    const frontmatterString = match[1];
    const titleMatch = frontmatterString.match(/title:\s*(.+)/);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/['"]/g, "");
    }
    content = fileContent.slice(match[0].length);
  }

  return { content, title };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const { content } = await getDocContent(slug);

  return (
    <>
      <header className="border-b">
        <Container>
          <div className="flex items-center py-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Home
            </a>
          </div>
        </Container>
      </header>
      <Container minHeight>
        <article className="mx-auto max-w-4xl py-8 pb-16 md:py-12">
          <div className="space-y-6 text-foreground [&>h1]:text-3xl [&>h1]:font-semibold [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:mt-4 [&>h4]:mb-2 [&>p]:leading-7 [&>ul]:space-y-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:leading-7 [&>a]:text-primary [&>a]:underline [&>a:hover]:text-primary/80 [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic">
            <MDXRemote source={content} />
          </div>
        </article>
      </Container>
    </>
  );
}

export async function generateStaticParams() {
  const dirPath = path.resolve(process.cwd(), "src", "docs", "public");
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = entries.filter(
    (entry) =>
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")),
  );

  return files.map((entry) => ({
    slug: entry.name.replace(/\.mdx?$/, ""),
  }));
}
