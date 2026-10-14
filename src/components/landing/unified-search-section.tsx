"use client";

import { Sparkles, HardDrive, Cloud, Globe } from "lucide-react";

export default function UnifiedSearchSection() {
  const sources = [
    {
      title: "On-Device Storage",
      description:
        "Index your local Downloads, Documents, and project directories. Fast, responsive, and available even when offline.",
      icon: HardDrive,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Microsoft OneDrive",
      description:
        "Connect your personal and business cloud storage. Search across presentations, spreadsheets, and shared team assets seamlessly.",
      icon: Cloud,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Microsoft SharePoint",
      description:
        "Find team documentation, company policies, and sales decks across corporate SharePoint sites without tedious portal navigation.",
      icon: Globe,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <section
      id="features"
      className="w-full py-28 border-t border-border/50 relative scroll-mt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-14">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>02 — Unified Desktop Search</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Search all sources at once.{" "}
            <span className="text-muted-foreground block sm:inline">
              Instantly.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Stop switching between File Explorer, browser tabs, and cloud
            portals. SearchPoint indexes metadata across all your storage points
            so queries return in milliseconds.
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sources.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-border/80 bg-card shadow-lg shadow-primary/5 hover:border-primary/40 transition-all space-y-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* More data sources coming soon note */}
        <div className="flex items-center justify-center pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
            More data sources coming soon (Outlook, WhatsApp, Google Drive, and
            more)
          </p>
        </div>
      </div>
    </section>
  );
}
