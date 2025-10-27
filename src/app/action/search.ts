"use server";

import { config } from "@/config/env";
import { FileSource, FileValue } from "@/types/file";

export async function handleSearch(
  query: string,
  email?: string
): Promise<FileSource[]> {
  const params = new URLSearchParams();
  params.set("search", query);
  if (email) {
    params.set("filter", `owner_email eq '${email}'`);
  }

  const endpoint = `${config.backendBaseUrl}/v1/files?${params.toString()}`;

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
