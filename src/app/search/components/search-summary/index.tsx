import { performSearch } from "@/actions/search";
import SearchSummaryView from "./view";
import SearchSummaryDialog from "./dialog";

export default async function SearchSummary({
  query,
  page,
  total,
  type,
  open,
}: {
  query: string;
  page: number;
  total: number;
  type: "sidebar" | "dialog";
  open?: boolean;
}) {
  // Get search summary data by performing search again without filters (server-side only)
  const summaryData = await performSearch(query, page, 10);

  if (type === "sidebar") {
    return <SearchSummaryView count={total} meta={summaryData} />;
  } else if (type === "dialog") {
    return (
      <SearchSummaryDialog
        open={open ?? false}
        query={query}
        count={total}
        meta={summaryData}
      />
    );
  }

  return null;
}
