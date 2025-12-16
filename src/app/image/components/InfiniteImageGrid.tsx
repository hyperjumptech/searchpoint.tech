"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TFile } from "@/types";
import ImageResultItemClient from "./ImageResultItemClient";
import { Loader2 } from "lucide-react";

type InfiniteImageGridProps = {
  initialQuery?: string;
  initialSources?: string | null;
  initialImages?: TFile[];
  initialHasMore?: boolean;
  initialTotal?: number;
};

export default function InfiniteImageGrid({
  initialQuery = "",
  initialSources = null,
  initialImages = [],
  initialHasMore = true,
}: InfiniteImageGridProps) {
  const [images, setImages] = useState<TFile[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialImages.length);

  const fetchImages = useCallback(
    async (offset: number) => {
      if (isLoading || !hasMore) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: initialQuery,
          limit: "20",
          offset: offset.toString(),
        });

        if (initialSources) {
          params.set("sources", initialSources);
        }

        const response = await fetch(`/api/images?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          setImages((prev) => [...prev, ...data.results]);
          setHasMore(data.hasMore);
          offsetRef.current = offset + data.results.length;
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [initialQuery, initialSources, isLoading, hasMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchImages(offsetRef.current);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, fetchImages]);

  if (images.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No images found</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((result, idx) => (
          <ImageResultItemClient key={result.fileHash + idx} result={result} />
        ))}
      </div>

      <div
        ref={observerTarget}
        className="flex flex-col items-center justify-center py-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more images...</span>
          </div>
        )}
        {!hasMore && images.length > 0 && (
          <p className="text-muted-foreground text-sm">
            You&apos;ve reached the end of the images!
          </p>
        )}
        {error && <p className="text-destructive text-sm">Error: {error}</p>}
      </div>
    </>
  );
}
