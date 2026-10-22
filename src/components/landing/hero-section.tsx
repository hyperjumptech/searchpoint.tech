"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useLandingLanguage } from "./landing-language-provider";
import { LandingContainer } from "./landing-ui";
import { CloudCanvas } from "./visuals/cloud-canvas";
import { HeroWaves } from "./visuals/hero-waves";
import { HeroOrbits } from "./visuals/hero-orbits";
import type { TenantContent } from "@/lib/tenant";
import type { Company } from "@/lib/company";

export interface HeroSectionProps {
  detectedOS?: string;
  isMobile?: boolean;
  onDownload?: () => void;
  onSelectPlatform?: (os: string) => void;
  downloaded?: boolean;
  content?: TenantContent["hero"];
  company?: Company;
}

export default function HeroSection({ onDownload, content }: HeroSectionProps) {
  const { t } = useLandingLanguage();

  return (
    <div className="relative isolate w-full hero-gradient-mesh">
      {/* 1. WebGL2 Dynamic Shader Background */}
      <CloudCanvas />

      {/* 2. Hero Section Container */}
      <section
        id="hero"
        className="sp-hero relative overflow-hidden pt-[130px] pb-[100px] md:pt-[170px] md:pb-[140px]">
        <LandingContainer className="hero-container relative flex flex-col items-center text-center">
          {/* Headline H1 with Display Font & Tenant Primary Dot */}
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="sp-hero-title font-display font-normal text-foreground tracking-tight text-center">
              The AI Knowledge Layer{" "}
              <span className="inline-block">
                for Multi source Enterprise Data
                <span className="text-primary font-bold"></span>
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <div>
            <p className="mt-5 max-w-[580px] text-[16px] md:text-[17px] leading-[1.6] font-light text-muted-foreground mx-auto">
              {content?.subheadline || t("hero.sub")}
            </p>
          </div>

          {/* Animated Waves, Orbits & CTA Container */}
          <div className="relative mt-[60px] w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0">
              {/* Dynamic Harmonic Sine Waves */}
              <HeroWaves />

              {/* Concentric Elliptical Orbits with Moving Particles */}
              <HeroOrbits />
            </div>

            {/* CTA Buttons */}
            <div className="relative flex flex-wrap items-center justify-center gap-7 pt-2">
              {/* Glowing Radial CTA */}
              <div className="relative inline-block overflow-hidden rounded-full p-[1px]">
                <div
                  aria-hidden="true"
                  className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
                  style={{
                    background:
                      "radial-gradient(circle, var(--sp-accent), transparent 15%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
                  style={{
                    background:
                      "radial-gradient(circle, var(--sp-accent), transparent 15%)",
                  }}
                />
                <div className="relative z-10">
                  <a
                    href="#download"
                    onClick={() => onDownload?.()}
                    className="gradient-brand-btn inline-flex items-center justify-center gap-2 rounded-full leading-[1.25] font-semibold whitespace-nowrap h-[38px] px-6 text-[13px] shadow-md transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                    <Download className="h-3.5 w-3.5" />
                    <span>{t("hero.cta_download")}</span>
                  </a>
                </div>
              </div>

              {/* Secondary Outline Link */}
              <a
                href="#desktop-search"
                className="inline-flex h-[38px] items-center justify-center rounded-full border border-border/80 px-6 text-[13px] leading-[1.25] font-semibold text-foreground transition-all hover:border-foreground/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                {t("hero.cta_explore")}
              </a>
            </div>
          </div>
        </LandingContainer>
      </section>
    </div>
  );
}
