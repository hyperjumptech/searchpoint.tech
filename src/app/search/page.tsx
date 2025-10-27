import { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./page.client";
import { handleSearch } from "../action/search";

export const metadata: Metadata = {
  title: "Sinarmas - Secure Corporate Search Engine",
  description: "Search securely across corporate documents and data.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }> | { q?: string };
}) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const initialData = await handleSearch(query);

  return (
    <Suspense
      fallback={<div className="p-6 text-gray-500">Loading search...</div>}
    >
      <SearchClient
        initialQuery={query}
        initialData={initialData}
        handleSearch={handleSearch}
      />
    </Suspense>
  );
}
