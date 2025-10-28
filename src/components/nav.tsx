"use client";

import Image from "next/image";
import Link from "next/link";

import { useUserStore } from "@/stores/user";
import { UserMenu } from "./user-menu";
import { User } from "@/types/user";

export default function Navbar() {
  const { user } = useUserStore();

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

      <UserMenu user={user as User} />
    </nav>
  );
}
