import { Check, X, Minus, Sparkles } from "lucide-react";

const COMPARISON_ROWS = [
  {
    feature: "Unified Local & Cloud Search",
    description:
      "Search local disk, OneDrive, and SharePoint simultaneously from one shortcut",
    searchpoint: { state: "check", text: "Full Native Hybrid" },
    osSearch: { state: "partial", text: "Local disk only" },
    cloudWeb: { state: "cross", text: "Cloud only (No PC files)" },
  },
  {
    feature: "100% Offline Search Capability",
    description:
      "Full-text search works completely offline during flights or network drops",
    searchpoint: { state: "check", text: "Sub-50ms SQLite FTS5" },
    osSearch: { state: "check", text: "Local files only" },
    cloudWeb: { state: "cross", text: "Fails without internet" },
  },
  {
    feature: "On-Device AI & Total Privacy",
    description:
      "Document summarization & smart renaming without cloud API calls",
    searchpoint: { state: "check", text: "0 Bytes Exfiltrated" },
    osSearch: { state: "cross", text: "No content intelligence" },
    cloudWeb: { state: "cross", text: "Cloud telemetry & AI logs" },
  },
  {
    feature: "Zero Data Warehousing",
    description:
      "Files are never duplicated or held on third-party backend servers",
    searchpoint: { state: "check", text: "Zero Remote Storage" },
    osSearch: { state: "check", text: "Local storage only" },
    cloudWeb: { state: "cross", text: "Centralized cloud" },
  },
  {
    feature: "Microsoft 365 ACL Enforcement",
    description:
      "Strictly respects Entra ID groups and SharePoint permission boundaries",
    searchpoint: { state: "check", text: "Native Entra ID OAuth" },
    osSearch: { state: "cross", text: "No M365 ACL awareness" },
    cloudWeb: { state: "check", text: "Web-only ACL check" },
  },
  {
    feature: "Average Query Latency",
    description: "Time to render full-text search results across 1M+ files",
    searchpoint: { state: "check", text: "<50ms Sub-second" },
    osSearch: { state: "partial", text: "200ms – 2.0s" },
    cloudWeb: { state: "cross", text: "1.0s – 4.0s (Web Lag)" },
  },
];

export default function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="w-full py-24 border-t border-border/50 relative scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <span>Competitive Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Why enterprise teams switch to SearchPoint.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            See how SearchPoint compares against built-in OS search and cloud
            web portals.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6 w-2/5">Capability</th>
                  <th className="py-4 px-4 w-1/5 text-primary font-bold bg-primary/5 border-x border-primary/20 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-sm font-bold text-primary">
                      <Sparkles className="h-4 w-4" /> SearchPoint
                    </span>
                  </th>
                  <th className="py-4 px-4 w-1/5 text-center">
                    <span className="block">OS Search</span>
                    <span className="text-[11px] font-normal normal-case text-muted-foreground block mt-0.5">
                      (e.g. Spotlight)
                    </span>
                  </th>
                  <th className="py-4 px-4 w-1/5 text-center">
                    <span className="block">Cloud Web</span>
                    <span className="text-[11px] font-normal normal-case text-muted-foreground block mt-0.5">
                      (e.g. MS Teams Search)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-muted/30 transition-colors">
                    {/* Capability column */}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground block">
                        {row.feature}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {row.description}
                      </span>
                    </td>

                    {/* SearchPoint column (Highlighted) */}
                    <td className="py-4 px-4 bg-primary/5 border-x border-primary/20 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {row.searchpoint.text}
                        </span>
                      </div>
                    </td>

                    {/* OS Search */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {row.osSearch.state === "check" ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : row.osSearch.state === "partial" ? (
                          <Minus className="h-4 w-4 text-amber-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/60" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {row.osSearch.text}
                        </span>
                      </div>
                    </td>

                    {/* Cloud Web */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {row.cloudWeb.state === "check" ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : row.cloudWeb.state === "partial" ? (
                          <Minus className="h-4 w-4 text-amber-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/60" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {row.cloudWeb.text}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
