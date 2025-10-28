"use client";

import { useUserStore } from "@/stores/user";

export default function Hero() {
  const { user } = useUserStore();

  return (
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold text-[#30302F] mb-5">
        Welcome, {user?.name || ""}!
      </h1>
      <p className="text-[#909090] font-normal max-w-xl leading-relaxed">
        Search across both public resources and your organization&apos;s private
        files with enterprise-grade security and role-based access control.
      </p>
    </div>
  );
}
