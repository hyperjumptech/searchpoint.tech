"use client";

import { useState } from "react";
import {
  Download,
  Search,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  FileCode,
  Zap,
  ChevronLeft,
  ChevronRight,
  Star,
  FolderOpen,
  SquareArrowOutUpRight,
  Copy,
  Tag,
  Settings,
  SlidersHorizontal,
  Layers,
  Lock,
} from "lucide-react";
import { useUserStore } from "@/stores/user";
import {
  OneDriveIcon,
  SharePointIcon,
  AppleNotesIcon,
  WhatsAppIcon,
  OnDeviceFolderIcon,
} from "@/components/icons/source-icons";

import type { TenantContent } from "@/lib/tenant";

interface HeroSectionProps {
  detectedOS: string;
  isMobile: boolean;
  onDownload: () => void;
  onSelectPlatform?: (os: string) => void;
  downloaded?: boolean;
  /** Per-tenant copy. Falls back to the shared defaults when omitted. */
  content?: TenantContent["hero"];
}

const DEFAULT_HERO_CONTENT: TenantContent["hero"] = {
  headlineLead: "Unified search for your files and",
  headlineAccent: "Microsoft 365.",
  subheadline:
    "Stop jumping between File Explorer, browser tabs, and SharePoint to find the same document. SearchPoint searches local folders, OneDrive, and site libraries in one place.",
};

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
  results: SampleResult[];
}

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "q3",
    label: "Q3 Budget Review",
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
        fileType: "Microsoft Excel (.xlsx)",
        tags: ["finance", "q3-forecast", "budget"],
        owner: "sarah.cfo@enterprise.com",
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
        fileType: "PDF Document (.pdf)",
        tags: ["strategy", "roadmap", "q3"],
        owner: "marcus.vp@enterprise.com",
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
        fileType: "Apple Note",
        tags: ["notes", "budget", "executive"],
        owner: "raosan (You)",
        matchSnippet:
          "Action items from Q3 Budget Review: approve headcounts & cloud cost cap.",
      },
      {
        title: "local_cache_analysis.sql",
        source: "On Device",
        sourceType: "local",
        icon: FileCode,
        iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        size: "184 KB",
        date: "3 days ago",
        path: "~/Projects/data/telemetry/local_cache_analysis.sql",
        fileType: "SQL Script (.sql)",
        tags: ["database", "telemetry", "benchmarks"],
        owner: "raosan (Local User)",
        matchSnippet:
          "-- Query execution plans for Q3 telemetry and search latency benchmarks",
      },
    ],
  },
  {
    id: "sec",
    label: "Security Audit RFC",
    results: [
      {
        title: "SOC2_Type_II_Compliance_Report.pdf",
        source: "SharePoint",
        sourceType: "sharepoint",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        size: "8.5 MB",
        date: "Aug 15, 2026",
        path: "SharePoint > Security & Compliance > SOC2_Report_2026.pdf",
        fileType: "PDF Document (.pdf)",
        tags: ["compliance", "soc2", "audit"],
        owner: "security-team@enterprise.com",
        matchSnippet:
          "Security Audit RFC verification for client-side encryption and ACL parity.",
      },
      {
        title: "Security Review Checklist.note",
        source: "Apple Notes",
        sourceType: "apple_notes",
        icon: FileText,
        iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        size: "12 KB",
        date: "Aug 14, 2026",
        path: "Apple Notes > Security > Audit Checklists",
        fileType: "Apple Note",
        tags: ["security", "audit", "rfc"],
        owner: "raosan (You)",
        matchSnippet:
          "Checklist for Security Audit RFC: verify hardware token storage and OS keychain.",
      },
      {
        title: "Audit_Action_Items_Chat_Export.pdf",
        source: "WhatsApp",
        sourceType: "whatsapp",
        icon: FileText,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        size: "420 KB",
        date: "Yesterday",
        path: "WhatsApp > Enterprise Security Group > Documents",
        fileType: "Chat Document (.pdf)",
        tags: ["whatsapp", "security-team", "rfc"],
        owner: "Chief InfoSec Officer",
        matchSnippet:
          "Summary of Security Audit RFC approvals and sign-offs from DevOps team.",
      },
      {
        title: "entra_id_oauth_config.json",
        source: "On Device",
        sourceType: "local",
        icon: FileCode,
        iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        size: "12 KB",
        date: "Updated 1h ago",
        path: "~/config/auth/entra_id_oauth_config.json",
        fileType: "JSON Configuration (.json)",
        tags: ["security", "entra-id", "oauth"],
        owner: "raosan (Local User)",
        matchSnippet:
          '"scope": "Files.Read.All offline_access", // audit RFC compliance verified',
      },
    ],
  },
  {
    id: "handbook",
    label: "Employee Remote Policy",
    results: [
      {
        title: "2026_Global_Workplace_Guidelines.docx",
        source: "OneDrive",
        sourceType: "onedrive",
        icon: FileText,
        iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
        size: "1.1 MB",
        date: "Updated last week",
        path: "~/OneDrive - Enterprise/HR/Policies/2026_Guidelines.docx",
        fileType: "Microsoft Word (.docx)",
        tags: ["hr", "policy", "remote-work"],
        owner: "hr-ops@enterprise.com",
        matchSnippet:
          "Employee Remote Policy: equipment stipends and secure VPN / endpoint rules.",
      },
      {
        title: "Remote Work Setup Instructions.note",
        source: "Apple Notes",
        sourceType: "apple_notes",
        icon: FileText,
        iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        size: "9 KB",
        date: "2 weeks ago",
        path: "Apple Notes > Personal > Workplace Guidelines",
        fileType: "Apple Note",
        tags: ["hr", "setup", "remote"],
        owner: "raosan (You)",
        matchSnippet:
          "Step-by-step home office ergonomics and internet reimbursement policy.",
      },
      {
        title: "HR_All_Hands_Remote_Q&A.pdf",
        source: "WhatsApp",
        sourceType: "whatsapp",
        icon: FileText,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        size: "680 KB",
        date: "3 weeks ago",
        path: "WhatsApp > HR Broadcast Channel > Attachments",
        fileType: "PDF Document (.pdf)",
        tags: ["hr", "qna", "policy"],
        owner: "HR People Team",
        matchSnippet:
          "Employee Remote Policy clarification: travel allowance and flexible working hours.",
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
  content = DEFAULT_HERO_CONTENT,
}: HeroSectionProps) {
  const { user } = useUserStore();
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.15] text-balance animate-in fade-in slide-in-from-bottom-3 duration-700">
          {content.headlineLead}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary/70">
            {content.headlineAccent}
          </span>
        </h1>
        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {user?.name ? `Welcome back, ${user.name}. ` : ""}
          {content.subheadline}
        </p>
        {/* Action Button & Platform Switcher */}
        <div className="mt-9 flex flex-col items-center gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          {isMobile ? (
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm text-sm text-muted-foreground">
              SearchPoint Desktop is available for Windows, macOS, and Linux.
              Please open this page on your desktop computer to download.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
                <button
                  onClick={onDownload}
                  className="w-full sm:w-auto min-w-[240px] group relative flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                  <Download className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                  <span>Download for {currentPlatform}</span>
                </button>
                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-6 py-3.5 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <span>Explore Features</span>
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
        <div className="mt-14 w-full max-w-5xl text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="w-full rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/5 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40">
            {/* Desktop Window Title Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/60 bg-muted/40 select-none">
              {/* Left: Window controls & Nav buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 border-l border-border/60 text-muted-foreground">
                  <button
                    aria-label="Previous query"
                    onClick={() => {
                      setActiveQueryIndex((prev) =>
                        prev > 0 ? prev - 1 : SAMPLE_QUERIES.length - 1,
                      );
                      setSelectedResultIndex(0);
                    }}
                    className="p-0.5 sm:p-1 rounded hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer">
                    <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button
                    aria-label="Next query"
                    onClick={() => {
                      setActiveQueryIndex((prev) =>
                        prev < SAMPLE_QUERIES.length - 1 ? prev + 1 : 0,
                      );
                      setSelectedResultIndex(0);
                    }}
                    className="p-0.5 sm:p-1 rounded hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer">
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 text-[11px] sm:text-xs font-semibold text-foreground">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
                  <span>SearchPoint</span>
                </div>
              </div>

              {/* Center: Live Index Counter */}
              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>1,248,930 files indexed</span>
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
            <div className="flex min-h-[360px] sm:min-h-[460px]">
              {/* Left Sidebar (SearchSidebar) */}
              <div className="hidden lg:flex w-52 flex-col justify-between shrink-0 border-r border-border/60 bg-muted/20 p-3.5 select-none text-xs">
                <div className="space-y-4">
                  {/* Search navigation */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold border border-primary/20">
                      <Search className="h-3.5 w-3.5" />
                      <span>Search</span>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        <span>Favorites</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted font-mono">
                        4
                      </span>
                    </div>
                  </div>

                  {/* Sources section with Real Icons */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                      <span>Sources</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>All sources</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <OnDeviceFolderIcon size={15} />
                        <span>On Device</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <AppleNotesIcon size={15} />
                        <span>Apple Notes</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <WhatsAppIcon size={15} />
                        <span>WhatsApp</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded text-foreground font-semibold bg-primary/10 border-l-[3px] border-primary pl-[9px] cursor-pointer">
                        <div className="flex items-center gap-2">
                          <OneDriveIcon size={15} />
                          <span>OneDrive</span>
                        </div>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <SharePointIcon size={15} />
                        <span>SharePoint</span>
                      </div>
                    </div>
                  </div>

                  {/* File Types section */}
                  <div className="space-y-1">
                    <span className="px-2.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                      File Types
                    </span>
                    <div className="space-y-0.5 text-muted-foreground">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileText className="h-3.5 w-3.5 text-sky-500" />
                        <span>Documents</span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Spreadsheets</span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded hover:text-foreground hover:bg-muted/40 cursor-pointer">
                        <FileText className="h-3.5 w-3.5 text-rose-500" />
                        <span>PDFs</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags section */}
                  <div className="space-y-1">
                    <span className="px-2.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1 px-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        #finance
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        #audit
                      </span>
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
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={currentQuery.label}
                      className="w-full bg-transparent text-xs sm:text-base font-semibold text-foreground focus:outline-none cursor-default truncate"
                    />
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium px-1.5 sm:px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />{" "}
                        14ms
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        Broad Match
                      </span>
                    </div>
                  </div>

                  {/* Filter Chip Strip & Sample Query Pills */}
                  <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                        Try query:
                      </span>
                      {SAMPLE_QUERIES.map((q, idx) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            setActiveQueryIndex(idx);
                            setSelectedResultIndex(0);
                          }}
                          className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                            activeQueryIndex === idx
                              ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                              : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                          }`}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>{currentQuery.results.length} files found</span>
                    </div>
                  </div>
                </div>

                {/* Split View: Search Result Items (Left) & File Detail Panel (Right) */}
                <div className="grid grid-cols-2 flex-1">
                  {/* Left Column: Result List */}
                  <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 border-r border-border/60">
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
                          className={`group p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex items-start gap-1.5 sm:gap-2.5 ${
                            isSelected
                              ? "bg-primary/5 border-primary/40 shadow-xs"
                              : "bg-card/40 border-transparent hover:bg-muted/40 hover:border-border/60"
                          }`}>
                          <div
                            className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 ${item.iconColor}`}>
                            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-[11px] sm:text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {item.title}
                              </h4>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground shrink-0">
                                {item.size}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.matchSnippet}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1 truncate max-w-[70px] sm:max-w-[170px]">
                                <SourceBadgeIcon
                                  sourceType={item.sourceType}
                                  className="shrink-0"
                                />
                                <span className="truncate">{item.source}</span>
                              </span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: File Detail Panel */}
                  <div className="p-2 sm:p-4 bg-muted/10 flex flex-col justify-between">
                    <div className="space-y-2 sm:space-y-4">
                      {/* File Header with Action Buttons */}
                      <div className="space-y-1.5 sm:space-y-2.5 pb-2 sm:pb-3 border-b border-border/60">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                              {selectedResult.title}
                            </h3>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                              {selectedResult.path}
                            </p>
                          </div>
                          <button
                            onClick={() => setIsFavorited(!isFavorited)}
                            className={`p-1 sm:p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                              isFavorited
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted"
                            }`}
                            title="Favorite File">
                            <Star
                              className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                                isFavorited ? "fill-amber-500" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 pt-0.5">
                          <button className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer">
                            <SquareArrowOutUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="truncate">Open</span>
                          </button>
                          <button className="inline-flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-border/70 bg-card text-[10px] sm:text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
                            <FolderOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                            <span className="hidden sm:inline">Folder</span>
                          </button>
                          <button className="inline-flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg border border-border/70 bg-card text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                            <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </button>
                        </div>
                      </div>

                      {/* File Metadata Properties */}
                      <div className="space-y-1 sm:space-y-2.5 text-[10px] sm:text-xs">
                        <div className="flex justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground font-medium truncate max-w-[90px] sm:max-w-[180px]">
                            {selectedResult.fileType}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="text-foreground font-medium">
                            {selectedResult.size}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            Modified:
                          </span>
                          <span className="text-foreground font-medium truncate max-w-[90px] sm:max-w-none">
                            {selectedResult.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Source:</span>
                          <span className="inline-flex items-center gap-1 text-foreground font-medium truncate max-w-[90px] sm:max-w-none">
                            <SourceBadgeIcon
                              sourceType={selectedResult.sourceType}
                            />
                            <span className="truncate">
                              {selectedResult.source}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Tags:</span>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {selectedResult.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                                <Tag className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between py-0.5 sm:py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            Permission:
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 text-[9px] sm:text-[11px]">
                            <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{" "}
                            M365 ACL
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer helper */}
                    <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-border/50 flex items-center justify-between text-[9px] sm:text-[11px] text-muted-foreground">
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
