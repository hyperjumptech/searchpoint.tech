import { performSearch } from "@/actions/search";
import PaginationButtons from "@/components/pagination-buttons";
import ResultInfoBar from "@/components/result-info-bar";
import SearchResultItem from "@/components/search-result-item";

import PageLayout from "./components/page-layout";
import SearchSummary from "./components/search-summary/index";
import { notFound } from "next/navigation";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    summary?: string;
    sources?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const type = params?.type ?? "all";
  const page = parseInt(params?.page ?? "1");
  const showSummary = params?.summary === "true";
  const sources = params?.sources ?? null;

  // Get search results
  const data = await performSearch(query, page, 10, type, sources);

  if (data.results.length === 0) {
    return notFound();
  }

  return (
    <>
      <PageLayout
        summary={
          <div className="hidden xl:flex max-w-sm w-full">
            <SearchSummary type="sidebar" query={query} page={page} />
          </div>
        }>
        <div className="flex flex-col space-y-8 w-full">
          <ResultInfoBar total={data.pagination.total} type={type} />

          {data.results.map((result, idx) => (
            <SearchResultItem key={result.fileHash + idx} result={result} />
          ))}
          <div className="flex justify-center lg:block">
            <PaginationButtons pagination={data.pagination} />
          </div>
        </div>
      </PageLayout>

      <SearchSummary
        type="dialog"
        query={query}
        page={page}
        open={showSummary}
      />
    </>
  );
}
