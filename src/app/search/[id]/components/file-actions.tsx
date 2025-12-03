"use client";

import { Button } from "@/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import { TypographyP } from "@/components/typography";
import { CircleAlert } from "lucide-react";

export function FileActions({ url }: { url?: string }) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <Button
        size="lg"
        variant="outline"
        className="rounded-full font-bold w-fit"
        onClick={() => {
          window.open(url, "_blank");
        }}>
        <SquareArrowOutUpRight /> Open in SharePoint
      </Button>
      <TypographyP className="text-muted-foreground flex items-center gap-2">
        <CircleAlert className="w-4 h-4 shrink-0" /> For privacy and security
        reasons, we can’t open this file for you. Please click link above to
        access it directly in SharePoint.
      </TypographyP>
    </div>
  );
}
