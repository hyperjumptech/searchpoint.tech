"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-blue-600 hover:underline mb-6 flex items-center gap-2 cursor-pointer">
      <ArrowLeft /> Back
    </button>
  );
}
