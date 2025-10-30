import Navbar from "@/components/navbar";
import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UserStoreInitializer } from "@/stores/UserStoreInitializer";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Secure Corporate Search Engine",
  description: "Secure Corporate Search Engine",
};

const inter = Inter({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const scseId = cookieStore.get("SCSE_ID")?.value;

  return (
    <html lang="en" className={inter.className}>
      <body>
        <UserStoreInitializer scseId={scseId} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
