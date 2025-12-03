import "./globals.css";

import { Inter } from "next/font/google";

import { getMe } from "@/actions/me";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Secure Corporate Search Engine",
  description: "Secure Corporate Search Engine",
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

  return (
    <html lang="en" className={inter.className}>
      <body>
        <UserStoreInitializer user={me} />
        <Suspense>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
