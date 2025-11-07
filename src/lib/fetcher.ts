"use server";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

export async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("SCSE_ID")?.value;
  const url = new URL(path, env.BACKEND_BASE_URL);

  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      "User-Agent": "frontend",
      Cookie: `SCSE_ID=${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return res.json();
}
