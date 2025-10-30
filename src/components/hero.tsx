"use client";

import { useUserStore } from "@/stores/user";
import { TypographyH1, TypographyP } from "@/components/typography";

export default function Hero() {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col items-center">
      <TypographyH1>Welcome, {user?.name}!</TypographyH1>
      <TypographyP className="text-muted-foreground max-w-xl text-center">
        {
          "Search across both public resources and your organization's private files with enterprise-grade security and role-based access control."
        }
      </TypographyP>
    </div>
  );
}
