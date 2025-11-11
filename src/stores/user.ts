"use client";

import { useEffect } from "react";
import { create } from "zustand";

export type User = {
  name?: string;
  initialName?: string;
  email?: string;
};

export interface State {
  user: User | null;
}

interface Action {
  setUser: (user: User | null) => void;
  logOut: () => Promise<void>;
}

type Store = State & Action;

export const useUserStore = create<Store>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logOut: async () => {
    await fetch("/logout");
    set({ user: null });
  },
}));

export function UserStoreInitializer({ user }: State) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return null;
}
