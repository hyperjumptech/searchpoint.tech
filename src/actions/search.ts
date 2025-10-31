"use server";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
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
    const url = new URL("/v1/files", env.BACKEND_BASE_URL);
    url.searchParams.set("search", query);

    const cookieStore = await cookies();
    const token = cookieStore.get("SCSE_ID")?.value;

    const res = await fetch(url, {
      headers: {
        Cookie: `SCSE_ID=${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Something went wrong.`);
    }

    const data = await res.json();

    const values = data.value.map(
      (value: FileValue) => value._source
    ) as FileSource[];

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
