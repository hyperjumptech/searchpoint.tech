import { headers } from "next/headers";
import { detectOSFromUA, hasGoogleChromeBrand } from "@/lib/detect-os";
import { env } from "@/lib/env";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";
import LandingPageClient from "@/components/landing/landing-page-client";

// Static export (GitHub Pages) has no request headers; LandingPageClient
// refines OS/mobile detection client-side after hydration.
const isStaticExport = process.env.STATIC_EXPORT === "1";

export default async function LandingPage() {
  const headersList = isStaticExport ? null : await headers();
  const ua = headersList?.get("user-agent") || "";
  const detectedOS = detectOSFromUA(ua);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isGoogleChrome = hasGoogleChromeBrand(
    headersList?.get("sec-ch-ua") || null,
  );

  const host =
    headersList?.get("x-hostname") ||
    headersList?.get("x-forwarded-host") ||
    headersList?.get("host") ||
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
      company={tenant.id}
    />
  );
}
