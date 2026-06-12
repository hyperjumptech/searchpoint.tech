"use client";

import { Download, LogOut } from "lucide-react";

import NavbarLogo from "@/components/navbar-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logOut } = useUserStore();

  const handleDownload = async () => {
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
        }
      }
    } catch {}
  };

  return (
    <header className="relative z-50 border-b border-border/20 bg-transparent text-foreground">
      <nav className={cn("mx-auto px-4 py-4 lg:h-16 lg:py-0")}>
        <div className="flex items-center justify-between lg:py-4 lg:flex-row lg:gap-8 lg:h-full">
          <NavbarLogo />

          {/* Profile Dropdown */}
          {user && (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer w-10 h-10 shadow-xs border">
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
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
