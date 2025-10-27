"use client";

import { useUserStore } from "@/stores/user";
import { useEffect } from "react";

export default function Logout() {
  const { logout } = useUserStore();

  useEffect(() => {
    logout();

    window.location.href = "/";
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <h1>You have been logged out.</h1>
    </div>
  );
}
