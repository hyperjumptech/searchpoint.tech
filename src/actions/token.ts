"use server";

import { cookies } from "next/headers";

import { decodeToken } from "@/lib/token-decoder";

export async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("SCSE_ID");
  const user = decodeToken(token?.value);

  return user;
}
