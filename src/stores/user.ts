"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  name?: string;
  email?: string;
};

export interface State {
  user: User | null;
}

interface Action {
  setUser: (user: User | null) => void;
}

type Store = State & Action;

export const useUserStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: "user-storage",
    }
  )
);

export function UserStoreInitializer({ user }: State) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return null;
}
