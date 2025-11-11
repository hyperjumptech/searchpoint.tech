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
    const response = await fetcher(path);
    const data = await response.json();
    const fileValues = data.value as FileValue[];
    const fileSources = fileValues.map(
      (fileValue: FileValue) => fileValue._source,
    ) as FileSource[];

    const results = fileSources.map((fileSource) => ({
      fileHash: fileSource.hash,
      fileName: fileSource.name,
      filePath: fileSource.path,
      fileSize: formatFileSize(fileSource.size),
      fileIcon: getFileIconPath(fileSource.extension),
      ownerEmail: fileSource.owner_email,
      createdTime: formatTimeAgo(fileSource.created_at),
      updatedTime: formatTimeAgo(fileSource.updated_at),
    }));

    return results;
  } catch (error) {
    throw error;
  }
}
