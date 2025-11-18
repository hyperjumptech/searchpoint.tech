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

export type FileDetail = SearchResult;

export async function performSearch(query: string): Promise<FileDetail[]> {
  try {
    const path = `/v1/files?search=${query}`;
    const response = await fetcher(path);
    const data = await response.json();

    const fileValues = data.value as FileValue[];
    if (!fileValues?.length) return [];

    const results: FileDetail[] = fileValues.map(({ _source }) => ({
      fileHash: _source.hash,
      fileName: _source.name,
      filePath: _source.path,
      fileSize: formatFileSize(_source.size),
      fileIcon: getFileIconPath(_source.extension),
      ownerEmail: _source.owner_email,
      createdTime: formatTimeAgo(_source.created_at),
      updatedTime: formatTimeAgo(_source.updated_at),
    }));

    return results;
  } catch (error) {
    console.error("performSearch error:", error);
    throw error;
  }
}
