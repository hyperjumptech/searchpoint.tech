"use client";

interface DownloadMinimalSectionProps {
  detectedOS: string;
  onDownloadPlatform: (platformKey: string) => void;
}

function AppleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function WindowsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true">
      <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z" />
    </svg>
  );
}

export default function DownloadMinimalSection({
  detectedOS,
  onDownloadPlatform,
}: DownloadMinimalSectionProps) {
  const isMac = detectedOS.startsWith("darwin");
  const isWindows = detectedOS.startsWith("windows");

  return (
    <section
      id="download"
      className="w-full py-28 border-t border-border/50 text-center relative scroll-mt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
          Get SearchPoint now.
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          A fast, native application built for everyday productivity and AI
          workflows.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {/* macOS Button */}
          <button
            onClick={() => onDownloadPlatform("darwin-aarch64")}
            className={`inline-flex items-center gap-2.5 h-12 px-6 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer ${
              isMac
                ? "bg-foreground text-background shadow-lg hover:opacity-90 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border border-border/80 bg-card text-foreground hover:bg-muted"
            }`}>
            <AppleIcon className="h-4 w-4" />
            <span>macOS</span>
            <span className="text-xs opacity-75 font-normal">
              Apple Silicon &amp; Intel
            </span>
          </button>

          {/* Windows Button */}
          <button
            onClick={() => onDownloadPlatform("windows-x86_64")}
            className={`inline-flex items-center gap-2.5 h-12 px-6 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer ${
              isWindows
                ? "bg-foreground text-background shadow-lg hover:opacity-90 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border border-border/80 bg-card text-foreground hover:bg-muted"
            }`}>
            <WindowsIcon className="h-4 w-4" />
            <span>Windows</span>
            <span className="text-xs opacity-75 font-normal">x64</span>
          </button>

          {/* Linux Button */}
          <span className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full border border-border/60 bg-muted/30 text-muted-foreground/60 text-sm font-semibold cursor-not-allowed select-none">
            <span>Linux</span>
            <span className="text-xs font-normal">Coming soon</span>
          </span>
        </div>
      </div>
    </section>
  );
}
