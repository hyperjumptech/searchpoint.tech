"use client";

import { useUserStore } from "@/stores/user";
import { TypographyH1, TypographyP } from "@/components/typography";

export default function Hero() {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col items-center">
      <TypographyH1>Welcome back, {user?.name || "there"}</TypographyH1>
      <TypographyP className="mt-4 text-muted-foreground max-w-lg text-center text-lg">
        Unified search for your files and Microsoft 365.
      </TypographyP>
    </div>
  );
}
