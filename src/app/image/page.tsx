import { performSearch } from "@/actions/search";
import ImageResultItem from "./components/ImageResultItem";
import PaginationButtons from "@/components/pagination-buttons";
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
  const page = parseInt(params?.page ?? "1");
  const sources = params?.sources ?? null;
  const limit = 15;

  const data = await performSearch(query, page, limit, type, sources);

  if (data.results.length === 0) {
    return notFound();
  }

  return (
    <>
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5  gap-4">
        {data.results.map((result, idx) => (
          <ImageResultItem key={result.fileHash + idx} result={result} />
        ))}
      </div>
      <div className="flex justify-center lg:block p-8">
        <PaginationButtons pagination={data.pagination} />
      </div>
    </>
  );
}
