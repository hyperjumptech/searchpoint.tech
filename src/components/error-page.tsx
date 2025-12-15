"use client";

import { AlertCircle } from "lucide-react";

import { TypographyH2, TypographyP } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";

export function ErrorPage() {
  const { logOut } = useUserStore();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="w-6 h-6" />
      </div>
      <TypographyH2 className="mt-4">Something went wrong</TypographyH2>
      <TypographyP className="text-muted-foreground">
        {
          "Sorry, we couldn't load the search results. Please re-login and try again later."
        }
      </TypographyP>
      <Button onClick={async () => await logOut()} className="mt-4">
        Re-login
      </Button>
    </div>
  );
}
