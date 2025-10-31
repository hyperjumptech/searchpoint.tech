import { SearchResultItemSkeleton } from "@/components/search-result-item";

export default function Loading() {
  return (
    <div className="flex flex-col space-y-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <SearchResultItemSkeleton key={i} />
      ))}
    </div>
  );
}
