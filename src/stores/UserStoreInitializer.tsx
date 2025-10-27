"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/user";

export function UserStoreInitializer({ scseId }: { scseId?: string }) {
  const initializeUser = useUserStore((state) => state.initializeUser);

  useEffect(() => {
    if (scseId) {
      initializeUser(scseId);
    }
  }, [scseId, initializeUser]);

  return null;
}
