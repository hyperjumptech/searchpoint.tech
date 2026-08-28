"use client";

import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  Server,
  KeyRound,
  FileCheck2,
  ZoomIn,
} from "lucide-react";

interface SecuritySectionProps {
  onOpenImage?: (src: string, alt: string) => void;
}

export default function SecuritySection({ onOpenImage }: SecuritySectionProps) {
  const handleImageClick = (src: string, alt: string) => {
    if (onOpenImage) {
      onOpenImage(src, alt);
    }
  };

  return (
    <section
      id="security"
      className="w-full py-24 bg-muted/20 border-t border-border/50 relative scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            <Lock className="h-3.5 w-3.5" />
            <span>Security &amp; Deployment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Your files stay where you run them.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            We do not warehouse full copies on our side. Everything is indexed
            with zero-trust permissions and strict data sovereignty.
          </p>
        </div>

        {/* Security Pillar 1: No Warehouse of Raw Files */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Warehousing Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
              No warehouse of raw files on our side
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We index file metadata and search keywords derived from your
              content; keywords are sanitized to strip sensitive information
              under your rules. Full documents and extracted text are not stored
              on our side—
              <strong className="text-foreground">
                your files stay where you already keep them
              </strong>
              .
            </p>
            <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileCheck2 className="h-4 w-4 text-emerald-500" />
                <span>Sanitized local keyword indexing</span>
              </div>
              <p>
                Tags, keywords, author, and timestamp metadata populate the fast
                search index without central file duplication.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div
              onClick={() =>
                handleImageClick(
                  "/images/searchpoint/sp-6.png.webp",
                  "Diagram: tags, keywords, date, and author are extracted from a source file into an index database; full file warehouse storage is not used.",
                )
              }
              className="group relative rounded-2xl border border-border/80 bg-card/80 p-2 overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5">
              <Image
                src="/images/searchpoint/sp-6.png.webp"
                alt="Diagram: tags, keywords, date, and author are extracted from a source file into an index database; full file warehouse storage is not used."
                width={1408}
                height={768}
                className="w-full h-auto rounded-xl block object-contain"
              />
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[11px] font-medium text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3 w-3" /> Click to zoom diagram
              </div>
            </div>
          </div>
        </div>

        {/* Security Pillar 2: Permissions Carry Through */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div
              onClick={() =>
                handleImageClick(
                  "/images/searchpoint/sp-7.png.webp",
                  "Diagram: Microsoft 365 ACLs and filesystem permissions carry through to SearchPoint—users only see what they can open at the source.",
                )
              }
              className="group relative rounded-2xl border border-border/80 bg-card/80 p-2 overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5">
              <Image
                src="/images/searchpoint/sp-7.png.webp"
                alt="Diagram: Microsoft 365 ACLs and filesystem permissions carry through to SearchPoint—users only see what they can open at the source."
                width={1408}
                height={768}
                className="w-full h-auto rounded-xl block object-contain"
              />
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[11px] font-medium text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3 w-3" /> Click to zoom diagram
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <Lock className="h-3.5 w-3.5" />
              <span>Identity &amp; ACL Parity</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
              Permissions carry through
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Results honor Microsoft 365 ACLs and filesystem rights. If you
              cannot open it at the source,{" "}
              <strong className="text-foreground">
                you CANNOT see it here
              </strong>
              .
            </p>
            <div className="p-4 rounded-xl border border-border/60 bg-card/60 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-emerald-500" />
                <span>Zero accidental exposure</span>
              </div>
              <p>
                Employees only receive search hits for files they have explicit
                access permissions to in SharePoint and Microsoft 365.
              </p>
            </div>
          </div>
        </div>

        {/* Security Pillar 3: On-Premise Install */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Server className="h-3.5 w-3.5" />
              <span>Enterprise Deployment</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
              On-premise install
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Run SearchPoint inside your network on your hardware and your
              retention standards. We work with your team to plan capacity and
              how SearchPoint should be deployed so it fits your environment.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-3 py-1 rounded-md bg-card/60 border border-border text-foreground">
                Air-Gapped Ready
              </span>
              <span className="px-3 py-1 rounded-md bg-card/60 border border-border text-foreground">
                Internal Hardware
              </span>
              <span className="px-3 py-1 rounded-md bg-card/60 border border-border text-foreground">
                Custom Retention
              </span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div
              onClick={() =>
                handleImageClick(
                  "/images/searchpoint/sp-8.png.webp",
                  "Diagram: SearchPoint running on your network, on your hardware, with your retention and deployment choices.",
                )
              }
              className="group relative rounded-2xl border border-border/80 bg-card/80 p-2 overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5">
              <Image
                src="/images/searchpoint/sp-8.png.webp"
                alt="Diagram: SearchPoint running on your network, on your hardware, with your retention and deployment choices."
                width={1408}
                height={768}
                className="w-full h-auto rounded-xl block object-contain"
              />
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[11px] font-medium text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3 w-3" /> Click to zoom diagram
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
