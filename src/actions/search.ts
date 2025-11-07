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

export async function performSearch(query: string): Promise<SearchResult[]> {
  try {
    const path = "/v1/files?search=" + query;
    const data = await fetcher<{ value: FileValue[] }>(path);
    const values = data.value.map((value) => value._source) as FileSource[];

    const results = values.map((value) => ({
      fileHash: value.hash,
      fileName: value.name,
      filePath: value.path,
      fileSize: formatFileSize(value.size),
      fileIcon: getFileIconPath(value.extension),
      ownerEmail: value.owner_email,
      createdTime: formatTimeAgo(value.created_at),
      updatedTime: formatTimeAgo(value.updated_at),
    }));

    return results;
  } catch (error) {
    throw error;
  }
}
