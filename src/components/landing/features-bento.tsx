"use client";

import Image from "next/image";
import {
  Search,
  Sparkles,
  ScanText,
  WifiOff,
  Tag,
  ShieldCheck,
  ZoomIn,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Database,
  Lock,
  Shield,
} from "lucide-react";

interface FeaturesBentoProps {
  onOpenImage?: (src: string, alt: string) => void;
}

export default function FeaturesBento({ onOpenImage }: FeaturesBentoProps) {
  const handleImageClick = (src: string, alt: string) => {
    if (onOpenImage) {
      onOpenImage(src, alt);
    }
  };

  return (
    <section
      id="features"
      className="w-full py-24 relative overflow-hidden scroll-mt-16">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Flagship Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Everything you need to <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-sky-400 to-teal-400 bg-clip-text text-transparent">
              find &amp; organize any document
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            SearchPoint connects your local drives, cloud workspaces, and
            messaging apps into one blazing-fast, privacy-first local search
            engine powered by on-device AI.
          </p>
        </div>

        {/* 🍱 Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(240px,auto)]">
          {/* Card 1: Unified Omni-Search (Hero Card: Col Span 2) */}
          <div className="md:col-span-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:border-primary/40 hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-3 relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                <Search className="h-3.5 w-3.5" />
                <span>Unified Omni-Search</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                One search bar for your entire workspace
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Stop jumping between File Explorer, browser tabs, and
                SharePoint. Instantly search across local folders, OneDrive,
                SharePoint, Google Drive, Apple Notes, and WhatsApp from a
                single prompt.
              </p>
            </div>

            {/* Interactive Search Mockup & Preview */}
            <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-6 space-y-2.5">
                <div className="flex items-center justify-between px-3 py-2 bg-background/90 rounded-lg border border-border text-xs font-medium">
                  <div className="flex items-center gap-2 text-foreground truncate">
                    <Search className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">financial audit 2026</span>
                  </div>
                  <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    ⌘K
                  </kbd>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium">
                    OneDrive
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-medium">
                    Local PC
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                    Apple Notes
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                    WhatsApp
                  </span>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div
                  onClick={() =>
                    handleImageClick(
                      "/images/searchpoint/feature-sp-1-trimmed.webp",
                      "SearchPoint showing unified results across local folders and cloud drives.",
                    )
                  }
                  className="relative rounded-xl border border-border/80 bg-background/80 p-1.5 overflow-hidden shadow-md cursor-zoom-in group/img hover:border-primary/40 transition-all">
                  <Image
                    src="/images/searchpoint/feature-sp-1-trimmed.webp"
                    alt="SearchPoint showing unified results across local folders and cloud drives."
                    width={800}
                    height={420}
                    className="w-full h-auto rounded-lg object-contain"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-background/90 text-[10px] font-medium text-muted-foreground group-hover/img:text-foreground inline-flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <ZoomIn className="h-2.5 w-2.5" /> Zoom
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Smart Renaming (Curation Hub) */}
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:border-purple-500/40 hover:shadow-purple-500/5 transition-all duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>On-Device AI Renamer</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                Rename by AI
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Automatically detects cryptic filenames and suggests clean,
                descriptive names using an on-device LLM—with zero cloud
                leakage.
              </p>
            </div>

            <div className="mt-6 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-background/90 border border-purple-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground line-through truncate max-w-[130px]">
                    download(3).pdf
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                    ✓ AI Ready
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">AWS_Invoice_May_2026.pdf</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/90 border border-purple-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground line-through truncate max-w-[130px]">
                    IMG_3849.png
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                    ✓ AI Ready
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">Office_Tax_Receipt.png</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Native On-Device OCR & Visual AI */}
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-500/5 transition-all duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                <ScanText className="h-3.5 w-3.5" />
                <span>Native OCR &amp; Vision</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                Image &amp; Scanned PDF OCR
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Search text inside receipts, diagrams, screenshots, and scanned
                documents using Apple Vision &amp; Windows Media OCR.{" "}
                <strong>0 MB model download required.</strong>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Inference Latency:
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                &lt; 50ms / page
              </span>
            </div>
          </div>

          {/* Card 4: 100% Offline-First Search Engine */}
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline-First Engine</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                Zero Cloud Dependency
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Working offline on a flight or experiencing network downtime?
                SearchPoint automatically falls back to its local search without
                missing a beat.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full searchability offline</span>
            </div>
          </div>

          {/* Card 5: Smart Organization (Tags, Projects & Notes) */}
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:border-amber-500/40 hover:shadow-amber-500/5 transition-all duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
                <Tag className="h-3.5 w-3.5" />
                <span>Custom Organization</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                Tags, Projects &amp; Notes
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Bookmark favorites, attach searchable Markdown notes, and assign
                custom project tags to create an intuitive layer on top of your
                files.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                ★ Starred
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                #Budget2026
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                has:notes
              </span>
            </div>
          </div>
        </div>

        {/* Feature Deep Dive Snapshot: Native Speed & Security Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-8 border-t border-border/50">
          <div className="lg:col-span-7">
            <div
              onClick={() =>
                handleImageClick(
                  "/images/searchpoint/sp-8.png.webp",
                  "SearchPoint architecture: on-device processing, secure credential storage, and local SQLite engine.",
                )
              }
              className="group relative rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-7 overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:border-sky-500/40 hover:shadow-2xl hover:shadow-sky-500/5 space-y-5">
              {/* Header inside visual card */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Native Architecture Benchmark
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Native vs. Standard Electron Apps
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Fast
                </span>
              </div>

              {/* Benchmarks */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-muted-foreground font-medium">
                      Memory Usage (Idle / Background)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      ~68 MB{" "}
                      <span className="text-muted-foreground font-normal">
                        (vs 620 MB Electron)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: "14%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-muted-foreground font-medium">
                      Search Query Latency (Local SQLite)
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">
                      &lt; 15 ms{" "}
                      <span className="text-muted-foreground font-normal">
                        (Instantaneous)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                      style={{ width: "95%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-muted-foreground font-medium">
                      App Binary Footprint
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                      ~30 MB{" "}
                      <span className="text-muted-foreground font-normal">
                        (vs 180+ MB)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: "12%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Security Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/60 text-[11px]">
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Lock className="h-3 w-3 text-sky-500" />
                    <span>OS Keychain</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    macOS Keychain &amp; Windows DPAPI
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-background/80 border border-border/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Database className="h-3 w-3 text-emerald-500" />
                    <span>Local Index</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Encrypted SQLite on-device
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-background/80 border border-border/80 space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Shield className="h-3 w-3 text-indigo-500" />
                    <span>Zero Leakage</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    No raw files sent to cloud
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Enterprise Privacy &amp; Performance</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
              Built on Native for maximum speed and security
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Unlike heavy hybrid like Electron apps, SearchPoint is engineered
              in native with a minimal RAM usage. All authentication tokens live
              securely in your OS Keychain / DPAPI, and document text stays
              strictly private on your device.
            </p>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero Cloud Content Exfiltration</span>
              </div>
              <p>
                Only search keywords and metadata are synchronized; your raw
                PDFs, spreadsheets, and notes remain encrypted and local.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
