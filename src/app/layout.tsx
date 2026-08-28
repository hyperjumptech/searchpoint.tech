import "./globals.css";

import { Inter } from "next/font/google";

import { getMe } from "@/actions/me";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "SearchPoint",
  description: "SearchPoint - Secure Corporate Search Engine",
};

const inter = Inter({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "500", "700"],
});
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await getMe();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground relative">
        <UserStoreInitializer user={me} />
        {pathname === "/login" || pathname.startsWith("/docs/") ? null : (
          <Suspense>
            <Navbar />
          </Suspense>
        )}
        {children}
      </body>
    </html>
  );
}
