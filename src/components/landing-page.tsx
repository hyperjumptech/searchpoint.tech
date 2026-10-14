"use client";

import { useRouter } from "next/navigation";

import HeroSection from "@/components/landing/hero-section";
import KnowledgeLayerSection from "@/components/landing/knowledge-layer-section";
import UnifiedSearchSection from "@/components/landing/unified-search-section";
import SmartRenameSection from "@/components/landing/smart-rename-section";
import SecurityMinimalSection from "@/components/landing/security-minimal-section";
import DownloadMinimalSection from "@/components/landing/download-minimal-section";

import type { TenantContent } from "@/lib/tenant";
import type { Company } from "@/lib/company";

export default function LandingPageClient({
  detectedOS,
  isMobile,
  content,
  company,
}: {
  detectedOS: string;
  isMobile: boolean;
  isGoogleChrome: boolean;
  content: TenantContent;
  company?: Company;
}) {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push("/login");
  };

  return (
    <main className="w-full flex flex-col items-center">
      {/* 1. Hero Section with Interactive Spotlight UI Preview */}
      <HeroSection
        detectedOS={detectedOS}
        isMobile={isMobile}
        onDownload={handleGoToLogin}
        content={content.hero}
        company={company}
      />

      {/* 2. Knowledge Layer for LLMs */}
      <KnowledgeLayerSection />

      {/* 3. Unified Desktop Search */}
      <UnifiedSearchSection />

      {/* 4. Intelligent File Organization (Rename by AI) */}
      <SmartRenameSection />

      {/* 5. Enterprise Security & Sovereignty */}
      <SecurityMinimalSection />

      {/* 6. Multi-Platform Download */}
      <DownloadMinimalSection
        detectedOS={detectedOS}
        onDownloadPlatform={handleGoToLogin}
      />

      {/* 7. Enterprise Footer */}
      <footer className="w-full border-t border-border/40 bg-card/60 backdrop-blur-sm py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-semibold text-foreground">SearchPoint</span>
            <span className="hidden sm:inline">·</span>
            <span>The Enterprise Knowledge Layer</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#knowledge-layer"
              className="hover:text-foreground transition-colors">
              Knowledge Layer
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors">
              Unified Search
            </a>
            <a
              href="#smart-rename"
              className="hover:text-foreground transition-colors">
              AI Organization
            </a>
            <a
              href="#security"
              className="hover:text-foreground transition-colors">
              Security
            </a>
            <a
              href="#download"
              className="hover:text-foreground transition-colors">
              Download
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
