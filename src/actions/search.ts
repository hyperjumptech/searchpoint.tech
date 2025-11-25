"use server";

import { fetcher } from "@/lib/fetcher";
import { formatFileSize } from "@/lib/format-file-size";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getFileIconPath } from "@/lib/get-file-icon-path";

type FileSource = {
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
  _source: FileSource;
};

export type SearchPagination = {
  limit: number;
  offset: number;
  total: number;
};

export type SearchResult = {
  fileHash: string;
  fileName: string;
  filePath: string;
  fileSize: string;
  fileIcon: string;
  ownerEmail: string;
  createdTime: string;
  updatedTime: string;
};

export type Result = {
  pagination: SearchPagination;
  results: SearchResult[];
};

function buildFilterQuery(type: string): string {
  const googleExt = ["gdoc", "gsheet", "gslide"];
  const officeExt = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
  const pdfExt = ["pdf"];

  let extensions: string[] = [];

  switch (type) {
    case "pdf":
      extensions = pdfExt;
      break;
    case "google":
      extensions = googleExt;
      break;
    case "office":
      extensions = officeExt;
      break;
    default:
      return "";
  }

  const conditions = extensions
    .map((ext) => `extension eq '${ext}'`)
    .join(" or ");
  return conditions;
}

export async function performSearch(
  query: string,
  page: number = 1,
  limit: number = 10,
  type: string = "all",
): Promise<Result> {
  try {
    const offset = (page - 1) * limit;

    const params = new URLSearchParams({
      search: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const filterQuery = buildFilterQuery(type);

    if (filterQuery) {
      params.set("filter", filterQuery);
    }

    const path = `/v1/files?${params.toString()}`;
    const response = await fetcher(path);
    const data = await response.json();

    const pagination = (data.meta?.pagination as SearchPagination) ?? {
      limit: 0,
      offset: 0,
      total: 0,
    };

    const fileValues = (data.value ?? []) as FileValue[];

    const results: SearchResult[] = fileValues.map(({ _source }) => ({
      fileHash: _source.hash,
      fileName: _source.name,
      filePath: _source.path,
      fileSize: formatFileSize(_source.size),
      fileIcon: getFileIconPath(_source.extension),
      ownerEmail: _source.owner_email,
      createdTime: formatTimeAgo(_source.created_at),
      updatedTime: formatTimeAgo(_source.updated_at),
    }));

    return {
      pagination,
      results,
    };
  } catch (error) {
    throw error;
  }
}
