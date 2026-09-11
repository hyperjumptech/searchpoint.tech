import { headers } from "next/headers";
import { detectOSFromUA, hasGoogleChromeBrand } from "@/lib/detect-os";
import { env } from "@/lib/env";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";
import LandingPageClient from "@/components/landing-page";

export default async function LandingPage() {
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
  const tenant = getTenantConfig(
    resolveTenantId(env.TENANT, host),
    env.APP_NAME,
  );

  return (
    <LandingPageClient
      detectedOS={detectedOS}
      isMobile={isMobile}
      isGoogleChrome={isGoogleChrome}
      content={tenant.content}
    />
  );
}
