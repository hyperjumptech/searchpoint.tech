"use server";

import { TFile } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { formatFileSize } from "@/lib/format-file-size";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getFileIconPath } from "@/lib/get-file-icon-path";

type FileSource = {
  id: string;
  keywords: string[];
  mime_type: string;
  source: string;
  allow_list?: string[] | null;
  hash: string;
  name: string;
  path: string;
  size: number;
  extension: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
};

type FileValue = {
  version: string;
  _source: FileSource;
};

export type SearchPagination = {
  limit: number;
  offset: number;
  total: number;
};

export type Result = {
  pagination: SearchPagination;
  results: TFile[];
  accessMeta: FileAccessMeta;
  sourceMeta: FileSourceMeta;
};

export type FileSourceMeta = {
  onedrive?: number;
  shared_folder?: number;
};

export type FileAccessMeta = {
  allowed?: number;
  not_allowed?: number;
};

function buildFilterQuery(type: string): string {
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
    "ico",
    "psd",
    "raw",
    "cr2",
    "nef",
    "arw",
    "eps",
  ];

  const officeExtensions = [
    "doc",
    "docx",
    "docm",
    "xls",
    "xlsx",
    "xlsm",
    "csv",
    "ppt",
    "pptx",
    "pptm",
    "rtf",
    "odt",
    "ods",
    "odp",
  ];

  const pdfExtensions = ["pdf"];

  let extensions: string[] = [];

  switch (type) {
    case "image":
      extensions = imageExtensions;
      break;
    case "pdf":
      extensions = pdfExtensions;
      break;
    case "office":
      extensions = officeExtensions;
      break;
  }

  if (extensions.length === 0) {
    return "";
  }

  if (extensions.length === 1) {
    return `extension eq '${extensions[0]}'`;
  }

  return `extension in (${extensions.map((ext) => `'${ext}'`).join(",")})`;
}

// Build source filter query from sources param
function buildSourceFilter(sources: string | null): string | null {
  if (!sources) return null;

  return `source eq '${sources}'`;
}

export async function performSearch(
  query: string,
  page: number = 1,
  limit: number = 10,
  type: string = "all",
  sources?: string | null,
): Promise<Result> {
  try {
    const offset = (page - 1) * limit;

    const params = new URLSearchParams({
      search: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const typeFilterQuery = buildFilterQuery(type);
    const sourceFilterQuery = buildSourceFilter(sources ?? null);
    const filters: string[] = [];

    // Add type filter if exists
    if (typeFilterQuery) {
      filters.push(typeFilterQuery);
    }

    // Add source filter if exists
    if (sourceFilterQuery) {
      filters.push(sourceFilterQuery);
    }

    // Combine all filters with ' and '
    if (filters.length > 0) {
      const combinedFilter = filters.join(" and ");
      params.set("filter", combinedFilter);
    }

    const path = `/v1/files?${params.toString()}`;
    const response = await fetcher(path);
    const data = await response.json();

    const pagination = (data.meta?.pagination as SearchPagination) ?? {
      limit: 0,
      offset: 0,
      total: 0,
    };

    const accessMeta = (data.meta?.files_access as FileAccessMeta) ?? {
      allowed: 0,
      not_allowed: 0,
    };

    const sourceMeta = (data.meta?.files_source as FileSourceMeta) ?? {
      onedrive: 0,
      shared_folder: 0,
    };

    const fileValues = (data.value ?? []) as FileValue[];

    const results: TFile[] = fileValues.map(({ version, _source }) => ({
      id: _source.id,
      fileHash: _source.hash,
      fileName: _source.name,
      filePath: _source.path,
      fileExtension: _source.extension,
      fileSource: _source.source,
      versionHistory: [],
      accessLog: [],
      allowList: _source.allow_list || [],
      version,
      fileSize: formatFileSize(_source.size),
      fileIcon: getFileIconPath(_source.extension),
      ownerEmail: _source.owner_email,
      createdTime: formatTimeAgo(_source.created_at),
      updatedTime: formatTimeAgo(_source.updated_at),
    }));

    return {
      results,
      pagination,
      accessMeta,
      sourceMeta,
    };
  } catch (error) {
    throw error;
  }
}
