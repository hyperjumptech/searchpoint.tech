"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { logout } from "@/actions/token";
import { useUserStore } from "@/stores/user";

export default function LogoutPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    async function doLogout() {
      await logout();
      setUser(null);

      router.push("/");
    }
    doLogout();
  }, [router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <h1>Logging out...</h1>
    </div>
  );
}
