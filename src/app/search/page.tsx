import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { UserStoreInitializer } from "@/stores/UserStoreInitializer";

import { handleSearch } from "../action/search";
import SearchClient from "./page.client";

export const metadata: Metadata = {
  title: "Sinarmas - Secure Corporate Search Engine",
  description: "Search securely across corporate documents and data.",
};

export default async function SearchPage() {
  const cookieStore = await cookies();
  const scseId = cookieStore.get("SCSE_ID")?.value;

  return (
    <Suspense
      fallback={<div className="p-6 text-gray-500">Loading search...</div>}
    >
      <UserStoreInitializer scseId={scseId} />
      <SearchClient handleSearch={handleSearch} />
    </Suspense>
  );
}
