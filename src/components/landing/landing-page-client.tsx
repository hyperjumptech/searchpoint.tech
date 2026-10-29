"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import LandingHeader from "@/components/landing/landing-header";
import {
  LandingLanguageProvider,
  useLandingLanguage,
} from "@/components/landing/landing-language-provider";

import HeroSection from "@/components/landing/hero-section";
import DesktopSearchDemo from "@/components/landing/desktop-search-demo";
import ConnectorsSection from "@/components/landing/connectors-section";
import CapabilitiesSection from "@/components/landing/capabilities-section";
import ArchitectureSection from "@/components/landing/architecture-section";
import ManifestoSection from "@/components/landing/manifesto-section";
import EnterpriseSection from "@/components/landing/enterprise-section";
import FaqSection from "@/components/landing/faq-section";
import DownloadCtaSection from "@/components/landing/download-cta-section";
import LandingFooter from "@/components/landing/landing-footer";

import type { TenantContent } from "@/lib/tenant";
import type { Company } from "@/lib/company";
import { detectOSFromUA } from "@/lib/detect-os";

interface LandingPageClientProps {
  detectedOS: string;
  isMobile: boolean;
  isGoogleChrome: boolean;
  content: TenantContent;
  company?: Company;
}

function LandingPageContent({
  detectedOS: initialOS,
  isMobile: initialIsMobile,
  content,
  company,
}: LandingPageClientProps) {
  const router = useRouter();
  const { resolvedTheme, theme } = useTheme();
  const { lang } = useLandingLanguage();
  const [mounted, setMounted] = React.useState(false);

  // Server values first (hydration match), then refine from the real browser —
  // static export prerenders without a user-agent.
  const [detectedOS, setDetectedOS] = React.useState(initialOS);
  const [isMobile, setIsMobile] = React.useState(initialIsMobile);

  React.useEffect(() => {
    const ua = navigator.userAgent;
    setDetectedOS(detectOSFromUA(ua));
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(ua));
  }, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoToLogin = React.useCallback(() => {
    // Real app URL when NEXT_PUBLIC_LOGIN_URL is set (static deploy);
    // otherwise the local /login route.
    const url = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
    if (/^https?:\/\//.test(url)) {
      window.location.href = url;
    } else {
      router.push(url);
    }
  }, [router]);

  // Determine current active theme safely for SSR
  const activeTheme = mounted ? resolvedTheme || theme || "dark" : "dark";

  return (
    <div
      className="sp-landing nx-new relative isolate min-h-screen overflow-x-clip bg-background text-foreground"
      data-theme={activeTheme}
      lang={lang}
      suppressHydrationWarning>
      {/* 1. Header with brand, navigation, language, and theme switchers */}
      <LandingHeader company={company} />

      <main className="w-full flex flex-col items-center">
        {/* 2. Hero Section with Interactive Spotlight UI Preview */}
        <HeroSection
          detectedOS={detectedOS}
          isMobile={isMobile}
          onDownload={handleGoToLogin}
          content={content.hero}
          company={company}
        />

        {/* 3. Desktop Search Product Demo */}
        <DesktopSearchDemo />

        {/* 4. Enterprise Connectors Atlas & Trust Planes */}
        <ConnectorsSection />

        {/* 5. Core Capabilities Carousel */}
        <CapabilitiesSection />

        {/* 6. Architecture Manifesto Permission Perimeter */}
        <ManifestoSection />

        {/* 7. Five-Step Architecture Pipeline */}
        <ArchitectureSection />

        {/* 8. Built for the Enterprise Accordion & Security Audits */}
        <EnterpriseSection />

        {/* 9. Client Architecture & Security FAQ */}
        <FaqSection />

        {/* 10. Multi-Platform Download CTA */}
        <DownloadCtaSection
          detectedOS={detectedOS}
          onDownloadPlatform={handleGoToLogin}
        />

        {/* 11. Enterprise Footer */}
        <LandingFooter company={company} content={content} />
      </main>
    </div>
  );
}

export default function LandingPageClient(props: LandingPageClientProps) {
  return (
    <LandingLanguageProvider defaultLang="en">
      <LandingPageContent {...props} />
    </LandingLanguageProvider>
  );
}
