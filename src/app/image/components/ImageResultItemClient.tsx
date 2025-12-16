"use client";

import { TFile } from "@/types";
import { EyeOff } from "lucide-react";
import Link from "next/link";

type Props = {
  result: TFile;
};

export default function ImageResultItemClient({ result }: Props) {
  if (result.id === "401") {
    return (
      <div className="w-full flex flex-col mb-4">
        <div className="rounded-md mb-2 shadow-xs border overflow-hidden">
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <EyeOff className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <div className="h-3 w-24 bg-gray-200 animate-none rounded mb-1" />
        <div className="h-4 w-32 bg-blue-100 animate-none rounded" />
      </div>
    );
  }

  if (result.fileSource === "shared folder") {
    return (
      <Link
        href={`/search/${encodeURIComponent(result.id)}`}
        className="w-full flex flex-col mb-4">
        <div className="rounded-md mb-2 shadow-xs border overflow-hidden">
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <EyeOff className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">
            {result.ownerEmail}
          </p>
        </div>
        <p className="text-[12px] truncate">{result.fileName}</p>
      </Link>
    );
  }

  // For images, use the filePath directly
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "heic",
    "bmp",
    "tiff",
    "tif",
    "svg",
  ];
  const isImage = imageExtensions.includes(result.fileExtension.toLowerCase());

  return (
    <div className="w-full flex flex-col mb-4">
      <Link
        href={`/search/${encodeURIComponent(result.id)}`}
        className="rounded-md mb-2 shadow-xs border overflow-hidden block">
        {isImage && result.filePath ? (
          // Use native img for external URLs (like SharePoint)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.filePath}
            alt={result.fileName}
            className="w-full h-auto object-contain aspect-video rounded-md bg-gray-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <EyeOff className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </Link>
      <div>
        <p className="text-[10px] text-muted-foreground">{result.ownerEmail}</p>
      </div>
      <p className="text-[12px] truncate">{result.fileName}</p>
    </div>
  );
}
