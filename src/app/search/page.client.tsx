"use client";

import { useState, useEffect, useMemo, Fragment, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { FileSource } from "@/types/file";
import FileItem from "@/components/file-item";
import { useUserStore } from "@/stores/user";

type FilterName = "All" | "Microsoft Office" | "PDF";
type FilterTypeMap = Record<FilterName, string | string[] | null>;

interface SearchClientProps {
  handleSearch: (query: string, email?: string) => Promise<FileSource[]>;
}

export default function SearchClient({ handleSearch }: SearchClientProps) {
  const searchParams = useSearchParams();
  const { user: userFromStore } = useUserStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileSource[] | null>(null);
  const [filteredResults, setFilteredResults] = useState<FileSource[]>([]);
  const [activeFilter] = useState<FilterName>("All");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  return (
    <main className="min-h-screen bg-white">
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
