import { performSearch } from "@/actions/search";
import SearchResultItem from "@/components/search-result-item";
import NotFound from "./not-found";
import PaginationButtons from "@/components/pagination-buttons";

const googleExt = ["gdoc", "gsheet", "gslide"];
const officeExt = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const pdfExt = ["pdf"];

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const type = params?.type ?? "all";
  const page = parseInt(params?.page ?? "1");

  if (!query) {
    return <NotFound />;
  }

  const data = await performSearch(query, page);

  const searchResults = data.results.filter((result) => {
    const ext = result.fileName.split(".").pop()?.toLowerCase() ?? "";

    switch (type) {
      case "pdf":
        return pdfExt.includes(ext);
      case "google":
        return googleExt.includes(ext);
      case "office":
        return officeExt.includes(ext);
      default:
        return true;
    }
  });

  if (searchResults.length === 0) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col space-y-8 max-w-3xl">
      {searchResults.map((result, idx) => (
        <SearchResultItem key={result.fileHash + idx} result={result} />
      ))}
      <PaginationButtons pagination={data.pagination} />
    </div>
  );
}
