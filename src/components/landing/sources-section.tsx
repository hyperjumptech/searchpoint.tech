"use client";

import { useState } from "react";
import {
  OneDriveIcon,
  SharePointIcon,
  OutlookIcon,
  WhatsAppIcon,
  AppleNotesIcon,
  OnDeviceFolderIcon,
} from "@/components/icons/source-icons";
import {
  Layers,
  Database,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SourcesSectionProps {
  onOpenImage?: (src: string, alt: string) => void;
}

interface ConnectorItem {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  supportedFormats: string[];
  status: "Real-time" | "Deep Index" | "ACL Aware" | "Local-First";
}

const CONNECTORS: ConnectorItem[] = [
  {
    id: "local",
    name: "Local Storage",
    category: "Physical Disks",
    icon: OnDeviceFolderIcon,
    description:
      "Windows (C:, D:), macOS (~/Docs), Linux drives, and mounted NAS.",
    supportedFormats: ["All Files", "Images OCR", "Code"],
    status: "Local-First",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    category: "Microsoft 365",
    icon: OneDriveIcon,
    description: "Personal and enterprise shared drives with delta sync.",
    supportedFormats: [".docx", ".xlsx", ".pdf"],
    status: "ACL Aware",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    category: "Microsoft 365",
    icon: SharePointIcon,
    description: "Team sites, document libraries, intranets, and lists.",
    supportedFormats: ["Sites", "DocLibs", "Office"],
    status: "ACL Aware",
  },
  {
    id: "outlook",
    name: "Outlook",
    category: "Microsoft 365",
    icon: OutlookIcon,
    description: "Mailboxes, threads, calendar invites, and attachments.",
    supportedFormats: [".eml", ".msg", "Attachments"],
    status: "Real-time",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Messaging",
    icon: WhatsAppIcon,
    description: "End-to-end encrypted chats, voice captions, and media.",
    supportedFormats: ["Chats", "Media", "Docs"],
    status: "Local-First",
  },
  {
    id: "apple_notes",
    name: "Apple Notes",
    category: "Notes & Docs",
    icon: AppleNotesIcon,
    description: "iCloud notes, checklists, folders, and shared drawings.",
    supportedFormats: ["Notes", "Checklists", "Snippets"],
    status: "Local-First",
  },
];

export default function SourcesSection({}: SourcesSectionProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <section
      id="sources"
      className="w-full py-24 border-t border-border/40 bg-muted/10 relative scroll-mt-16 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 blur-[140px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Layers className="h-3.5 w-3.5" />
            <span>Where SearchPoint Looks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Connect PCs, Microsoft 365, file hosts, code, and messaging.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            One unified index across the physical and cloud tools your team
            works in every day.
          </p>
        </div>

        {/* 🌟 Connected Sources Grid */}
        <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {CONNECTORS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group rounded-2xl border border-border/70 bg-background/70 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-4.5 flex flex-col justify-between text-left",
                    index >= 3 && !showAll && "hidden sm:flex",
                  )}>
                  <div>
                    {/* Icon + Category */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <IconComponent size={22} />
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/60">
                        {item.status}
                      </span>
                    </div>

                    {/* Name & Category */}
                    <h3 className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground/80 block mt-0.5 font-medium">
                      {item.category}
                    </span>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Supported Format Pills */}
                  <div className="mt-4 pt-2.5 border-t border-border/40 flex flex-wrap gap-1">
                    {item.supportedFormats.map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {CONNECTORS.length > 3 && (
            <div className="mt-4 text-center sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll((prev) => !prev)}
                className="w-full rounded-xl py-2 text-xs font-medium border-border/70 bg-background/80 hover:bg-card hover:border-primary/40 transition-all">
                {showAll ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show More</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* 3 Pillar Summary Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border/70 bg-card/60 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                Zero Central Warehousing
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw files remain in your local folders, SharePoint, or drives.
                Only search indexes are stored.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/70 bg-card/60 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                Multi-Modal Content OCR
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deep text extraction from scanned PDFs, images, receipts,
                spreadsheets, and source code.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/70 bg-card/60 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                Complete Data Sovereignty
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All indexing and AI embedding runs locally on your PC. No
                corporate data leaves your perimeter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
