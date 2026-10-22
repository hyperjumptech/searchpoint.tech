"use client";

import * as React from "react";
import {
  Layers,
  Mail,
  Box,
  Lock,
  Terminal,
  ShieldCheck,
  Cloud,
  Users,
  BookOpen,
  FileText,
  MessageCircle,
} from "lucide-react";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";
import { LandingContainer } from "@/components/landing/landing-ui";
import { AppleIcon, WindowsIcon } from "@/components/icons/os-icons";

interface DownloadCtaSectionProps {
  detectedOS: string;
  onDownloadPlatform: (platformKey: string) => void;
}

interface OrbitRingNode {
  angle: string;
  radius: string;
  accent: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const OUTER_TILES: OrbitRingNode[] = [
  { angle: "0deg", radius: "380px", accent: "#34d399", icon: Layers },
  { angle: "60deg", radius: "380px", accent: "#f87171", icon: Mail },
  { angle: "120deg", radius: "380px", accent: "#fbbf24", icon: Box },
  { angle: "180deg", radius: "380px", accent: "#f59e0b", icon: Lock },
  { angle: "240deg", radius: "380px", accent: "#22d3ee", icon: Terminal },
  { angle: "300deg", radius: "380px", accent: "#8b5cf6", icon: ShieldCheck },
];

const MID_TILES: OrbitRingNode[] = [
  { angle: "0deg", radius: "270px", accent: "#60a5fa", icon: Cloud },
  { angle: "90deg", radius: "270px", accent: "#38bdf8", icon: Mail },
  { angle: "180deg", radius: "270px", accent: "#a78bfa", icon: Users },
  { angle: "270deg", radius: "270px", accent: "#c084fc", icon: BookOpen },
];

const INNER_TILES: OrbitRingNode[] = [
  { angle: "0deg", radius: "160px", accent: "#fbbf24", icon: FileText },
  { angle: "180deg", radius: "160px", accent: "#4ade80", icon: MessageCircle },
];

export default function DownloadCtaSection({
  detectedOS,
  onDownloadPlatform,
}: DownloadCtaSectionProps) {
  const { t } = useLandingLanguage();
  const isMac = detectedOS.startsWith("darwin");
  const isWindows = detectedOS.startsWith("windows");

  return (
    <section
      id="download"
      className="text-center border-t border-border/40 scroll-mt-20">
      {/* Decorative MCP Connector Orbit (aria-hidden, pointer-events-none) */}
      <div className="dl-orbit" aria-hidden="true">
        {/* Outer Ring: 760px, reverse */}
        <div className="dl-ring dl-ring--outer" data-dir="rev">
          {OUTER_TILES.map((node, i) => {
            const Icon = node.icon;
            return (
              <span
                key={`outer-${i}`}
                className="dl-node"
                style={
                  {
                    "--a": node.angle,
                    "--r": node.radius,
                  } as React.CSSProperties
                }>
                <span
                  className="dl-tile"
                  style={{ "--accent": node.accent } as React.CSSProperties}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                </span>
              </span>
            );
          })}
        </div>

        {/* Mid Ring: 540px, forward */}
        <div className="dl-ring dl-ring--mid" data-dir="fwd">
          {MID_TILES.map((node, i) => {
            const Icon = node.icon;
            return (
              <span
                key={`mid-${i}`}
                className="dl-node"
                style={
                  {
                    "--a": node.angle,
                    "--r": node.radius,
                  } as React.CSSProperties
                }>
                <span
                  className="dl-tile"
                  style={{ "--accent": node.accent } as React.CSSProperties}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                </span>
              </span>
            );
          })}
        </div>

        {/* Inner Ring: 320px, reverse */}
        <div className="dl-ring dl-ring--inner" data-dir="rev">
          {INNER_TILES.map((node, i) => {
            const Icon = node.icon;
            return (
              <span
                key={`inner-${i}`}
                className="dl-node"
                style={
                  {
                    "--a": node.angle,
                    "--r": node.radius,
                  } as React.CSSProperties
                }>
                <span
                  className="dl-tile"
                  style={{ "--accent": node.accent } as React.CSSProperties}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <LandingContainer className="relative z-10">
        <h2 className="section-title font-display font-light text-foreground text-3xl sm:text-4xl lg:text-5xl mt-3">
          {t("dl.title")}
        </h2>

        <p className="mt-4 text-sm sm:text-base text-muted-foreground font-light max-w-md mx-auto">
          {t("dl.desc")}
        </p>

        {/* OS Download Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {/* macOS */}
          <button
            type="button"
            onClick={() => onDownloadPlatform("darwin-aarch64")}
            aria-label={`${t("dl.mac")} - ${t("dl.mac_sub")}`}
            className={`dl-btn inline-flex items-center gap-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg cursor-pointer ${
              isMac
                ? "bg-foreground text-background hover:opacity-90 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border border-border/80 bg-card text-foreground hover:bg-muted"
            }`}>
            <AppleIcon className="h-4 w-4 shrink-0" />
            <div className="text-left">
              <span className="block text-[13px] leading-tight font-semibold">
                {t("dl.mac")}
              </span>
              <span className="block text-[10px] text-muted-foreground font-normal">
                {t("dl.mac_sub")}
              </span>
            </div>
          </button>

          {/* Windows */}
          <button
            type="button"
            onClick={() => onDownloadPlatform("windows-x86_64")}
            aria-label={`${t("dl.win")} - ${t("dl.win_sub")}`}
            className={`dl-btn inline-flex items-center gap-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg cursor-pointer ${
              isWindows
                ? "bg-foreground text-background hover:opacity-90 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border border-border/80 bg-card text-foreground hover:bg-muted"
            }`}>
            <WindowsIcon className="h-4 w-4 shrink-0" />
            <div className="text-left">
              <span className="block text-[13px] leading-tight font-semibold">
                {t("dl.win")}
              </span>
              <span className="block text-[10px] text-muted-foreground font-normal">
                {t("dl.win_sub")}
              </span>
            </div>
          </button>

          {/* Linux (Coming Soon) */}
          <div
            aria-disabled="true"
            className="dl-btn inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 text-muted-foreground/60 text-xs font-mono select-none cursor-not-allowed">
            <span>{t("dl.linux")}</span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[9px] uppercase tracking-wider text-muted-foreground">
              {t("dl.coming")}
            </span>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
