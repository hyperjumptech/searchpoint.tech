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
    <div className="flex flex-col space-y-8">
      {searchResults.map((result) => (
        <SearchResultItem key={result.fileHash} result={result} />
      ))}
    </div>
  );
}
