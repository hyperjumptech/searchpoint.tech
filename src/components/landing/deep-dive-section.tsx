"use client";

import Image from "next/image";
import {
  Sparkles,
  Bot,
  Layers,
  FileCheck2,
  Lock,
  CheckCircle2,
  ZoomIn,
} from "lucide-react";

interface DeepDiveSectionProps {
  onOpenImage?: (src: string, alt: string) => void;
}

export default function DeepDiveSection({ onOpenImage }: DeepDiveSectionProps) {
  const handleImageClick = (src: string, alt: string) => {
    if (onOpenImage) {
      onOpenImage(src, alt);
    }
  };

  return (
    <section
      id="ai-knowledge"
      className="w-full py-24 bg-muted/60 dark:bg-muted/30 border-y border-border/80 relative scroll-mt-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 mb-4 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="leading-none">Coming Soon</span>
            <span className="text-muted-foreground/40 leading-none">•</span>
            <Bot className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="leading-none">AI Knowledge Layer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            The knowledge layer for AI apps and agents.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Ground assistants in the same documents your people already
            search—not a separate silo.
          </p>
        </div>

        {/* Section Content */}
        <div className="space-y-16">
          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border/80 bg-background/80 dark:bg-card/70 backdrop-blur-sm space-y-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                One corpus, many clients
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build once: desktop search and any AI surface all query the same
                indexed knowledge base.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-background/80 dark:bg-card/70 backdrop-blur-sm space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Provenance you can show
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Return snippets, titles, and exact locations so AI apps can cite
                authentic sources and users can verify.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-background/80 dark:bg-card/70 backdrop-blur-sm space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 w-fit">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Same rules as search
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Agents inherit Microsoft 365 ACLs and filesystem
                rights—preventing accidental data exposure across teams.
              </p>
            </div>
          </div>

          {/* Verified Answers with MCP Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-4">
            <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="leading-none text-amber-600 dark:text-amber-400">
                  Coming Soon
                </span>
                <span className="text-indigo-400/40 dark:text-indigo-500/40 leading-none">
                  •
                </span>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-none">
                  Model Context Protocol (MCP)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                Answers you can verify
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                By using SearchPoint&apos;s Model Context Protocol (MCP) server,
                you can ask in plain language—for example,{" "}
                <em>
                  &ldquo;What was the invoice amount for company X last
                  month?&rdquo;
                </em>
                —and open the proof: document owners, quoted excerpts, and links
                to the exact files and folders behind the answer so anyone can
                re-check the same trail.
              </p>
              <div className="p-4 rounded-xl border border-border/70 bg-background/60 dark:bg-card/60 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Auditable AI citations</span>
                </div>
                <p>
                  No hallucinations without provenance. Every AI answer links
                  directly to verified internal files.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div
                onClick={() =>
                  handleImageClick(
                    "/images/searchpoint/feature-sp-2-trimmed.webp",
                    "SearchPoint answer with cited sources and proof from SharePoint documents and Outlook.",
                  )
                }
                className="group relative rounded-2xl border border-border/80 bg-background/90 dark:bg-card/80 p-2 overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5">
                <Image
                  src="/images/searchpoint/feature-sp-2-trimmed.webp"
                  alt="SearchPoint answer with cited sources and proof from SharePoint documents and Outlook."
                  width={1371}
                  height={735}
                  className="w-full h-auto rounded-xl block object-contain"
                />
                <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[11px] font-medium text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-3 w-3" /> Click to zoom
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
