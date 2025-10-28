"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useUserStore } from "@/stores/user";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";

export function UserMenu({ user }: { user: User | null }) {
  const router = useRouter();
  const { logout } = useUserStore();

  const handleLogout = async () => {
    try {
      logout();

      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer select-none">
          <div className="text-right">
            <div className="font-semibold text-[#30302F]">{user.name}</div>
            <div className="text-xs text-[#909090]">{user.upn}</div>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
