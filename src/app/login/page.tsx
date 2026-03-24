import Image from "next/image";

import { LoginClient } from "./page.client";
import { env } from "@/lib/env";

export default function Login() {
  const authUrl = env.BACKEND_BASE_URL
    ? `${env.BACKEND_BASE_URL}/v1/auth`
    : "https://api.searchpoint.hyperjump.tech/v1/auth";

  return (
    <main className="h-screen flex">
      <aside className="hidden md:flex md:flex-2 w-full relative">
        <Image
          fill={true}
          priority={true}
          alt="Sinarmas"
          src="/images/sml.jpeg"
          className="object-cover object-top"
        />
      </aside>
      <LoginClient authUrl={authUrl} />
    </main>
  );
}
