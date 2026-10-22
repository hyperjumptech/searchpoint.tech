"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Route, FileSearch, ShieldCheck, Brain, Plus } from "lucide-react";
import { useLandingLanguage } from "@/components/landing/landing-language-provider";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface OrgNode {
  name: string;
  sub: string;
  from: string;
  to: string;
}

const TOP_NODE: OrgNode = {
  name: "You",
  sub: "Owner",
  from: "#FFFFFF",
  to: "#D4D4D8",
};

const MID_NODES: OrgNode[] = [
  { name: "Sales", sub: "Pipeline", from: "#ff4b01", to: "#FDBA74" },
  { name: "Ops", sub: "Tickets", from: "#8B5CF6", to: "#818CF8" },
  { name: "Finance", sub: "Books", from: "#3B82F6", to: "#22D3EE" },
];

const BOT_NODES: OrgNode[] = [
  { name: "Support", sub: "Replies", from: "#F59E0B", to: "#FACC15" },
  { name: "Inventory", sub: "Stock", from: "#D946EF", to: "#C084FC" },
];

const WORKFORCE_CYCLE = [
  "You",
  "Ops",
  "Support",
  "Ops",
  "Sales",
  "You",
  "Finance",
];

const NARRATIVES: Record<string, string> = {
  You: "“What’s slowing our deliveries this week?”",
  Sales: "Checking pipeline & follow-ups",
  Ops: "Tracing tickets & schedules",
  Finance: "Pulling invoices & margins",
  Support: "Drafting customer replies",
  Inventory: "Counting stock movements",
};

const CORE_ENGINE_ITEMS = [
  {
    icon: Route,
    title: "Delta Ingestion",
    desc: "Real-time Graph & filesystem sync",
  },
  {
    icon: Cpu,
    title: "Native Sandbox",
    desc: "Ephemeral parsing, zero data retention",
  },
  {
    icon: ShieldCheck,
    title: "Purview Snapshot",
    desc: "Fail-closed document-level ACLs",
  },
  {
    icon: FileSearch,
    title: "Hybrid Search Engine",
    desc: "Sub-50ms vector & BM25 retrieval",
  },
  {
    icon: Brain,
    title: "Grounded RAG",
    desc: "Zero-leak context for any LLM",
  },
];

function OrgChartNode({
  node,
  isActive,
}: {
  node: OrgNode;
  isActive: boolean;
}) {
  return (
    <div
      className={`relative flex w-full max-w-[132px] items-center gap-2 rounded-full border bg-[#161616] py-1.5 pr-3 pl-1.5 transition-all duration-300 ${
        isActive
          ? "border-emerald-400/70 shadow-[0_0_0_3px_rgba(52,211,153,0.10)]"
          : "border-white/[0.08]"
      }`}>
      {isActive && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 left-3 rounded-full bg-emerald-400 px-1.5 py-px text-[8px] font-semibold tracking-wide text-black z-20">
          Active
        </motion.span>
      )}
      <span
        aria-hidden="true"
        className="inline-block shrink-0 rounded-full ring-1 ring-white/10"
        style={{
          width: 24,
          height: 24,
          background: `linear-gradient(90deg, ${node.from} 0%, ${node.to} 100%)`,
        }}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[11.5px] font-medium text-white">
          {node.name}
        </span>
        <span className="mt-px flex items-center gap-1 text-[9.5px] font-light text-white/40">
          <span className="size-1 shrink-0 rounded-full bg-emerald-400/80" />
          <span className="truncate">{node.sub}</span>
        </span>
      </span>
    </div>
  );
}

function SearchPointLogo() {
  return (
    <div className="flex items-center gap-[7px]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-[16px] shrink-0"
        aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="7" stroke="#FF4B01" strokeWidth="2.2" />
        <path
          d="M20 20L15.5 15.5"
          stroke="#FF4B01"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="10.5" cy="10.5" r="2.6" fill="#FF4B01" />
      </svg>
      <span className="font-display text-[13px] font-semibold tracking-tight text-white">
        SearchPoint
      </span>
    </div>
  );
}

export default function ArchitectureSection() {
  const { t } = useLandingLanguage();
  const [activeWorkforceIndex, setActiveWorkforceIndex] =
    React.useState<number>(1);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveWorkforceIndex((prev) => (prev + 1) % WORKFORCE_CYCLE.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const currentWorkforceNode = WORKFORCE_CYCLE[activeWorkforceIndex];

  return (
    <section
      id="architecture"
      className="relative scroll-mt-[80px] w-full px-4 sm:px-6 py-20 md:py-28 overflow-hidden bg-[#0d0d0d]">
      {/* Scroll anchors */}
      <div id="how-it-works" className="absolute -top-20" />
      <div id="knowledge-layer" className="absolute -top-20" />

      {/* Background Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[120px] left-1/2 -z-10 size-[900px] -translate-x-1/2 md:size-[1400px]">
        <svg
          viewBox="0 0 1502 1502"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full opacity-60">
          <circle cx="751" cy="751" r="751" fill="url(#arch-hero-ellipse)" />
          <defs>
            <radialGradient
              id="arch-hero-ellipse"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(751 751) rotate(90) scale(751)">
              <stop stopColor="#403737" />
              <stop offset="1" stopColor="#0D0D0D" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-[1340px]">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10 lg:mb-14">
          <h2 className="max-w-[584px] font-display text-3xl sm:text-4xl md:text-5xl lg:text-[46px] leading-[1.15] font-light text-balance text-white">
            {t("arch.title")}
          </h2>
          <p className="max-w-[420px] text-sm md:text-base leading-relaxed font-light text-white/55 md:text-right">
            {t("arch.desc")}
          </p>
        </div>

        {/* 3-Card Main Architecture Flow Grid */}
        <div className="mt-8 flex flex-col gap-6 lg:gap-0 lg:grid lg:items-stretch lg:grid-cols-[1fr_40px_1.06fr_40px_1fr]">
          {/* =========================================================================
              CARD 1: DATA PLATFORM
              ========================================================================= */}
          <div className="flex flex-col">
            <div className="relative flex min-h-[340px] flex-1 flex-col justify-center overflow-hidden rounded-[14px] border border-white/12 bg-[#121212] p-5 sm:p-[28px]">
              <span className="absolute top-[18px] left-[22px] z-10 text-[11px] leading-none font-medium tracking-[0.14em] text-white/40 uppercase">
                Data Platform
              </span>

              <div className="relative pt-6">
                <div className="flex items-center gap-0 w-full">
                  {/* Sources List */}
                  <div className="relative flex-1">
                    {/* Vertical Bus Line */}
                    <div
                      aria-hidden="true"
                      className="absolute top-[14px] right-0 bottom-[14px] w-px"
                      style={{
                        background:
                          "repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                      }}
                    />
                    <div className="flex flex-col gap-[7px]">
                      {/* OneDrive */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[9px] w-[14px]">
                            <path
                              d="M6.5 15C3.46 15 1 12.65 1 9.75C1 7.15 2.95 5.03 5.5 4.83C6.6 2.05 9.47 0 12.92 0C16.7 0 19.88 2.76 20.29 6.42C22.38 7.11 23.9 9.12 23.9 11.45C23.9 13.96 21.89 15 19.46 15H6.5Z"
                              fill="#0078D4"
                            />
                            <path
                              d="M17.46 15C19.89 15 23.9 13.96 23.9 11.45C23.9 9.12 22.38 7.11 20.29 6.42C19.7 6.22 19.08 6.12 18.44 6.12C16.48 6.12 14.77 7.12 13.78 8.65C15.28 9.7 16.27 11.45 16.27 13.43C16.27 13.98 16.17 14.51 15.98 15H17.46Z"
                              fill="#0364B8"
                            />
                          </svg>
                          OneDrive
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* SharePoint */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-[13px]">
                            <circle cx="10" cy="8" r="6" fill="#007791" />
                            <circle cx="16" cy="13" r="5" fill="#0097A8" />
                            <circle cx="10" cy="16" r="4.5" fill="#00B6BD" />
                            <rect
                              x="2"
                              y="10"
                              width="8"
                              height="8"
                              rx="1.5"
                              fill="#004A5C"
                            />
                            <path
                              d="M5.5 15.2C4.5 15.2 3.8 14.7 3.8 14C3.8 13.3 4.5 12.8 5.5 12.8C6.5 12.8 7.2 13.3 7.2 14C7.2 14.7 6.5 15.2 5.5 15.2Z"
                              fill="white"
                            />
                          </svg>
                          SharePoint
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* SearchPoint */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-[13px]">
                            <circle
                              cx="11"
                              cy="11"
                              r="7"
                              stroke="#38BDF8"
                              strokeWidth="2.2"
                            />
                            <path
                              d="M20 20L16 16"
                              stroke="#38BDF8"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                            <circle cx="11" cy="11" r="2.8" fill="#38BDF8" />
                          </svg>
                          SearchPoint
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* Local Storage */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-[13px]">
                            <rect
                              x="2"
                              y="4"
                              width="20"
                              height="13"
                              rx="2"
                              stroke="#22D3EE"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M8 20H16"
                              stroke="#22D3EE"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 17V20"
                              stroke="#22D3EE"
                              strokeWidth="1.8"
                            />
                            <circle cx="12" cy="10.5" r="1.5" fill="#22D3EE" />
                          </svg>
                          Local Storage
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* Google Drive */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-[13px]">
                            <path
                              d="M8.2 3L1.5 14.7L5 20.8L11.7 9.1L8.2 3Z"
                              fill="#0066DA"
                            />
                            <path
                              d="M15.8 3H8.2L11.7 9.1H19.3L15.8 3Z"
                              fill="#00AC47"
                            />
                            <path
                              d="M19.3 9.1H11.7L15.2 15.2H22.7L19.3 9.1Z"
                              fill="#EA4335"
                            />
                            <path
                              d="M15.2 15.2L11.7 21.2H19.3L22.7 15.2H15.2Z"
                              fill="#FFBA00"
                            />
                          </svg>
                          Google Drive
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* Outlook */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-[13px]">
                            <rect
                              x="7"
                              y="5"
                              width="15"
                              height="14"
                              rx="2"
                              fill="#0078D4"
                            />
                            <path
                              d="M7 6.5L14.5 12L22 6.5"
                              stroke="white"
                              strokeWidth="1.2"
                            />
                            <rect
                              x="2"
                              y="7"
                              width="9"
                              height="10"
                              rx="1.5"
                              fill="#106EBE"
                            />
                            <text
                              x="4.2"
                              y="14.5"
                              fill="white"
                              fontFamily="Arial, Helvetica, sans-serif"
                              fontWeight="bold"
                              fontSize="7.5">
                              O
                            </text>
                          </svg>
                          Outlook
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>

                      {/* 10+Sources */}
                      <div className="flex items-center">
                        <span className="flex h-[26px] items-center gap-[6px] rounded-[10px] border border-white/12 bg-[#111112] px-[9px] text-[10.5px] leading-none font-light whitespace-nowrap text-white/80 shadow-sm">
                          <Plus className="size-[13px] text-white/50" />
                          10+Sources
                        </span>
                        <div
                          aria-hidden="true"
                          className="nx-hiwd-dash h-px min-w-[10px] flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Dash line to right edge with Arrow (desktop only) */}
                  <div className="hidden items-center lg:flex">
                    <div
                      aria-hidden="true"
                      className="nx-hiwd-dash h-px w-[24px] shrink-0"
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="shrink-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              CONNECTOR 1: Left -> Center
              ========================================================================= */}
          <div className="hidden items-center lg:flex">
            <div className="relative flex w-full items-center">
              <div
                aria-hidden="true"
                className="nx-hiwd-dash h-px w-full"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                }}
              />
              <span
                aria-hidden="true"
                className="absolute right-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white/40"
              />
            </div>
          </div>

          {/* Mobile Connector */}
          <div className="flex items-center justify-center gap-[16px] lg:hidden my-1">
            <span className="flex flex-col items-center">
              <div
                aria-hidden="true"
                className="w-px"
                style={{
                  height: 36,
                  background:
                    "repeating-linear-gradient(180deg, rgba(255,255,255,0.25) 0 3px, transparent 3px 7px)",
                }}
              />
              <span
                aria-hidden="true"
                className="border-x-[3px] border-t-[5px] border-x-transparent border-t-white/40"
              />
            </span>
          </div>

          {/* =========================================================================
              CARD 2: CORE ENGINE (Vibrant Orange Radial Flame Card)
              ========================================================================= */}
          <div className="flex flex-col">
            <div className="relative flex min-h-[340px] flex-1 flex-col justify-center overflow-hidden rounded-[14px] border border-white/12 bg-[#121212] p-5 sm:p-[28px]">
              {/* Vibrant Flame Background with Grain Texture */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(155deg, #c22e35 0%, #ff4b01 55%, #ff8a4d 100%)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "10%",
                    width: "75%",
                    height: "120%",
                    borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
                    background:
                      "radial-gradient(closest-side, rgba(255,176,113,0.5) 30%, rgba(255,138,77,0.25) 62%, rgba(255,138,77,0) 100%)",
                    filter: "blur(18px)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: "-25%",
                    top: "-45%",
                    width: "80%",
                    height: "130%",
                    borderRadius: "38% 62% 55% 45% / 60% 36% 64% 40%",
                    background:
                      "radial-gradient(closest-side, rgba(140,20,40,0.85) 32%, rgba(194,46,53,0.45) 65%, rgba(194,46,53,0) 100%)",
                    filter: "blur(18px)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,10,10,0.12) 0%, rgba(10,10,10,0.4) 100%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: NOISE_BG,
                    backgroundSize: "160px 160px",
                    opacity: 1,
                    mixBlendMode: "overlay",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: NOISE_BG,
                    backgroundSize: "160px 160px",
                    opacity: 0.5,
                    mixBlendMode: "overlay",
                  }}
                />
              </div>

              {/* Floating Dark Center Card */}
              <div className="relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-[248px] sm:w-[256px] rounded-[14px] border border-white/15 bg-[#141312] shadow-[0_18px_44px_rgba(0,0,0,0.55)]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-[16px] py-[13px]">
                      <SearchPointLogo />
                      <p className="text-[12px] leading-none font-light text-white/90">
                        Core Engine
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="border-t border-white/8">
                      {CORE_ENGINE_ITEMS.map((item) => (
                        <div
                          key={item.title}
                          className="flex items-center gap-[11px] border-b border-white/8 px-[16px] py-[9px] last:border-b-0">
                          <item.icon className="size-[13px] shrink-0 text-white/55" />
                          <div className="min-w-0">
                            <p className="text-[12px] leading-[1.3] text-white/90">
                              {item.title}
                            </p>
                            <p className="text-[9.5px] leading-[1.35] font-light text-white/45">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtext under card */}
                  <p className="mt-[14px] max-w-[280px] text-center text-[12px] leading-[1.55] font-light text-balance text-white/85 lg:max-w-[250px] lg:text-[9.5px] drop-shadow-sm">
                    Bring any AI model — even open-weights on your own servers.
                    No vendor lock-in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              CONNECTOR 2: Center -> Right
              ========================================================================= */}
          <div className="hidden items-center lg:flex">
            <div className="relative flex w-full items-center">
              <div
                aria-hidden="true"
                className="nx-hiwd-dash h-px w-full"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 9px)",
                }}
              />
              <span
                aria-hidden="true"
                className="absolute right-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white/40"
              />
            </div>
          </div>

          {/* Mobile Connector between Center and Right */}
          <div className="flex items-center justify-center gap-[16px] lg:hidden my-1">
            <span className="flex flex-col items-center">
              <div
                aria-hidden="true"
                className="w-px"
                style={{
                  height: 36,
                  background:
                    "repeating-linear-gradient(180deg, rgba(255,255,255,0.25) 0 3px, transparent 3px 7px)",
                }}
              />
              <span
                aria-hidden="true"
                className="border-x-[3px] border-t-[5px] border-x-transparent border-t-white/40"
              />
            </span>
          </div>

          {/* =========================================================================
              CARD 3: YOUR AI WORKFORCE (Animated Org Hierarchy)
              ========================================================================= */}
          <div className="flex flex-col">
            <div className="relative flex min-h-[340px] flex-1 flex-col justify-center overflow-hidden rounded-[14px] border border-white/12 bg-[#121212] p-5 sm:p-[28px]">
              <span className="absolute top-[18px] left-[22px] z-10 text-[11px] leading-none font-medium tracking-[0.14em] text-white/40 uppercase">
                Your AI Workforce
              </span>

              <div className="relative pt-6">
                <div className="lg:scale-[0.9] origin-center">
                  <div className="flex h-full min-h-[6rem] w-full flex-1 items-center justify-center">
                    <div className="w-full">
                      {/* Top Node: You */}
                      <div className="flex justify-center">
                        <OrgChartNode
                          node={TOP_NODE}
                          isActive={currentWorkforceNode === TOP_NODE.name}
                        />
                      </div>

                      {/* Tree Branch Line to Tier 2 */}
                      <div
                        aria-hidden="true"
                        className="mx-auto h-5 w-px bg-white/[0.08]"
                      />

                      {/* Tier 2: Sales, Ops, Finance */}
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-[16.666%] top-0 h-px bg-white/[0.08]"
                        />
                        <div className="grid grid-cols-3 justify-items-center gap-x-1.5">
                          {MID_NODES.map((node) => (
                            <div
                              key={node.name}
                              className="flex w-full flex-col items-center">
                              <div
                                aria-hidden="true"
                                className="h-5 w-px bg-white/[0.08]"
                              />
                              <OrgChartNode
                                node={node}
                                isActive={currentWorkforceNode === node.name}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tree Branch Line to Tier 3 (under Ops) */}
                      <div
                        aria-hidden="true"
                        className="mx-auto h-5 w-px bg-white/[0.08]"
                      />

                      {/* Tier 3: Support, Inventory */}
                      <div className="relative mx-auto w-[72%]">
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-[25%] top-0 h-px bg-white/[0.08]"
                        />
                        <div className="grid grid-cols-2 justify-items-center gap-x-1.5">
                          {BOT_NODES.map((node) => (
                            <div
                              key={node.name}
                              className="flex w-full flex-col items-center">
                              <div
                                aria-hidden="true"
                                className="h-5 w-px bg-white/[0.08]"
                              />
                              <OrgChartNode
                                node={node}
                                isActive={currentWorkforceNode === node.name}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Cycling Narration */}
                      <div className="mt-3 flex h-[18px] items-center justify-center overflow-hidden lg:h-[15px]">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentWorkforceNode}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="text-[12px] leading-none font-light whitespace-nowrap text-white/50 lg:text-[10.5px]">
                            <span className="text-white/80">
                              {currentWorkforceNode}
                            </span>{" "}
                            — {NARRATIVES[currentWorkforceNode]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM BRACKET LABELS
            ========================================================================= */}
        <div className="mt-[18px] hidden lg:grid lg:grid-cols-[1fr_40px_1.06fr_40px_1fr]">
          <div className="col-span-3">
            <div className="flex flex-col items-center gap-[10px] opacity-50">
              <div className="h-[10px] w-full border-x border-b border-white/15" />
              <span className="text-[11px] leading-none font-medium tracking-[0.14em] text-white/40 uppercase">
                Secure & compliant · Deploys in your cloud or on-prem
              </span>
            </div>
          </div>
          <div />
          <div className="flex flex-col items-center gap-[10px] opacity-50">
            <div className="h-[10px] w-full border-x border-b border-white/15" />
            <span className="text-[11px] leading-none font-medium tracking-[0.14em] text-white/40 uppercase">
              Your team
            </span>
          </div>
        </div>

        {/* Mobile bottom labels */}
        <div className="mt-6 flex flex-col items-center gap-2 lg:hidden text-center opacity-60">
          <span className="text-[10px] font-medium tracking-[0.14em] text-white/40 uppercase">
            Secure & compliant · Deploys in your cloud or on-prem
          </span>
          <span className="text-[10px] font-medium tracking-[0.14em] text-white/40 uppercase">
            Your team
          </span>
        </div>
      </div>
    </section>
  );
}
