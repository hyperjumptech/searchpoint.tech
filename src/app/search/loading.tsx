import { SearchResultItemSkeleton } from "@/components/search-result-item";
import PageLayout from "./components/page-layout";

export default function Loading() {
  return (
    <PageLayout>
      <div className="flex flex-col space-y-8">
        {Array.from({ length: 10 }).map((_, i) => (
          <SearchResultItemSkeleton key={i} />
        ))}
      </div>
    </PageLayout>
  );
}
