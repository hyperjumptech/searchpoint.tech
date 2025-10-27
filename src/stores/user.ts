import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

interface User {
  name: string;
}

interface UserStore {
  user: User | null;
  logout: () => void;
}

function getUserFromCookie() {
  try {
    const token = Cookies.get("SCSE_ID");
    if (!token) return null;

    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}

export const useUserStore = create<UserStore>((set) => ({
  user: getUserFromCookie(),
  logout: () => {
    Cookies.remove("SCSE_ID");

    set({ user: null });

    window.location.href = "/login";
  },
}));
