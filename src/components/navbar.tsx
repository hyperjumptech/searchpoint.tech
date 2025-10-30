"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import NavbarLogo from "@/components/navbar-logo";
import NavbarProfile from "@/components/navbar-profile";
import SearchBar from "@/components/searchbar";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";
import { Dialog, DialogPanel } from "@headlessui/react";

export default function Navbar() {
  const pathname = usePathname();
  const showSearchBar = pathname === "/search";

  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUserStore();

  return (
    <header className="relative z-50 border-b border-border bg-background text-foreground">
      {/* ===== DESKTOP ===== */}
      <nav className="mx-auto flex items-center justify-between py-3 px-4">
        <NavbarLogo />

        {showSearchBar && (
          <div className="hidden md:flex flex-1 items-center md:justify-start justify-center px-4">
            <SearchBar
              defaultValue={searchValue}
              className="w-full max-w-3xl"
              inputClassName="py-0.5 px-2"
            />
          </div>
        )}

        {user && <NavbarProfile user={user} className="hidden md:block" />}

        <div className="flex md:hidden">
          <Button
            variant="outline"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <MenuIcon className="text-foreground" />
          </Button>
        </div>
      </nav>

      {/* ===== MOBILE ===== */}
      {showSearchBar && (
        <div className="md:hidden px-4 p-3">
          <SearchBar
            defaultValue={searchValue}
            className="w-full"
            inputClassName="py-0.5 px-2"
          />
        </div>
      )}

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="md:hidden"
      >
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          aria-hidden="true"
        />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-border bg-background text-foreground shadow-lg sm:max-w-sm">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <NavbarLogo />
            <Button variant="outline" onClick={() => setMobileMenuOpen(false)}>
              <XIcon className="text-foreground" />
            </Button>
          </div>
          <div className="p-3">
            {user && <NavbarProfile user={user} className="block" />}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
