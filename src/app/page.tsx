import { headers } from "next/headers";
import { detectOSFromUA } from "@/lib/detect-os";
import HomePageClient from "@/components/home-page";

export default async function HomePage() {
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const detectedOS = detectOSFromUA(ua);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  return <HomePageClient detectedOS={detectedOS} isMobile={isMobile} />;
}
