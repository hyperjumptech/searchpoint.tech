"use client";

import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-5xl mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me anything about your business data..."
          className="w-full truncate pl-12 pr-4 py-5 text-lg border border-gray-300 rounded-full
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
             shadow-[0px_0px_0px_1px_#09194821,0px_4px_8px_0px_#12376914]"
        />
      </div>
    </form>
  );
}
