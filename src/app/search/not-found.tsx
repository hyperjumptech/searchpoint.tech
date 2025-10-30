"use client";

import { SearchX } from "lucide-react";
import { TypographyH2, TypographyP } from "@/components/typography";

export default function NotFound() {
  return (
    <div className="mx-auto flex flex-col items-center justify-center max-w-2xl py-20 px-4 text-center space-y-2">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="w-6 h-6" />
      </div>
      <TypographyH2 className="mt-4">No results found</TypographyH2>
      <TypographyP className="text-muted-foreground">
        {
          "We couldn't find any matching search results. Try a different keyword or filter."
        }
      </TypographyP>
    </div>
  );
}
