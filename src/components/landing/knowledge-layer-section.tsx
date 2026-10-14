"use client";

import { Sparkles, ShieldCheck } from "lucide-react";

export default function KnowledgeLayerSection() {
  return (
    <section
      id="knowledge-layer"
      className="w-full py-28 border-t border-border/50 relative scroll-mt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-14">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>01 — The Knowledge Layer</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Grounded AI answers.{" "}
            <span className="text-primary block sm:inline">
              Zero hallucinations.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Popular LLMs don&apos;t know your company&apos;s latest internal
            files, spreadsheets, or memos. SearchPoint connects your local and
            cloud workplace data into a private knowledge layer so your models
            cite truth, not guesses.
          </p>
        </div>

        {/* 2 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Connect Models */}
          <div className="p-8 rounded-2xl border border-border/80 bg-card shadow-lg shadow-primary/5 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Connect Your Favorite AI Models
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whether you use ChatGPT, Claude, or self-hosted models like
                Ollama, SearchPoint provides a structured, context-rich
                retrieval pipeline. Ask questions and get answers verified
                directly against your real documents.
              </p>
            </div>

            {/* Pipeline Visual Box */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                  Input
                </span>
                <span className="text-foreground truncate">
                  &ldquo;What did we decide on the 2026 vendor contract?&rdquo;
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                  SearchPoint
                </span>
                <span className="text-muted-foreground truncate">
                  Retrieves verified clause from SharePoint &amp; local PDF
                  cache
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  Verified AI
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 truncate">
                  &ldquo;Section 4.2 states payment terms are Net-30 (Source:
                  Contract_Signed.pdf)&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Permissions & ACL */}
          <div className="p-8 rounded-2xl border border-border/80 bg-card shadow-lg shadow-primary/5 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Strict Permission &amp; ACL Awareness
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI shouldn&apos;t see files that the employee isn&apos;t
                authorized to read. SearchPoint respects existing Microsoft 365,
                SharePoint, and local filesystem permissions so confidential
                data never leaks into AI context prompts.
              </p>
            </div>

            {/* Pipeline Visual Box */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  M365 ACL
                </span>
                <span className="text-foreground truncate">
                  Sales executive queries Q3 bonuses
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold shrink-0">
                  Security Guard
                </span>
                <span className="text-muted-foreground truncate">
                  Restricted executive payroll files excluded automatically
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                  Context Safe
                </span>
                <span className="text-blue-600 dark:text-blue-400 truncate">
                  Only permitted departmental revenue sheets passed to AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
