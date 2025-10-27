"use client";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

interface User {
  name: string;
  upn: string;
}

interface UserStore {
  user: User | null;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  fetchUser: async () => {
    if (typeof window === "undefined") return;

    const token = Cookies.get("SCSE_ID");

    if (token) {
      const user = jwtDecode<User>(token);

      set({ user });
    } else {
      set({ user: null });
    }
  },
  logout: () => {
    Cookies.remove("SCSE_ID");

    set({ user: null });
  },
}));
