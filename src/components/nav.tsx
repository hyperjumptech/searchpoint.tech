"use client";

import Image from "next/image";
import Link from "next/link";

import { useUserStore } from "@/stores/user";
import { User } from "@/types/user";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect } from "react";

export interface NavbarProps {
  user: User;
}

export default function Navbar(props: NavbarProps) {
  const { role, avatar } = props.user;
  const { user, fetchUser } = useUserStore();

  const initialName = user?.name
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .join("");

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full h-[64px] border-b border-[#E3E3E3] p-4 bg-white">
      <Link href="/">
        <Image
          className="h-8"
          src="/icons/sinarmas-logo.svg"
          alt="Sinarmas Logo"
          width={143}
          height={32}
        />
      </Link>

      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="font-bold text-[#30302F]">{user?.name}</div>
          <div className="text-xs text-[#909090]">{role}</div>
        </div>
        <Avatar>
          <AvatarImage src={avatar} alt={user?.name} />
          <AvatarFallback>{initialName}</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
