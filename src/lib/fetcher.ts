"use server";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

export async function fetcher(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("SCSE_ID")?.value;
  const url = new URL(path, env.BACKEND_BASE_URL);

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      "User-Agent": "frontend",
      Cookie: `SCSE_ID=${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return response;
    }
    throw new Error(response.statusText);
  }

  return response;
}
