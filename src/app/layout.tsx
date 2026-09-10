import "./globals.css";

import { Inter } from "next/font/google";

import { getMe } from "@/actions/me";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import CompanyFavicon from "@/components/company-favicon";
import { headers } from "next/headers";
import { companyFromHostname, getCompanyFavicon } from "@/lib/company";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const company = companyFromHostname(host);
  const favicon = getCompanyFavicon(company);

  return {
    title: "SearchPoint",
    description: "SearchPoint - Secure Corporate Search Engine",
    icons: {
      icon: [
        { url: favicon.ico, type: "image/x-icon" },
        { url: favicon.png, type: "image/png" },
      ],
      apple: favicon.png,
    },
  };
}

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
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const company = companyFromHostname(host);

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground relative">
        <UserStoreInitializer user={me} />
        <CompanyFavicon company={company} />
        {pathname === "/login" ||
        pathname.startsWith("/docs/") ||
        pathname.startsWith("/oauth/") ? null : (
          <Suspense>
            <Navbar company={company} />
          </Suspense>
        )}
        {children}
      </body>
    </html>
  );
}
