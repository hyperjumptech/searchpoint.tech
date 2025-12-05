import Image from "next/image";
import Link from "next/link";

import { TypographyP } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";
import AccessBadge from "./access-badge";
import { TFile } from "../types";

type Props = {
  result: TFile;
};

export default function SearchResultItem({ result }: Props) {
  if (result.fileName.includes("****")) {
    return <SearchResultItemMasked result={result} />;
  }

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
          <TypographyP className="text-sm truncate gap-2 flex flex-row">
            {result.ownerEmail}
            <AccessBadge file={result} />
          </TypographyP>
          <TypographyP className="text-xs text-muted-foreground truncate mt-1">
            {result.filePath}
          </TypographyP>
        </div>
      </div>

      <h2 className="text-base font-semibold leading-snug truncate">
        <Link
          href={`/search/${encodeURIComponent(result.id)}`}
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

export function SearchResultItemMasked({ result }: Props) {
  const renderMaskedText = (text: string) => {
    const parts = text.split(/(\*{2,})/);

    return parts.map((part, index) => {
      if (/^\*{2,}$/.test(part)) {
        const width = Math.min(part.length * 8, 200);

        return (
          <span
            key={index}
            className="inline-block h-4 rounded-md bg-blue-100 align-middle"
            style={{ width: `${width}px` }}
          />
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const renderMaskedPath = (path: string) => {
    const parts = path.split(/(\*{2,})/);

    return parts.map((part, index) => {
      if (/^\*{2,}$/.test(part)) {
        const width = Math.min(part.length * 6, 150);

        return (
          <span
            key={index}
            className="inline-block h-3 rounded-md bg-muted align-middle"
            style={{ width: `${width}px` }}
          />
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

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
        <div className="flex flex-col min-w-0 gap-1">
          <TypographyP className="text-sm truncate gap-2 flex flex-row">
            {result.ownerEmail}
            <AccessBadge file={result} />
          </TypographyP>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {renderMaskedPath(result.filePath)}
          </div>
        </div>
      </div>

      <h2 className="text-base font-semibold leading-snug flex items-center gap-1">
        <div className="text-blue-600 wrap-break-word flex items-center gap-1">
          {renderMaskedText(result.fileName)}
        </div>
      </h2>

      <div className="text-sm mt-2 text-muted-foreground">
        <Skeleton className="h-4 w-28 rounded-md animate-none" />
      </div>
    </div>
  );
}

export function SearchResultItemSkeleton() {
  return (
    <div className="w-full border-b border-muted pb-6">
      <div className="flex items-center gap-4 mb-3">
        <div className="shrink-0 p-1 bg-muted rounded-full">
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex flex-col min-w-0 gap-1">
          <Skeleton className="h-4 w-40 max-w-[60vw] rounded-md" />
          <Skeleton className="h-3 w-56 max-w-[70vw] rounded-md" />
        </div>
      </div>

      <h2 className="text-base font-semibold leading-snug">
        <Skeleton className="h-4 w-3xs max-w-screen rounded-md bg-blue-100" />
      </h2>

      <div className="text-sm mt-2 text-muted-foreground">
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}
