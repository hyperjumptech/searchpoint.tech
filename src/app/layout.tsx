import "./globals.css";

import { Inter } from "next/font/google";

import { getUserFromToken } from "@/actions/token";
import Navbar from "@/components/navbar";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Corporate Search Engine",
  description: "Secure Corporate Search Engine",
};

const inter = Inter({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "500"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromToken();

  return (
    <html lang="en" className={inter.className}>
      <body>
        <UserStoreInitializer user={user} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
