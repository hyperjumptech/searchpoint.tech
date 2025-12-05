"use client";

import { Download, FilterIcon, Key, LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import NavbarLogo from "@/components/navbar-logo";
import SearchBar from "@/components/searchbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { detectOS, osToUpdaterFormat } from "@/lib/detect-os";
import { useUserStore } from "@/stores/user";
import CategoryTabs from "./category-tabs";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const showSearchBar = pathname === "/search";

  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";

  const { user, logOut } = useUserStore();

  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [hasDownloaded, setHasDownloaded] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hasDownloaded") === "true";
    }
    return false;
  });
  const navbarHeightClass = showSearchBar ? "lg:h-32" : "lg:h-16";

  const handleOpenSummary = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("summary", "true");
    router.push(`/search?${params.toString()}`);
  };

  const generateLicenseKey = async () => {
    if (!user?.email) return;

    const detectedOS = detectOS();

    try {
      setIsGeneratingLicense(true);
      const res = await fetch(
        `/api/generate-license?email=${encodeURIComponent(
          user.email,
        )}&os=${encodeURIComponent(detectedOS)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setLicenseKey(data.licenseKey);
      setIsLicenseOpen(true);
      setCopyLabel("Copy");
    } finally {
      setIsGeneratingLicense(false);
    }
  };

  const handleDownloadAndLicense = async () => {
    if (!user?.email) return;

    // Detect OS from browser
    const detectedOS = detectOS();
    const { target, arch } = osToUpdaterFormat(detectedOS);

    try {
      // Trigger download URL via updater API with dynamic OS
      const res = await fetch(`/api/updater/${target}/${arch}/0.1.1`);
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
            platformKey = "macOS-download"; // this is a workaround to get the .dmg file instead of the .tar.gz
        }
        const url = data.platforms?.[platformKey]?.url;
        if (url) {
          window.location.href = url;
          localStorage.setItem("hasDownloaded", "true");
          setHasDownloaded(true);
        }
      }
    } catch {}

    // Generate license key with detected OS
    await generateLicenseKey();
  };

  const handleCopy = async () => {
    if (!licenseKey) return;
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 2000);
    } catch {}
  };

  return (
    <header className="relative z-50 border-b border-border/20 bg-transparent text-foreground">
      <nav className={cn("mx-auto px-4 py-4", navbarHeightClass, "lg:py-0")}>
        <div className="flex items-start lg:py-4 justify-between lg:flex lg:flex-row lg:justify-between lg:gap-8 lg:h-full">
          <NavbarLogo />

          {/* Middle Column - Always rendered */}
          <div className="hidden w-full lg:flex h-full items-center">
            {showSearchBar && (
              <div className="flex flex-col w-full gap-4 max-w-3xl">
                <SearchBar
                  defaultValue={searchValue}
                  className="max-w-4xl w-full"
                  inputClassName="py-0.5 px-2"
                />
                <div className="flex gap-2 items-center justify-between">
                  <CategoryTabs />
                  {/* Summary */}
                  <Button
                    className="cursor-pointer xl:hidden"
                    onClick={handleOpenSummary}
                    variant={"outline"}>
                    <FilterIcon />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          {user && (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer w-10 h-10 mt-1 shadow-xs border">
                    <AvatarFallback>{user.initialName}</AvatarFallback>
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
                  <DropdownMenuItem
                    onClick={handleDownloadAndLicense}
                    disabled={isGeneratingLicense}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>
                      Download desktop app{" "}
                      {isGeneratingLicense ? "(preparing license...)" : ""}
                    </span>
                  </DropdownMenuItem>
                  {hasDownloaded && (
                    <DropdownMenuItem
                      onClick={generateLicenseKey}
                      disabled={isGeneratingLicense}>
                      <Key className="mr-2 h-4 w-4" />
                      <span>
                        Show license key{" "}
                        {isGeneratingLicense ? "(loading...)" : ""}
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={async () => {
                      await logOut();
                      window.location.href = "/login";
                    }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {/* Search Bar - Mobile only */}
        {showSearchBar && (
          <div className="lg:hidden pt-3">
            <SearchBar
              defaultValue={searchValue}
              className="w-full"
              inputClassName="py-0.5 px-2"
            />
          </div>
        )}

        {showSearchBar && (
          <div className="lg:hidden mt-3 overflow-x-auto scrollbar-hide relative z-50">
            <div className="flex w-full items-center gap-4">
              {/* Category Tabs */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <CategoryTabs />
              </div>
              {/* Summary */}
              <Button
                className="cursor-pointer xl:hidden shrink-0"
                onClick={handleOpenSummary}
                variant={"outline"}>
                <FilterIcon />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {isLicenseOpen && licenseKey && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border">
            <h2 className="text-lg font-semibold mb-2">License Key</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use this license key to activate your SCSE desktop application.
            </p>
            <div className="mb-4 rounded-md border bg-muted px-3 py-2 text-sm break-all">
              {licenseKey}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLicenseOpen(false)}>
                Close
              </Button>
              <Button
                className="bg-sky-600 hover:bg-sky-600/90"
                variant="default"
                size="sm"
                onClick={handleCopy}>
                {copyLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
