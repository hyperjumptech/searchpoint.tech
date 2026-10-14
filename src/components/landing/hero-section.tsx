"use client";

import { useState } from "react";
import {
  Download,
  Search,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Zap,
  Star,
  FolderOpen,
  SquareArrowOutUpRight,
  Settings,
  Layers,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  OneDriveIcon,
  SharePointIcon,
  AppleNotesIcon,
  WhatsAppIcon,
  OnDeviceFolderIcon,
} from "@/components/icons/source-icons";

import type { TenantContent } from "@/lib/tenant";
import type { Company } from "@/lib/company";
import CompanyLogo from "@/components/company-logo";

interface HeroSectionProps {
  detectedOS: string;
  isMobile: boolean;
  onDownload: () => void;
  onSelectPlatform?: (os: string) => void;
  downloaded?: boolean;
  /** Per-tenant copy. Falls back to the shared defaults when omitted. */
  content?: TenantContent["hero"];
  /** Active company branding */
  company?: Company;
}

interface SampleResult {
  title: string;
  source: string;
  sourceType: "onedrive" | "sharepoint" | "apple_notes" | "whatsapp" | "local";
  icon: typeof FileSpreadsheet;
  iconColor: string;
  size: string;
  date: string;
  path: string;
  fileType: string;
  tags: string[];
  owner: string;
  matchSnippet: string;
}

interface SampleQuery {
  id: string;
  label: string;
  syntax: string;
  interpretation: string;
  results: SampleResult[];
}

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "pdf-search",
    label: "source:on_device kind:document type:pdf",
    syntax: "source:on_device kind:document type:pdf",
    interpretation: "Extensions pdf · Source is On Device · Kind is Document",
    results: [
      {
        title: "AcmeCorp - Report - Annual Report 2024.pdf",
        source: "On Device",
        sourceType: "local",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "12 MB",
        date: "Mon, 03 Aug",
        path: "~/Downloads",
        fileType: "pdf",
        tags: ["finance", "annual-report"],
        owner: "author.dummy@enterprise.internal",
        matchSnippet:
          "Executive performance metrics, audited operational costs, and 2025 strategic plans.",
      },
      {
        title: "Financial Statement 2024_Audited_Draft.pdf",
        source: "On Device",
        sourceType: "local",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "4.7 MB",
        date: "Fri, 31 Jul",
        path: "~/Downloads",
        fileType: "pdf",
        tags: ["audit", "financials"],
        owner: "user.review@example.com",
        matchSnippet:
          "Independent auditor report and consolidated financial balance sheet draft.",
      },
      {
        title: "Strategic Product Roadmap 2025.pdf",
        source: "On Device",
        sourceType: "local",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "63 MB",
        date: "Fri, 31 Jul",
        path: "~/Downloads",
        fileType: "pdf",
        tags: ["roadmap", "product"],
        owner: "user.review@example.com",
        matchSnippet:
          "Architecture milestones, engineering sprint delivery dates, and platform integrations.",
      },
      {
        title: "Quarterly Presentation - Tech Deck.pdf",
        source: "On Device",
        sourceType: "local",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "2.5 MB",
        date: "Fri, 03 Jul",
        path: "~/Downloads",
        fileType: "pdf",
        tags: ["internal-ops", "presentation"],
        owner: "team.lead@example.com",
        matchSnippet:
          "Slide deck covering cloud infrastructure optimization, AI models, and MCP tools.",
      },
    ],
  },
  {
    id: "q3",
    label: "Q3 Budget Review",
    syntax: "q3 budget review source:all",
    interpretation:
      "Keywords 'q3 budget review' across all connected cloud & local sources",
    results: [
      {
        title: "FY2026_Q3_Financial_Forecast.xlsx",
        source: "OneDrive",
        sourceType: "onedrive",
        icon: FileSpreadsheet,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        size: "4.2 MB",
        date: "Today at 2:30 PM",
        path: "~/OneDrive - Enterprise/Finance/FY2026/Forecast.xlsx",
        fileType: "xlsx",
        tags: ["finance", "q3-forecast", "budget"],
        owner: "finance.officer@enterprise.internal",
        matchSnippet:
          "Consolidated Q3 Budget Review across regional business units and OPEX optimizations.",
      },
      {
        title: "Q3_Strategic_Roadmap_Final.pdf",
        source: "SharePoint",
        sourceType: "sharepoint",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "12.8 MB",
        date: "Yesterday at 5:12 PM",
        path: "SharePoint > Corporate Planning > Roadmaps > Q3_Strategic.pdf",
        fileType: "pdf",
        tags: ["strategy", "roadmap", "q3"],
        owner: "planning.director@enterprise.internal",
        matchSnippet:
          "Executive summary covering Q3 Strategic initiatives and budget allocation.",
      },
      {
        title: "Executive Notes on Q3 Budget.note",
        source: "Apple Notes",
        sourceType: "apple_notes",
        icon: FileText,
        iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        size: "18 KB",
        date: "Today at 10:15 AM",
        path: "Apple Notes > Work > 2026 Executive Meetings",
        fileType: "note",
        tags: ["notes", "budget", "executive"],
        owner: "user.notes@enterprise.internal",
        matchSnippet:
          "Action items from Q3 Budget Review: approve headcounts & cloud cost cap.",
      },
    ],
  },
];

function SourceBadgeIcon({
  sourceType,
  className = "",
}: {
  sourceType: SampleResult["sourceType"];
  className?: string;
}) {
  switch (sourceType) {
    case "onedrive":
      return <OneDriveIcon size={14} className={className} />;
    case "sharepoint":
      return <SharePointIcon size={14} className={className} />;
    case "apple_notes":
      return <AppleNotesIcon size={14} className={className} />;
    case "whatsapp":
      return <WhatsAppIcon size={14} className={className} />;
    case "local":
    default:
      return <OnDeviceFolderIcon size={14} className={className} />;
  }
}

export default function HeroSection({
  detectedOS,
  isMobile,
  onDownload,
  company,
}: HeroSectionProps) {
  const [activeQueryIndex] = useState(0);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const currentQuery = SAMPLE_QUERIES[activeQueryIndex];
  const selectedResult =
    currentQuery.results[selectedResultIndex] || currentQuery.results[0];

  const getPlatformLabel = (os: string) => {
    if (os.startsWith("darwin")) return "macOS";
    if (os.startsWith("windows")) return "Windows";
    return "Linux";
  };

  const currentPlatform = getPlatformLabel(detectedOS);

  return (
    <section className="relative w-full pt-12 sm:pt-16 pb-20 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center text-center">
        {/* Tag Pill from Mockup */}
        <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-border/80 bg-card/80 text-xs sm:text-[13px] font-semibold tracking-wide text-muted-foreground mb-8 shadow-xs max-w-full text-center">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>The Desktop Knowledge Layer for Enterprise &amp; AI</span>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(40px,6.8vw,80px)] font-bold tracking-[-0.045em] text-foreground max-w-[19ch] leading-[1.04] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700">
          Grounded knowledge{" "}
          <span className="text-primary block sm:inline">for your AI.</span>
        </h1>
        {/* Subtitle */}
        <p className="mt-8 text-base sm:text-xl lg:text-[21px] text-muted-foreground max-w-3xl leading-relaxed text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Search local storage, OneDrive, Outlook, WhatsApp and SharePoint
          instantly from your desktop.
          <br className="hidden sm:inline" /> Feed your favorite LLMs clean,
          permission-aware company knowledge without leaking sensitive data.
        </p>
        {/* Action Button & Platform Switcher */}
        <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          {isMobile ? (
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm text-sm text-muted-foreground">
              SearchPoint Desktop is available for Windows, macOS, and Linux.
              Please open this page on your desktop computer to download.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
                {currentPlatform === "Linux" ? (
                  <button
                    disabled
                    className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2.5 rounded-full border border-border bg-muted/60 px-6 py-3.5 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                    <Download className="h-4 w-4 opacity-50" />
                    <span>Coming soon on Linux</span>
                  </button>
                ) : (
                  <button
                    onClick={onDownload}
                    className="w-full sm:w-auto min-w-[220px] group relative flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    <span>Download for {currentPlatform}</span>
                  </button>
                )}
                <a
                  href="#knowledge-layer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-border/80 bg-card px-6 py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <span>Explore the Knowledge Layer</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </>
          )}
        </div>
        {/* Feature quick badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>&lt;50ms Sub-Second Latency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Zero Data Warehousing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-indigo-500" />
            <span>100% Private</span>
          </div>
        </div>

        {/* Authentic SearchPoint Desktop Application Window Mockup */}
        <div className="mt-16 w-full max-w-7xl text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="w-full rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/5 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40">
            {/* Desktop Window Title Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/60 bg-muted/40 select-none">
              {/* Left: Window controls & Tenant Brand */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-border/60 text-[11px] sm:text-xs font-semibold text-foreground">
                  <CompanyLogo
                    company={company}
                    className="h-4 sm:h-5 w-auto object-contain"
                  />
                  <span className="text-muted-foreground font-normal hidden sm:inline">
                    |
                  </span>
                  <span className="hidden sm:inline">Desktop</span>
                </div>
              </div>

              {/* Center: Live Index Counter */}
              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>4 results · Indexed locally</span>
              </div>

              {/* Right: Shortcut badge, user profile, settings */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  Ctrl + Space
                </kbd>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                  SP
                </div>
                <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Desktop App Layout: Sidebar + Main Area */}
            <div className="flex min-h-[380px] sm:min-h-[500px]">
              {/* Left Sidebar (SearchSidebar) */}
              <div className="hidden lg:flex w-52 flex-col justify-between shrink-0 border-r border-border/60 bg-muted/20 p-3.5 select-none text-xs">
                <div className="space-y-4">
                  {/* Sources Section */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Sources</span>
                      <span className="text-muted-foreground text-xs">+</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>All sources</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-foreground font-semibold bg-primary/10 border-l-[3px] border-primary pl-[6px] cursor-pointer">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span>On Device</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>OneDrive</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>SharePoint</span>
                      </div>
                    </div>
                  </div>

                  {/* File Types Section */}
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Type
                    </span>
                    <div className="space-y-0.5 text-muted-foreground">
                      <div className="flex items-center gap-2 px-2 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Document</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded text-primary font-semibold bg-primary/10 border-l-[3px] border-primary pl-[6px] cursor-pointer">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>PDF</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Word</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Spreadsheets</span>
                      </div>
                    </div>
                  </div>

                  {/* Curated Section */}
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Curated
                    </span>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        <span>Favorites</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted font-mono">
                        6
                      </span>
                    </div>
                  </div>

                  {/* Tags section */}
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Tags
                    </span>
                    <div className="space-y-1 px-2 text-[11px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-pink-400" />
                          <span>internal-ops</span>
                        </span>
                        <span className="text-[10px] font-mono">4</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          <span>oneAI</span>
                        </span>
                        <span className="text-[10px] font-mono">1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom status */}
                <div className="pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Background Sync Ready</span>
                  </div>
                </div>
              </div>

              {/* Main Content: Search Bar + Results + Detail Panel */}
              <div className="flex-1 flex flex-col min-w-0 bg-background/50">
                {/* Search Bar & Mode Switcher */}
                <div className="p-2.5 sm:p-3.5 border-b border-border/60 bg-background">
                  <div className="flex items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 rounded-xl border border-border/80 bg-muted/30">
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={currentQuery.syntax}
                      className="w-full bg-transparent text-xs sm:text-sm font-mono text-foreground focus:outline-none cursor-default truncate"
                    />
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        ✓ Exact match
                      </span>
                      <span className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">
                        ✕
                      </span>
                    </div>
                  </div>

                  {/* Query interpretation and Filter Pills */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="text-[11px] text-muted-foreground truncate">
                      Interpreting as:{" "}
                      <strong className="text-foreground font-semibold">
                        {currentQuery.interpretation}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        Type: pdf ✕
                      </span>
                      <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        Author: All
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split View: Search Result Items (Left) & File Detail Panel (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
                  {/* Left Column: Result List */}
                  <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 border-r-0 md:border-r border-border/60">
                    <div className="px-1 text-[9px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Search Results</span>
                      <span className="text-[8px] sm:text-[10px] font-mono lowercase">
                        by relevance
                      </span>
                    </div>

                    {currentQuery.results.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = selectedResultIndex === idx;
                      return (
                        <div
                          key={item.title}
                          onClick={() => {
                            setSelectedResultIndex(idx);
                          }}
                          className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-primary/5 border-primary/40 shadow-xs border-l-4 border-l-primary"
                              : "bg-card/40 border-transparent hover:bg-muted/40 hover:border-border/60"
                          }`}>
                          <div
                            className={`p-2 rounded-lg border shrink-0 ${item.iconColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                {item.size}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                              {item.path}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-muted/60 text-[10px]">
                                <SourceBadgeIcon
                                  sourceType={item.sourceType}
                                  className="shrink-0"
                                />
                                <span>{item.source}</span>
                              </span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: File Detail Panel & AI Recommendations (Hidden on mobile) */}
                  <div className="hidden md:flex p-3 sm:p-4 bg-muted/10 flex-col justify-between">
                    <div className="space-y-3">
                      {/* File Header */}
                      <div className="pb-3 border-b border-border/60 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                              {selectedResult.title}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                              {selectedResult.path}
                            </p>
                          </div>
                          <button
                            onClick={() => setIsFavorited(!isFavorited)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                              isFavorited
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted"
                            }`}
                            title="Favorite File">
                            <Star
                              className={`h-3.5 w-3.5 ${
                                isFavorited ? "fill-amber-500" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Open File / Open Folder buttons: equal width */}
                        <div className="flex items-center gap-2 pt-1">
                          <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer">
                            <SquareArrowOutUpRight className="h-3 w-3" />
                            <span>Open File</span>
                          </button>
                          <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
                            <FolderOpen className="h-3 w-3 text-muted-foreground" />
                            <span>Open Folder</span>
                          </button>
                        </div>
                      </div>

                      {/* AI Filename Recommendations Box (from Redesign v2 & Screenshot) */}
                      <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-primary">
                          <Sparkles className="h-3 w-3" />
                          <span>Filename Recommendations</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="p-1.5 rounded bg-background/90 border border-border/80 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-foreground truncate pr-2">
                              Report - AcmeCorp - 2024 - Annual Report.pdf
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                              ✓
                            </span>
                          </div>
                          <div className="p-1.5 rounded bg-background/90 border border-border/80 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-foreground truncate pr-2">
                              Report - AcmeCorp - Annual Report.pdf
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                              ✓
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pt-0.5">
                          ⚙ Rule: Category / Type First
                          <br />✨ The on-device model reads document contents
                          and automatically suggests standard, clutter-free
                          naming conventions.
                        </p>
                      </div>

                      {/* Technical Metadata Properties (Dummy Info) */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground">Size</span>
                          <span className="text-foreground font-medium">
                            {selectedResult.size}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground">Type</span>
                          <span className="text-foreground font-medium uppercase">
                            {selectedResult.fileType}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground">Pages</span>
                          <span className="text-foreground font-medium">
                            55
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground">Author</span>
                          <span className="text-foreground font-mono truncate max-w-[170px]">
                            {selectedResult.owner}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground">Created</span>
                          <span className="text-foreground font-medium">
                            {selectedResult.date} 2026
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer helper */}
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        Press{" "}
                        <kbd className="font-mono text-foreground font-semibold">
                          ↵ Enter
                        </kbd>
                      </span>
                      <span className="text-primary font-medium">
                        Instant Preview
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
