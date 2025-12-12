import Image from "next/image";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import AccessBadge from "./access/access-badge";
import { TFile } from "../types";

type Props = {
  result: TFile;
};

const hasConsecutiveAsterisks = (value: string) => /\*{1,}/.test(value);

const renderWithSkeleton = (value: string, className?: string) => {
  if (!hasConsecutiveAsterisks(value)) {
    return value;
  }

  const parts = value.split(/(\*{1,})/);

  return (
    <>
      {parts.map((part, index) => {
        if (/\*{1,}/.test(part)) {
          const asteriskCount = part.length;
          const widthClass = `w-[${asteriskCount * 8}px]`;
          return (
            <Skeleton
              key={index}
              className={`${className || `h-4 ${widthClass} rounded-md animate-none`} inline-block align-middle mx-0.5`}
              style={{ width: `${asteriskCount * 8}px` }}
            />
          );
        }

        return (
          <span key={index} className="inline-block align-middle">
            {part}
          </span>
        );
      })}
    </>
  );
};

export default function SearchResultItem({ result }: Props) {
  const isFileNamePrivate = hasConsecutiveAsterisks(result.fileName);
  const isFilePathPrivate = hasConsecutiveAsterisks(result.filePath);

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
          <div className="text-sm truncate gap-2 flex flex-row items-center">
            {renderWithSkeleton(
              result.ownerEmail,
              "h-4 w-40 rounded-md animate-none",
            )}
            <AccessBadge file={result} />
          </div>
          <div className="text-xs text-muted-foreground truncate mt-1">
            {renderWithSkeleton(
              result.filePath,
              "h-3 w-56 rounded-md animate-none",
            )}
          </div>
        </div>
      </div>

      <div
        role="heading"
        aria-level={2}
        className="text-base font-semibold leading-snug truncate">
        {isFileNamePrivate ? (
          <div className="text-blue-600 wrap-break-word sm:truncate max-w-[calc(100vw-24px)] overflow-hidden inline-flex items-center">
            {renderWithSkeleton(
              result.fileName,
              "h-4 w-24 rounded-md bg-blue-100 animate-none",
            )}
          </div>
        ) : (
          <Link
            href={`/search/${encodeURIComponent(result.id)}`}
            className="text-blue-600 hover:underline wrap-break-word sm:truncate max-w-[calc(100vw-24px)] overflow-hidden">
            {result.fileName}
          </Link>
        )}
      </div>

      <div className="text-sm mt-2 text-muted-foreground flex items-center">
        {isFilePathPrivate ? (
          <>
            Updated{" "}
            <Skeleton className="h-4 w-28 rounded-md animate-none inline-block align-middle ml-1" />
          </>
        ) : (
          <>
            Updated{" "}
            {renderWithSkeleton(
              result.updatedTime,
              "h-4 w-28 rounded-md animate-none",
            )}
          </>
        )}
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

      <div
        role="heading"
        aria-level={2}
        className="text-base font-semibold leading-snug">
        <Skeleton className="h-4 w-3xs max-w-screen rounded-md bg-blue-100" />
      </div>

      <div className="text-sm mt-2 text-muted-foreground">
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
    </div>
  );
}
