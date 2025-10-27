"use client";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { User } from "@/types/user";
import { generateLocalAvatar } from "@/lib/avatar";

interface UserStore {
  user: User | null;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

const parseToken = (token: string): User | null => {
  try {
    const decoded: Partial<User> = jwtDecode(token);
    return {
      name: decoded.name ?? "",
      upn: decoded.upn ?? "",
      avatar: decoded.avatar ?? generateLocalAvatar(decoded.name ?? "User"),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  fetchUser: async () => {
    if (typeof window === "undefined") return;

    const token = Cookies.get("SCSE_ID");
    if (!token) {
      set({ user: null });
      return;
    }

    const user = parseToken(token);
    set({ user });
  },

  logout: () => {
    Cookies.remove("SCSE_ID");

    set({ user: null });
  },
}));
