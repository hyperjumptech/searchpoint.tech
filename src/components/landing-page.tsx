"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import HeroSection from "@/components/landing/hero-section";
import SourcesSection from "@/components/landing/sources-section";
import FeaturesBento from "@/components/landing/features-bento";
import DeepDiveSection from "@/components/landing/deep-dive-section";
import ComparisonSection from "@/components/landing/comparison-section";
import SecuritySection from "@/components/landing/security-section";
import DownloadSection from "@/components/landing/download-section";

import type { TenantContent } from "@/lib/tenant";

export default function LandingPageClient({
  detectedOS,
  isMobile,
  content,
}: {
  detectedOS: string;
  isMobile: boolean;
  isGoogleChrome: boolean;
  content: TenantContent;
}) {
  const router = useRouter();
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
  }>({ isOpen: false, src: "", alt: "" });

  const handleOpenImage = (src: string, alt: string) => {
    setLightbox({ isOpen: true, src, alt });
  };

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
      />

      {/* 2. Supported Connected Sources & Ecosystems */}
      <SourcesSection onOpenImage={handleOpenImage} />

      {/* 3. Core Value Pillars & Feature Storyboards */}
      <FeaturesBento onOpenImage={handleOpenImage} />

      {/* 4. AI Knowledge Layer & MCP Integration */}
      <DeepDiveSection onOpenImage={handleOpenImage} />

      {/* 5. Comprehensive Comparison Matrix */}
      <ComparisonSection />

      {/* 6. Security & Deployment Architecture */}
      <SecuritySection onOpenImage={handleOpenImage} />

      {/* 7. Multi-Platform Download Matrix */}
      <DownloadSection
        detectedOS={detectedOS}
        onDownloadPlatform={handleGoToLogin}
        content={content.download}
      />

      {/* 8. Enterprise Footer */}
      <footer className="w-full border-t border-border/40 bg-card/60 backdrop-blur-sm py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-semibold text-foreground">
              {content.productName}
            </span>
            <span className="hidden sm:inline">·</span>
            <span>{content.footer.tagline}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#sources"
              className="hover:text-foreground transition-colors">
              Connectors
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors">
              Features
            </a>
            <a
              href="#ai-knowledge"
              className="hover:text-foreground transition-colors">
              AI Knowledge
            </a>
            <a
              href="#comparison"
              className="hover:text-foreground transition-colors">
              Comparison
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

      {/* Image Zoom Lightbox Dialog */}
      {lightbox.isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", alt: "" })}>
          <div
            className="relative max-w-[94vw] max-h-[90vh] flex flex-col items-center cursor-default"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox({ isOpen: false, src: "", alt: "" })}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors cursor-pointer"
              aria-label="Close image">
              <X className="h-5 w-5" />
            </button>
            <Image
              src={lightbox.src}
              alt={lightbox.alt}
              width={1408}
              height={768}
              className="max-h-[85vh] w-auto h-auto rounded-xl border border-white/10 shadow-2xl object-contain"
            />
            <p className="mt-3 text-xs text-center text-white/70 max-w-xl">
              {lightbox.alt}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
