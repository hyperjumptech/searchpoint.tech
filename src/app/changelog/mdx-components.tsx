import React from "react";

export function resolveMediaUrl(src?: string): string | undefined {
  if (!src) return src;

  // Leave absolute API routes or local absolute paths as is
  if (src.startsWith("/api/") || src.startsWith("/")) {
    return src;
  }

  // Handle GitHub URLs (blob or raw)
  if (src.includes("github.com") || src.includes("raw.githubusercontent.com")) {
    return `/api/changelog/media?url=${encodeURIComponent(src)}`;
  }

  // Handle relative paths (e.g. ./video.mp4, videos/demo.mp4)
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    const cleanPath = src.replace(/^\.\//, "");
    return `/api/changelog/media?path=${encodeURIComponent(cleanPath)}`;
  }

  return src;
}

export function ChangelogVideo({
  className,
  controls,
  src,
  children,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const resolvedSrc = typeof src === "string" ? resolveMediaUrl(src) : src;

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-black/5 shadow-sm">
      <video
        className={className || "block w-full"}
        controls={controls ?? true}
        playsInline
        src={resolvedSrc}
        {...props}>
        {children}
      </video>
    </div>
  );
}

export function ChangelogImage({
  alt,
  className,
  src,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const resolvedSrc = resolveMediaUrl(
    typeof src === "string" ? src : undefined,
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={
        className ||
        "my-6 w-full rounded-xl border border-border shadow-sm object-cover"
      }
      loading="lazy"
      alt={alt || ""}
      src={resolvedSrc}
      {...props}
    />
  );
}

export function ChangelogIframe({
  className,
  ...props
}: React.IframeHTMLAttributes<HTMLIFrameElement>) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border shadow-sm">
      <iframe className={className || "aspect-video w-full"} {...props} />
    </div>
  );
}

export const changelogMdxComponents = {
  video: ChangelogVideo,
  Video: ChangelogVideo,
  img: ChangelogImage,
  iframe: ChangelogIframe,
};
