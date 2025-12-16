import { performSearch } from "@/actions/search";
import InfiniteImageGrid from "./components/InfiniteImageGrid";
import notFound from "../search/not-found";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sources?: string;
  }>;
};

export default async function ImagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const type = "image";
  const page = 1;
  const sources = params?.sources ?? null;
  const limit = 20;

  const data = await performSearch(query, page, limit, type, sources);

  if (data.results.length === 0) {
    return notFound();
  }

  // Calculate if there are more images to load
  const hasMore =
    data.pagination.offset + data.pagination.limit < data.pagination.total;

  return (
    <InfiniteImageGrid
      initialQuery={query}
      initialSources={sources}
      initialImages={data.results}
      initialHasMore={hasMore}
      initialTotal={data.pagination.total}
    />
  );
}
