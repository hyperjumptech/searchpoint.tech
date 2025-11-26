"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (
      document.referrer &&
      new URL(document.referrer).hostname === window.location.hostname
    ) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-blue-600 hover:underline mb-6 flex items-center gap-2 cursor-pointer">
      <ArrowLeft /> Back
    </button>
  );
}
