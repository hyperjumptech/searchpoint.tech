import { performSearch } from "@/actions/search";
import PaginationButtons from "@/components/pagination-buttons";
import ResultInfoBar from "@/components/result-info-bar";
import SearchResultItem from "@/components/search-result-item";

import NotFound from "./not-found";
import PageLayout from "./components/page-layout";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const type = params?.type ?? "all";
  const page = parseInt(params?.page ?? "1");

  if (!query) {
    return <NotFound />;
  }

  const data = await performSearch(query, page, 10, type);

  if (data.results.length === 0) {
    return <NotFound />;
  }

  return (
    <PageLayout>
      <div className="flex flex-col space-y-8 max-w-3xl">
        <ResultInfoBar total={data.pagination.total} type={type} />
        {data.results.map((result, idx) => (
          <SearchResultItem key={result.fileHash + idx} result={result} />
        ))}
        <div className="flex justify-center lg:block">
          <PaginationButtons pagination={data.pagination} />
        </div>
      </div>
    </PageLayout>
  );
}
