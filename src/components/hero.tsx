"use client";

import { useUserStore } from "@/stores/user";
import { TypographyH1, TypographyP } from "@/components/typography";

export default function Hero() {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col items-center text-center">
      <TypographyH1>Welcome back, {user?.name || "there"}</TypographyH1>
      <TypographyP className="mt-3 text-muted-foreground max-w-xl text-center text-base sm:text-lg">
        One search bar for all your local files, OneDrive, and SharePoint.
        Grounded knowledge for your daily workflows.
      </TypographyP>
    </div>
  );
}
