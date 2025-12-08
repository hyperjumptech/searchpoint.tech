"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const types = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "office", label: "Microsoft Office" },
  { key: "images", label: "Images" },
];

export default function CategoryTabs() {
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "all";

  const buildUrl = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", key);
    params.set("page", "1");

    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
      {types.map((t) => (
        <Button
          key={t.key}
          variant={"outline"}
          className={cn(
            "px-3 py-1 border rounded-md text-sm cursor-pointer",
            currentType === t.key
              ? "bg-red-600 text-white border-red-600"
              : "bg-white",
          )}
          asChild>
          <a href={buildUrl(t.key)}>{t.label}</a>
        </Button>
      ))}
    </div>
  );
}
