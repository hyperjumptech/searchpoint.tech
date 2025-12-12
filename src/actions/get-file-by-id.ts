"use server";

import { AccessLogItem, VersionHistoryItem } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { formatFileSize } from "@/lib/format-file-size";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getFileIconPath } from "@/lib/get-file-icon-path";

export type FileResult = {
  id: string;
  version: string;
  fileHash: string;
  fileName: string;
  filePath: string;
  fileSize: string;
  fileIcon: string;
  fileExtension: string;
  fileSource: string;
  ownerEmail: string;
  createdTime: string;
  updatedTime: string;
  versionHistory: VersionHistoryItem[];
  accessLog: AccessLogItem[];
  allowList: string[];
};

export async function getFileById(id: string): Promise<FileResult | null> {
  const response = await fetcher(`/v1/files/${id}`);
  const data = await response.json();

  if (!data.value) {
    return null;
  }

  const result: FileResult = {
    id,
    version: data.value.version,
    fileHash: data.value.data.hash,
    fileName: data.value.data.name,
    filePath: data.value.data.path,
    fileSize: formatFileSize(data.value.data.size),
    fileIcon: getFileIconPath(data.value.data.extension),
    fileExtension: data.value.data.extension,
    fileSource: data.value.data.source,
    ownerEmail: data.value.data.owner_email,
    createdTime: formatTimeAgo(data.value.data.created_at),
    updatedTime: formatTimeAgo(data.value.data.updated_at),
    versionHistory: data.value.data.version_history || [],
    accessLog: data.value.data.access_log || [],
    allowList: data.value.data.allow_list || [],
  };

  return result;
}
