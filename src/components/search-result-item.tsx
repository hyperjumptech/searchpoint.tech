import Image from "next/image";
import Link from "next/link";

import { SearchResult } from "@/actions/search";
import { TypographyP } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  result: SearchResult;
};

export default function SearchResultItem({ result }: Props) {
  return (
    <div className="w-full border-b border-muted pb-6">
      <div className="flex items-center gap-4 mb-3">
        <div className="shrink-0 p-1 bg-muted rounded-full">
          <Image
            width={32}
            height={32}
            src={result.fileIcon}
            alt={`${result.fileName} icon`}
            className="w-6 h-6"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <TypographyP className="text-sm truncate">
            {result.ownerEmail}
          </TypographyP>
          <TypographyP className="text-xs text-muted-foreground truncate">
            {result.filePath}
          </TypographyP>
        </div>
      </div>

      <h2 className="text-base font-semibold leading-snug truncate">
        <Link
          href={`/search/${encodeURIComponent(result.fileName)}`}
          className="text-blue-600 hover:underline wrap-break-word sm:truncate max-w-[calc(100vw-24px)] overflow-hidden">
          {result.fileName}
        </Link>
      </h2>

      <TypographyP className="text-sm mt-2 text-muted-foreground">
        Updated {result.updatedTime}
      </TypographyP>
    </div>
  );
}

export function SearchResultItemSkeleton() {
  return (
    <div className="w-full border-b border-muted pb-6">
      {/* top row: icon + meta (email, path) */}
      <div className="flex items-center gap-4 mb-3">
        <div className="shrink-0 p-1 bg-muted rounded-full">
          {/* match the 32px wrapper w/ 24px image */}
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex flex-col min-w-0 gap-1">
          {/* ownerEmail */}
          <Skeleton className="h-4 w-40 max-w-[60vw] rounded-md" />
          {/* filePath */}
          <Skeleton className="h-3 w-56 max-w-[70vw] rounded-md" />
        </div>
      </div>

      {/* fileName */}
      <h2 className="text-base font-semibold leading-snug">
        <Skeleton className="h-4 w-3xs max-w-screen rounded-md bg-blue-100" />
      </h2>

      {/* updatedTime */}
      <div className="text-sm mt-2 text-muted-foreground">
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}
