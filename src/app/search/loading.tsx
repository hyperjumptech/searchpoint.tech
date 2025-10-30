import { SearchResultItemSkeleton } from "@/components/search-result-item";

export default function Loading() {
  return (
    <div className="mx-auto flex flex-col max-w-6xl space-y-8 py-8 px-4 md:px-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <SearchResultItemSkeleton key={i} />
      ))}
    </div>
  );
}
