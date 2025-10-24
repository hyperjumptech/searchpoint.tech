"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, FileText, Globe, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FileItem from "@/components/file-item";
import localData from "../../../public/data.json";
import { FileSource, FileValue } from "@/types/search";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState("All");
  const [results, setResults] = useState<FileSource[]>([]);
  const [filteredResults, setFilteredResults] = useState<FileSource[]>([]);

  const files: FileSource[] = (localData?.value || []).map(
    (v: FileValue) => v._source,
  );

  const filters = [
    { name: "All" },
    { name: "Google Workspace", icon: Globe },
    { name: "Microsoft Office", icon: Globe },
    { name: "PDF", icon: FileText },
    { name: "People", icon: Users },
  ];

  const filterTypeMap: Record<string, string | string[] | null> = {
    All: null,
    "Google Workspace": ["gdoc", "gsheet", "gslides", "gform", "gdraw"],
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
    People: "user",
  };

  const fetchResults = async (keyword?: string) => {
    let list = [...files];

    if (keyword && keyword.trim() !== "") {
      const q = keyword.toLowerCase();

      list = list.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q);
        const keywordMatch = item.keywords?.some((k) =>
          k.toLowerCase().includes(q),
        );
        const mimeMatch = item.mime_type?.toLowerCase().includes(q);
        return nameMatch || keywordMatch || mimeMatch;
      });
    }

    setResults(list);
    setFilteredResults(list);
  };

  useEffect(() => {
    fetchResults(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredResults(results);
      return;
    }

    const typeToMatch = filterTypeMap[activeFilter];
    setFilteredResults(
      results.filter((r) => {
        if (!typeToMatch) return true;
        if (Array.isArray(typeToMatch)) {
          return typeToMatch.some((ext) =>
            r.extension?.toLowerCase().includes(ext),
          );
        }
        return r.extension?.toLowerCase() === typeToMatch;
      }),
    );
  }, [activeFilter, results]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  const clearSearch = () => {
    setQuery("");
    setActiveFilter("All");
    fetchResults();
    router.push("/search");
  };

  const publicCount = filteredResults.filter((f) =>
    f.keywords?.some((kw) => kw.toLowerCase() === "public"),
  ).length;

  const privateCount = filteredResults.filter((f) =>
    f.keywords?.some((kw) => kw.toLowerCase() === "private"),
  ).length;

  const { name, role, avatar } = localData.user;

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] items-start p-4 mx-auto w-full xl:max-w-none gap-4">
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
            <div className="xl:hidden flex items-center space-x-3 justify-end">
              <div className="text-right">
                <div className="font-bold text-[#30302F]">{name}</div>
                <div className="text-xs text-[#909090]">{role}</div>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={avatar}
                  alt={name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 w-full xl:max-w-6xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="relative w-full"
              role="search"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
            <div className="text-right">
              <div className="font-bold text-[#30302F]">{name}</div>
              <div className="text-xs text-[#909090]">{role}</div>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={avatar}
                alt={name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-rows-1 xl:grid-rows-[auto_1fr_auto] items-start xl:px-0 md:px-6 px-6 py-4 xl:max-w-6xl mx-auto gap-3">
        <Badge className="bg-[#EFF6FF] text-[#3593EA] text-sm py-2 px-5 whitespace-normal break-words text-center">
          Search results: Secure Search shows {publicCount} public +{" "}
          {privateCount} private results
        </Badge>

        {filteredResults.length > 0 ? (
          filteredResults.map((file, idx) => (
            <div key={idx}>
              <FileItem {...file} />
              {idx < filteredResults.length - 1 && <Separator />}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 mt-6 text-center">
            No results found
          </p>
        )}
      </div>
    </main>
  );
}
