export type VersionHistoryItem = {
  version: string;
  date: string;
  description: string;
};

export type AccessLogItem = {
  user: string;
  type: string;
  date: string;
};

export type TFile = {
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
