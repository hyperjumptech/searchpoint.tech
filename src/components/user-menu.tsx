import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { User } from "@/types/user";
import { useUserStore } from "@/stores/user";

export function UserMenu({ user }: { user: User | null }) {
  const { logout } = useUserStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer select-none">
          <div className="text-right">
            <div className="font-bold text-[#30302F]">{user?.name}</div>
            <div className="text-xs text-[#909090]">{user?.upn}</div>
          </div>
          <Avatar className="aspect-square h-12 w-12">
            <AvatarFallback>
              {user?.name?.substring(0, 1) || "O"}
            </AvatarFallback>
            <AvatarImage src={user?.avatar} alt={user?.name} />
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
