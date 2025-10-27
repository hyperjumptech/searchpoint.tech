"use client";

import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

interface User {
  name?: string;
  upn?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  initializeUser: (token: string) => void;
}

const parseToken = (token: string): User | null => {
  try {
    const decoded: Partial<User> = jwtDecode(token);

    return {
      name: decoded.name,
      upn: decoded.upn,
    };
  } catch {
    return null;
  }
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  initializeUser: (token) => {
    const user = parseToken(token);

    if (user) {
      set({ user });
    }
  },
}));
