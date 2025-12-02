"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const types = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "office", label: "Microsoft Office" },
  { key: "images", label: "Images" },
];

export default function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "all";

  const onClick = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", key);

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
      {types.map((t) => (
        <button
          key={t.key}
          onClick={() => onClick(t.key)}
          className={cn(
            "px-3 py-1 rounded-md border text-sm cursor-pointer",
            currentType === t.key
              ? "bg-red-600 text-white border-red-600"
              : "bg-white",
          )}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
