export type FileSource = {
  owner_email: string;
  extension: string;
  hash: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
};

export type FileValue = {
  _source: FileSource;
};
