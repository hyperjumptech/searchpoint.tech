import { Suspense } from "react";
import SearchClient from "./page.client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-500">Loading search...</div>}
    >
      <SearchClient />
    </Suspense>
  );
}
