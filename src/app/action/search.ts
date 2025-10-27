"use server";

import { config } from "@/config/env";
import { FileSource, FileValue } from "@/types/file";

export async function handleSearch(query: string): Promise<FileSource[]> {
  const endpoint = `${config.backendBaseUrl}/v1/files?search=${encodeURIComponent(
    query,
  )}`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 600 },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch search results (status ${res.status})`);
    }

    const data = await res.json();
    return data.value.map((v: FileValue) => v._source);
  } catch (error) {
    console.error(error);
    return [];
  }
}
