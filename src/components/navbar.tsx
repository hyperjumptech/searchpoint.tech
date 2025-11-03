"use client";

import { LogOut } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import NavbarLogo from "@/components/navbar-logo";
import SearchBar from "@/components/searchbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/user";

export default function Navbar() {
  const pathname = usePathname();
  const showSearchBar = pathname === "/search";

  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";

  const { user } = useUserStore();

  return (
    <header className="relative z-50 border-b border-border bg-background text-foreground">
      <nav className="mx-auto px-4 py-3 md:h-16 md:py-0">
        <div className="flex items-center justify-between md:grid md:grid-cols-[160px_1fr_80px] md:gap-4 md:h-full">
          <NavbarLogo />

          {/* Middle Column - Always rendered */}
          <div className="hidden md:flex h-full items-center">
            {showSearchBar && (
              <SearchBar
                defaultValue={searchValue}
                className="w-full max-w-3xl"
                inputClassName="py-0.5 px-2"
              />
            )}
          </div>

          {/* Profile Dropdown */}
          {user && (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
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
                  <DropdownMenuItem asChild>
                    <a href="/logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Search Bar - Mobile only */}
        {showSearchBar && (
          <div className="md:hidden pt-3">
            <SearchBar
              defaultValue={searchValue}
              className="w-full"
              inputClassName="py-0.5 px-2"
            />
          </div>
        )}
      </nav>
    </header>
  );
}
