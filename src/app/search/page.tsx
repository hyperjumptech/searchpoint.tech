import { performSearch } from "@/actions/search";
import PaginationButtons from "@/components/pagination-buttons";
import ResultInfoBar from "@/components/result-info-bar";
import SearchResultItem from "@/components/search-result-item";

import NotFound from "./not-found";
import PageLayout from "./components/page-layout";
import SearchSummary from "./components/search-summary";
import SearchSummaryDialog from "./components/search-summary-dialog";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

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
            <Card className="w-full py-0 max-w-none xl:max-w-sm h-max gap-0 bg-gray-50/30 shadow-accent-foregroundmd">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-semibold">
                  Search Summary -{" "}
                  <span className="font-semibold italic">
                    &quot;{query}&quot;
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-500 font-light text-sm">
                  {data.pagination.total} document(s) found
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-4 pb-4">
                <SearchSummary count={data.pagination.total} />
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
