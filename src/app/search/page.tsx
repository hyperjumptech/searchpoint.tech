import { performSearch } from "@/actions/search";
import SearchResultItem from "@/components/search-result-item";

import NotFound from "./not-found";

type SearchPageProps = {
  searchParams: { q?: string };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams).q ?? "";
  const searchResults = await performSearch(query);

  if (searchResults.length === 0) {
    return <NotFound />;
  }

  return (
    <div className="mx-auto flex flex-col max-w-6xl space-y-8 py-8 px-4 md:px-0">
      {searchResults.map((result) => (
        <SearchResultItem key={result.fileHash} result={result} />
      ))}
    </div>
  );
}
