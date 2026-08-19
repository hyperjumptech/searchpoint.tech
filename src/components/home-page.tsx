"use client";

import Hero from "@/components/hero";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { companyFromEmail } from "@/lib/company";
import { osToUpdaterFormat } from "@/lib/detect-os";
import { useUserStore } from "@/stores/user";
import Image from "next/image";
import { Clock, Download, Search, ShieldCheck, Lock } from "lucide-react";
import { useState } from "react";
import packageInfo from "../../package.json";

function getPlatformLabel(os: string) {
  if (os.startsWith("darwin")) return "macOS";
  if (os.startsWith("windows")) return "Windows";
  return "Linux";
}

function getInstallSteps(os: string) {
  if (os.startsWith("darwin"))
    return [
      "Open the downloaded .dmg file",
      "Drag SearchPoint into your Applications folder",
      "Launch SearchPoint from Applications",
    ];
  if (os.startsWith("windows"))
    return [
      "Run the downloaded .msi installer",
      "Follow the setup wizard",
      "Launch SearchPoint from the Start menu",
    ];
  return [
    "Install with: sudo dpkg -i SearchPoint_*.deb",
    "Configure deep linking by creating the desktop entry:\n\nsudo nano /usr/share/applications/SearchPoint.desktop\n\nEdit the file to match the layout shown below.",
    "Update the desktop database to register the new handler:\n\nupdate-desktop-database ~/.local/share/applications",
    "Set SearchPoint as the default handler for the URL scheme:\n\nxdg-mime default SearchPoint.desktop x-scheme-handler/searchpoint",
    "Launch SearchPoint from your application menu or via a searchpoint:// link",
  ];
}

export default function HomePageClient({
  detectedOS,
  isMobile,
  isGoogleChrome,
}: {
  detectedOS: string;
  isMobile: boolean;
  isGoogleChrome: boolean;
}) {
  const { user } = useUserStore();
  const [downloaded, setDownloaded] = useState(false);
  const [fading, setFading] = useState(false);
  const [error, setError] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const platformLabel = getPlatformLabel(detectedOS);
  const isMac = detectedOS.startsWith("darwin");
  const isWindows = detectedOS.startsWith("windows");
  const isLinux = detectedOS.startsWith("linux");

  const handleDownload = async () => {
    if (!user?.email || downloaded || fading) return;
    setError("");

    if (isLinux) {
      setError("Linux build is coming soon. Please check back later.");
      return;
    }

    const { target, arch } = osToUpdaterFormat(detectedOS);
    const company = companyFromEmail(user.email);

    try {
      // Pass company explicitly from the signed-in user's email — the browser
      // knows this with certainty, unlike host-based derivation which depends
      // on the reverse proxy correctly forwarding the original Host.
      const res = await fetch(
        `/api/updater/${target}/${arch}/0.0.0?company=${company}`,
      );
      if (!res.ok) {
        setError("Download unavailable. Please try again later.");
        return;
      }
      const data = await res.json();
      let platformKey: string;
      switch (detectedOS) {
        case "windows-x86_64":
          platformKey = "windows-x86_64";
          break;
        case "linux-x86_64":
          platformKey = "linux-x86_64";
          break;
        default:
          platformKey = "macOS-download";
      }
      const url = data.platforms?.[platformKey]?.url;
      if (url) {
        window.location.href = url;
        setFading(true);
        setTimeout(() => {
          setDownloaded(true);
          if (isMac || isWindows) setShowTutorial(true);
        }, 200);
      } else {
        setError("No download available for your platform.");
      }
    } catch {
      setError("Download failed. Check your connection and try again.");
    }
  };

  return (
    <main className="mx-auto flex flex-col items-center max-w-5xl min-h-[calc(100vh-6rem)] px-6 pt-16 pb-24">
      {/* Hero */}
      <section className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Hero />

        <div className="mt-10 flex flex-col items-center gap-3">
          {isMobile ? (
            <p className="text-sm text-muted-foreground">
              SearchPoint Desktop is available on Windows and macOS (Linux
              coming soon).
            </p>
          ) : downloaded ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200 motion-reduce:animate-none">
              <h2 className="text-xl font-semibold text-foreground">
                Installing on {platformLabel}
              </h2>
              <ol className="text-left text-muted-foreground space-y-4 list-decimal list-inside">
                {getInstallSteps(detectedOS).map((step, index) => (
                  <li key={`${step}-${index}`} className="space-y-3">
                    <span>{step}</span>
                    {isLinux && index === 1 && (
                      <div className="flex mt-2 justify-center items-center rounded-xl overflow-hidden border border-border/60 bg-card/70 max-w-xl mx-auto">
                        <Image
                          src="/images/linux-desktop-entry.svg"
                          alt="Example Linux .desktop entry layout for SearchPoint deep linking"
                          width={720}
                          height={420}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
                <DialogContent
                  tabIndex={-1}
                  onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus({
                      preventScroll: true,
                    });
                  }}
                  className="max-h-[90vh] max-w-[calc(100%-1rem)] overflow-y-auto p-3 motion-reduce:animate-none sm:max-w-4xl sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Installing on {platformLabel}</DialogTitle>
                    <DialogDescription>
                      Follow these steps to install SearchPoint on your{" "}
                      {isMac ? "Mac" : "PC"}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">
                        Installation Steps
                      </h3>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                        {getInstallSteps(detectedOS).map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    {isWindows && isGoogleChrome && (
                      <div className="border-t pt-4">
                        <h3 className="mb-2 font-medium text-foreground">
                          If Chrome blocks the download
                        </h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Select{" "}
                          <span className="font-semibold text-foreground">
                            Keep
                          </span>{" "}
                          in Chrome, then choose{" "}
                          <span className="font-semibold text-foreground">
                            Keep anyway
                          </span>{" "}
                          if prompted.
                        </p>
                        <figure className="mx-auto w-full max-w-[359px] overflow-hidden rounded-xl border border-border/60 bg-muted/40 p-1.5 shadow-sm">
                          <Image
                            src="/images/chrome-smart-screen.png"
                            alt="Chrome download warning with the Keep menu highlighted"
                            width={359}
                            height={147}
                            sizes="(max-width: 640px) calc(100vw - 2.5rem), 359px"
                            className="block h-auto w-full rounded-md"
                          />
                        </figure>
                      </div>
                    )}
                    {isMac ? (
                      <>
                        <div className="border-t pt-4">
                          <h3 className="font-medium text-foreground mb-3">
                            Installation Walkthrough
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Watch the install walkthrough first. If macOS asks
                            for approval, click{" "}
                            <span className="font-semibold text-foreground">
                              Open
                            </span>{" "}
                            in the prompt shown below.
                          </p>
                          <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                            <div className="relative aspect-[1456/936] w-full">
                              <video
                                controls
                                preload="metadata"
                                className="absolute inset-0 h-full w-full bg-background object-contain">
                                <source
                                  src="/videos/mac-installer.mp4"
                                  type="video/mp4"
                                />
                                <track kind="captions" />
                              </video>
                            </div>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="font-medium text-foreground mb-2">
                            If this Mac warning appears
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Click{" "}
                            <span className="font-semibold text-foreground">
                              Open
                            </span>{" "}
                            to continue.
                          </p>
                          <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.5rem] bg-background">
                            <Image
                              src="/images/mac-exec-gate.jpg"
                              alt="macOS security prompt asking whether to open SearchPoint"
                              width={514}
                              height={517}
                              className="block h-auto w-full scale-[1.018] object-contain"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border-t pt-4">
                          <h3 className="font-medium text-foreground mb-2">
                            Windows SmartScreen Warning
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Windows may show a SmartScreen warning because
                            SearchPoint is new and not yet widely recognized. To
                            proceed:
                          </p>
                          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside mb-4">
                            <li>
                              Click{" "}
                              <span className="font-semibold text-foreground">
                                More info
                              </span>
                            </li>
                            <li>
                              Click{" "}
                              <span className="font-semibold text-foreground">
                                Run anyway
                              </span>
                            </li>
                          </ol>
                          <figure className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-muted/40 p-1.5 shadow-sm">
                            <Image
                              src="/images/windows-smartscreen.jpg"
                              alt="Windows SmartScreen warning showing More info, then Run anyway"
                              width={1295}
                              height={1214}
                              sizes="(max-width: 640px) calc(100vw - 2.5rem), 42rem"
                              className="block h-auto w-full max-h-[28rem] object-contain"
                            />
                          </figure>
                        </div>
                        <div className="flex justify-end border-t pt-4">
                          <DialogClose className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-[background-color,box-shadow,transform] duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none">
                            Done
                          </DialogClose>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : isLinux ? (
            <div
              className={`flex flex-col items-center gap-3 transition-opacity duration-200 motion-reduce:transition-none ${fading ? "opacity-0" : "opacity-100"}`}>
              <button
                disabled
                aria-disabled="true"
                className="group relative flex items-center gap-3 rounded-xl bg-muted px-8 py-4 text-lg font-medium text-muted-foreground shadow-xs cursor-not-allowed opacity-80">
                <Download className="h-5 w-5" />
                Download for Linux (Coming Soon)
              </button>
              <div className="flex flex-col items-center gap-1.5 text-center max-w-md">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  Linux Coming Soon
                </span>
                <p className="text-sm text-muted-foreground">
                  SearchPoint Desktop for Linux is currently in development.
                  SearchPoint is available for Windows and macOS.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center gap-3 transition-opacity duration-200 motion-reduce:transition-none ${fading ? "opacity-0" : "opacity-100"}`}>
              <button
                onClick={handleDownload}
                className="group relative flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none cursor-pointer">
                <Download className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                Download for {platformLabel}
              </button>
              <span className="text-sm text-muted-foreground">
                SearchPoint Desktop &middot; {platformLabel}
              </span>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <FeatureCard
          icon={<Search className="h-6 w-6" />}
          title="Search across PCs and cloud"
          description="Stop jumping between File Explorer, browser tabs, and SharePoint. One query surface for local folders, OneDrive, and SharePoint."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Your files stay where you run them"
          description="Results honor Microsoft 365 ACLs and filesystem rights. We do not warehouse full copies on our side."
        />
        <FeatureCard
          icon={<Lock className="h-6 w-6" />}
          title="Permissions carry through"
          description="Results honor Microsoft 365 ACLs and filesystem rights. No one can see files they don't have access to."
        />
      </section>

      {/* Version Tag */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/30 select-none blur-[0.3px] hover:blur-none transition-all duration-200">
        v{packageInfo.version}
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
