import { performSearch } from "@/actions/search";
import SearchSummaryDialog from "./dialog";
import SearchSummarySidebar from "./sidebar";

export default async function SearchSummary({
  query,
  page,
  type,
  open,
}: {
  query: string;
  page: number;
  type: "sidebar" | "dialog";
  open?: boolean;
}) {
  // Get search summary data by performing search again without filters (server-side only)
  const summaryData = await performSearch(query, page, 10, undefined);

  if (type === "sidebar") {
    return (
      <SearchSummarySidebar
        query={query}
        total={summaryData.pagination.total}
        meta={summaryData}
      />
    );
  } else if (type === "dialog") {
    return (
      <SearchSummaryDialog
        open={open ?? false}
        query={query}
        total={summaryData.pagination.total}
        meta={summaryData}
      />
    );
  }

  return null;
}
