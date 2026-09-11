import { headers } from "next/headers";
import { detectOSFromUA, hasGoogleChromeBrand } from "@/lib/detect-os";
import { env } from "@/lib/env";
import { resolveTenantId } from "@/lib/tenant";
import HomePageClient from "@/components/home-page";

export default async function HomePage() {
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const detectedOS = detectOSFromUA(ua);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isGoogleChrome = hasGoogleChromeBrand(headersList.get("sec-ch-ua"));

  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const tenant = resolveTenantId(env.TENANT, host);

  return (
    <HomePageClient
      detectedOS={detectedOS}
      isMobile={isMobile}
      isGoogleChrome={isGoogleChrome}
      company={tenant}
    />
  );
}
