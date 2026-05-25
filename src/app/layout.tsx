import "./globals.css";

import { Inter } from "next/font/google";

import { getMe } from "@/actions/me";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import { headers } from "next/headers";

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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative">
        <div
          className={`fixed inset-0 -z-10 transition-opacity duration-500 ${pathname === "/" ? "opacity-100" : "opacity-0"}`}
          style={{
            background: `
              radial-gradient(ellipse at 20% 20%, oklch(0.92 0.08 22) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 60%, oklch(0.95 0.05 30) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 90%, oklch(0.97 0.03 25) 0%, transparent 50%),
              oklch(0.995 0.005 27)
            `,
          }}
        />
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
