"use client";

import Hero from "@/components/hero";
import { detectOS, osToUpdaterFormat } from "@/lib/detect-os";
import { useUserStore } from "@/stores/user";
import { Download } from "lucide-react";

export default function HomePage() {
  const { user } = useUserStore();

  const handleDownload = async () => {
    if (!user?.email) return;

    // Detect OS from browser
    const detectedOS = detectOS();
    const { target, arch } = osToUpdaterFormat(detectedOS);

    try {
      // Trigger download URL via updater API with dynamic OS
      const res = await fetch(`/api/updater/${target}/${arch}/0.1.1`);
      if (res.ok) {
        const data = await res.json();
        // Map OS to platform key
        let platformKey: string;
        switch (detectedOS) {
          case "windows-x86_64":
            platformKey = "windows-x86_64";
            break;
          case "linux-x86_64":
            platformKey = "linux-x86_64";
            break;
          default:
            platformKey = "macOS-download"; // this is a workaround to get the .dmg file instead of the .tar.gz
        }
        const url = data.platforms?.[platformKey]?.url;
        if (url) {
          window.location.href = url;
        }
      }
    } catch {}
  };
  return (
    <main className="mx-auto flex flex-col items-center justify-center max-w-7xl min-h-[calc(100vh-16rem)] px-6">
      <Hero />
      <div className="mt-8 flex justify-center w-full">
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-white text-lg shadow-md border rounded-lg transition-colors cursor-pointer hover:bg-gray-100 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download SearchPoint Desktop
        </button>
      </div>
    </main>
  );
}
