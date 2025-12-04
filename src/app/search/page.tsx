import { performSearch } from "@/actions/search";
import PaginationButtons from "@/components/pagination-buttons";
import ResultInfoBar from "@/components/result-info-bar";
import SearchResultItem from "@/components/search-result-item";

import NotFound from "./not-found";
import PageLayout from "./components/page-layout";
import SearchSummary from "./components/search-summary";
import SearchSummaryDialog from "./components/search-summary-dialog";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    summary?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const type = params?.type ?? "all";
  const page = parseInt(params?.page ?? "1");
  const showSummary = params?.summary === "true";

  if (!query) {
    return <NotFound />;
  }

  const data = await performSearch(query, page, 10, type);

  if (data.results.length === 0) {
    return <NotFound />;
  }

  return (
    <>
      <PageLayout
        summary={
          <div className="hidden xl:block">
            <Card className="w-full max-w-none xl:max-w-sm h-max gap-0">
              <CardHeader>
                <CardTitle>Search Summary for &quot;{query}&quot;</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <SearchSummary data={data} />
              </CardContent>
            </Card>
          </div>
        }>
        <div className="flex flex-col gap-4 w-full">
          <ResultInfoBar total={data.pagination.total} type={type} />

          {data.results.map((result, idx) => (
            <SearchResultItem key={result.fileHash + idx} result={result} />
          ))}
          <div className="flex justify-center lg:block">
            <PaginationButtons pagination={data.pagination} />
          </div>
        </div>
      </PageLayout>

      <SearchSummaryDialog open={showSummary} query={query} data={data} />
    </>
  );
}
