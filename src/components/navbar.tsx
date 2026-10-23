"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, LogOut, Menu, X, ExternalLink } from "lucide-react";

import NavbarLogo from "@/components/navbar-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/user";
import { detectOS, osToUpdaterFormat } from "@/lib/detect-os";
import { companyFromHostname, type Company } from "@/lib/company";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Knowledge Layer", href: "#knowledge-layer" },
  { label: "Unified Search", href: "#features" },
  { label: "AI Organization", href: "#smart-rename" },
  { label: "Security", href: "#security" },
  { label: "Download", href: "#download" },
];

export default function Navbar({
  company: initialCompany,
}: {
  company?: Company;
} = {}) {
  const pathname = usePathname();
  const { user, logOut } = useUserStore();
  const [showLinuxModal, setShowLinuxModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [company, setCompany] = useState<Company>(() => {
    if (initialCompany) return initialCompany;
    if (typeof window !== "undefined") {
      return companyFromHostname(
        window.location.href || window.location.hostname,
      );
    }
    return "hyperjump";
  });

  // A server-provided company is authoritative: the deployment is pinned to one
  // tenant via TENANT, which the client cannot see. Only sniff the hostname when
  // no tenant was passed down.
  useEffect(() => {
    if (initialCompany) return;
    if (typeof window !== "undefined") {
      setCompany(
        companyFromHostname(window.location.href || window.location.hostname),
      );
    }
  }, [initialCompany]);

  if (pathname === "/login" || pathname?.startsWith("/docs/")) {
    return null;
  }

  const isLandingPage = pathname === "/landing";

  const handleDownload = async () => {
    // Detect OS from browser
    const detectedOS = detectOS();
    if (detectedOS.startsWith("linux")) {
      setShowLinuxModal(true);
      return;
    }

    const { target, arch } = osToUpdaterFormat(detectedOS);

    try {
      const res = await fetch(
        `/api/updater/${target}/${arch}/0.1.1?company=${company}`,
      );
      if (res.ok) {
        const data = await res.json();
        // Map OS to platform key
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
        }
      }
    } catch {}
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md text-foreground">
        <nav
          className={cn(
            "h-16 w-full",
            isLandingPage
              ? "px-4 sm:px-8 lg:px-12"
              : "max-w-6xl mx-auto px-4 sm:px-6",
          )}>
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <NavbarLogo company={company} />

              {/* Desktop Nav Links (Landing page only) */}
              {isLandingPage && (
                <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                  {NAV_ITEMS.map((item) =>
                    item.isExternal ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                        <span>{item.label}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    ) : (
                      <a
                        key={item.href}
                        href={item.href}
                        className="hover:text-foreground transition-colors">
                        {item.label}
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {isLandingPage && (
                <a
                  href="#download"
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
                  <Download className="h-3.5 w-3.5" />
                  <span>Get App</span>
                </a>
              )}

              <ThemeToggle />

              {/* Profile Dropdown or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer w-9 h-9 shadow-xs border border-border">
                      <AvatarFallback className="text-xs font-semibold">
                        {user.initialName}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings/onedrive"
                        className="flex items-center">
                        <span>OneDrive Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download desktop app</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await logOut();
                      }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-border/80 bg-card/60 text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                  Sign In
                </Link>
              )}

              {/* Mobile & Tablet Menu Toggle (Landing page only) */}
              {isLandingPage && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile & Tablet Dropdown Menu (Landing page only) */}
          {isLandingPage && mobileMenuOpen && (
            <div className="lg:hidden w-full px-3 sm:px-6 py-3 border-t border-border/40 bg-background/95 backdrop-blur-xl flex flex-col gap-3 text-sm font-medium text-muted-foreground animate-in slide-in-from-top-2 duration-200">
              {NAV_ITEMS.map((item) =>
                item.isExternal ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full px-2 py-1 hover:text-foreground flex items-center justify-between">
                    <span>{item.label}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full px-2 py-1 hover:text-foreground">
                    {item.label}
                  </a>
                ),
              )}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-2 py-1 text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              )}
            </div>
          )}
        </nav>
      </header>

      <Dialog open={showLinuxModal} onOpenChange={setShowLinuxModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Linux Version Coming Soon</DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              SearchPoint Desktop for Linux is currently in development and will
              be available soon. SearchPoint is available for Windows and macOS.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowLinuxModal(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
