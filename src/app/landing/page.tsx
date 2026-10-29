import localFont from "next/font/local";
import { headers } from "next/headers";
import { detectOSFromUA, hasGoogleChromeBrand } from "@/lib/detect-os";
import { env } from "@/lib/env";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";
import LandingPageClient from "@/components/landing/landing-page-client";
import "@/components/landing/landing.css";

// Font paths resolve from src/app/landing/page.tsx here and from the promoted
// src/app/page.tsx in the static (GitHub Pages) build — see
// scripts/build-static.mjs, which also drops the now-unused landing/layout.
const manrope = localFont({
  src: "./fonts/Manrope-Variable.woff2",
  variable: "--font-landing-primary",
  display: "swap",
  weight: "200 800",
  style: "normal",
  fallback: ["system-ui", "sans-serif"],
});

const ibmPlexSerif = localFont({
  src: [
    {
      path: "./fonts/IBM-Plex-Serif-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/IBM-Plex-Serif-400.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-landing-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

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
    <div
      className={`${manrope.variable} ${ibmPlexSerif.variable} min-h-screen w-full`}>
      <LandingPageClient
        detectedOS={detectedOS}
        isMobile={isMobile}
        isGoogleChrome={isGoogleChrome}
        content={tenant.content}
        company={tenant.id}
      />
    </div>
  );
}
