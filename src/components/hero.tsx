"use client";

import { useUserStore } from "@/stores/user";
import { TypographyH1, TypographyP } from "@/components/typography";

export default function Hero() {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border/80 bg-card/80 text-xs font-semibold tracking-wide text-muted-foreground mb-4 shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        The Desktop Knowledge Layer
      </div>
      <TypographyH1>Welcome back, {user?.name || "there"}</TypographyH1>
      <TypographyP className="mt-3 text-muted-foreground max-w-xl text-center text-base sm:text-lg">
        One search bar for all your local files, OneDrive, and SharePoint.
        Grounded knowledge for your daily workflows.
      </TypographyP>
    </div>
  );
}
