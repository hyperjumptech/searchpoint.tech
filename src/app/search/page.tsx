import { performSearch } from "@/actions/search";
import SearchResultItem from "@/components/search-result-item";
import NotFound from "./not-found";

const googleExt = ["gdoc", "gsheet", "gslide"];
const officeExt = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const pdfExt = ["pdf"];

type SearchPageProps = {
  searchParams: { q?: string; type?: string };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const type = searchParams?.type ?? "all";

  if (!query) {
    return <NotFound />;
  }

  const data = await performSearch(query);

  const searchResults = data.filter((result) => {
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
      {searchResults.map((result) => (
        <SearchResultItem key={result.fileHash} result={result} />
      ))}
    </div>
  );
}
