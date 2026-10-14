"use client";

import { Sparkles, ArrowRight, Check } from "lucide-react";

export default function SmartRenameSection() {
  const examples = [
    {
      original: "download(3).pdf",
      suggested: "Report - Indorelawan - 2020 - Laporan Tahunan.pdf",
      badge: "Content Parsed",
    },
    {
      original: "cloudframework_tencentCloud_sinarmasgrpup_may2026_v3_vvv3.pdf",
      suggested:
        "Architecture - Cloud Framework - Tencent Cloud Evaluation 2026.pdf",
      badge: "Normalized",
    },
    {
      original: "Receipt-2336-2279.pdf",
      suggested: "Finance - Receipt - Vendor Hardware Purchase - May 2026.pdf",
      badge: "Tagged",
    },
  ];

  return (
    <section
      id="smart-rename"
      className="w-full py-28 border-t border-border/50 relative scroll-mt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>03 — Intelligent File Organization</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Turn chaotic downloads{" "}
            <span className="text-muted-foreground block sm:inline">
              into structured archives.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Files downloaded with names like{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground">
              download(3).pdf
            </code>{" "}
            or{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground">
              scan_0912.pdf
            </code>{" "}
            waste hours when you need them later. SearchPoint&apos;s{" "}
            <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary decoration-2">
              on-device AI
            </span>{" "}
            inspects document structure and suggests standardized names
            automatically.
          </p>
        </div>

        {/* Visual Frame */}
        <div className="w-full rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/5 overflow-hidden transition-all duration-300">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-semibold text-foreground">
              Filename Recommendations
            </span>
            <span className="text-muted-foreground text-[11px]">
              Rule: Category / Type First
            </span>
          </div>

          {/* Body items */}
          <div className="p-6 sm:p-8 space-y-3.5 bg-card/60">
            {examples.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-background/90 border border-border/70 hover:border-primary/40 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-mono text-muted-foreground line-through truncate">
                    {item.original}
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.suggested}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    {item.badge}
                  </span>
                  <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
