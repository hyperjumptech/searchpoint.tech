"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import CategoryTabs from "./category-tabs";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const showSearchBar = pathname === "/search";

  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";

  const { user, logOut } = useUserStore();

  const navbarHeightClass = showSearchBar ? "md:h-32" : "md:h-16";

  return (
    <header className="relative z-50 border-b border-border bg-background text-foreground">
      <nav className={`mx-auto px-4 py-3 ${navbarHeightClass} md:py-0`}>
        <div className="flex items-start py-4 justify-between md:grid md:grid-cols-[160px_1fr_80px] md:gap-4 md:h-full">
          <NavbarLogo />

          {/* Middle Column - Always rendered */}
          <div className="hidden md:flex h-full items-center">
            {showSearchBar && (
              <div className="flex flex-col w-full gap-4">
                <SearchBar
                  defaultValue={searchValue}
                  className="max-w-4xl"
                  inputClassName="py-0.5 px-2"
                />
                <CategoryTabs />
              </div>
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
                  <DropdownMenuItem
                    onClick={async () => {
                      await logOut();
                      router.push("/login");
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
          <div className="md:hidden pt-3">
            <SearchBar
              defaultValue={searchValue}
              className="w-full"
              inputClassName="py-0.5 px-2"
            />
          </div>
        )}

        {showSearchBar && (
          <div className="md:hidden mt-3 overflow-x-auto scrollbar-hide relative z-50">
            <div className="flex gap-2 whitespace-nowrap">
              <CategoryTabs />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
