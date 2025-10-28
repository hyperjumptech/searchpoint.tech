"use client";

import {
  useState,
  useEffect,
  FormEvent,
  useMemo,
  Fragment,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { FileSource } from "@/types/file";
import FileItem from "@/components/file-item";
import { useUserStore } from "@/stores/user";
import { UserMenu } from "@/components/user-menu";
import { User } from "@/types/user";

type FilterName = "All" | "Microsoft Office" | "PDF";
type FilterTypeMap = Record<FilterName, string | string[] | null>;

interface SearchClientProps {
  handleSearch: (query: string, email?: string) => Promise<FileSource[]>;
}

export default function SearchClient({ handleSearch }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: userFromStore } = useUserStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileSource[] | null>(null);
  const [filteredResults, setFilteredResults] = useState<FileSource[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterName>("All");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filters = useMemo<{ name: FilterName }[]>(
    () => [{ name: "All" }, { name: "Microsoft Office" }, { name: "PDF" }],
    []
  );

  const filterTypeMap: FilterTypeMap = useMemo(
    () => ({
      All: null,
      "Microsoft Office": [
        "doc",
        "docx",
        "docm",
        "xls",
        "xlsx",
        "xlsm",
        "ppt",
        "pptx",
        "pptm",
      ],
      PDF: "pdf",
    }),
    []
  );

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);

    const trimmed = q.trim();
    const email = userFromStore?.upn;

    if (!trimmed) {
      setResults(null);
      setFilteredResults([]);
      setHasSearched(false);
      return;
    }

    if (!email) {
      return; // Wait for user data to load
    }

    setIsLoading(true);
    setHasSearched(true);

    startTransition(async () => {
      try {
        const newResults = await handleSearch(trimmed, email);
        setResults(newResults);
        setFilteredResults(newResults);
      } finally {
        setIsLoading(false);
      }
    });
  }, [searchParams, userFromStore?.upn, handleSearch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const queryParams = new URLSearchParams({
      q: trimmed,
    });
    router.push(`/search?${queryParams.toString()}`);
  };

  useEffect(() => {
    if (!results) {
      setFilteredResults([]);
      return;
    }

    if (activeFilter === "All") {
      setFilteredResults([...results]);
      return;
    }

    const typeToMatch = filterTypeMap[activeFilter];
    const filtered = results.filter((r) => {
      if (!typeToMatch) return true;
      if (Array.isArray(typeToMatch)) {
        return typeToMatch.some((ext) =>
          r.extension?.toLowerCase().includes(ext)
        );
      }
      return r.extension?.toLowerCase() === typeToMatch;
    });
    setFilteredResults(filtered);
  }, [activeFilter, results, filterTypeMap]);

  const clearSearch = () => {
    setQuery("");
    setActiveFilter("All");
    setResults(null);
    setFilteredResults([]);
    setHasSearched(false);
    router.push("/search", { scroll: false });
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] items-start p-4 mx-auto w-full gap-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Image
                src="/icons/sinarmas-logo.svg"
                alt="Sinarmas Logo"
                width={143}
                height={32}
                className="h-8"
              />
            </Link>
            <div className="xl:hidden flex items-center space-x-3">
              <UserMenu user={userFromStore as User} />
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full xl:max-w-6xl mx-auto">
            <form onSubmit={handleSubmit} className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map(({ name }) => (
                <button
                  key={name}
                  onClick={() => setActiveFilter(name)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition whitespace-nowrap ${
                    activeFilter === name
                      ? "bg-[#CB3635] text-white border-[#CB3635]"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-3 justify-end">
            <UserMenu user={userFromStore as User} />
          </div>
        </div>
      </header>

      <section className="grid grid-rows-1 xl:grid-rows-[auto_1fr_auto] items-start px-6 py-4 xl:max-w-6xl mx-auto gap-3">
        {isLoading ? (
          <p className="text-sm text-gray-500 mt-6 text-center">Searching...</p>
        ) : !hasSearched ? (
          <p className="text-sm text-gray-500 mt-6 text-center">
            Please perform a search first.
          </p>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((file, idx) => (
            <Fragment key={idx}>
              <FileItem _source={file} />
              {idx < filteredResults.length - 1 && <Separator />}
            </Fragment>
          ))
        ) : (
          <p className="text-sm text-gray-500 mt-6 text-center">
            No results found
          </p>
        )}
      </section>
    </main>
  );
}
