import "./globals.css";

import { Inter } from "next/font/google";

import { getMe } from "@/actions/me";
import { UserStoreInitializer } from "@/stores/user";

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import CompanyFavicon from "@/components/company-favicon";
import { headers } from "next/headers";
import { getCompanyFavicon } from "@/lib/company";
import { env } from "@/lib/env";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";
import { ThemeProvider } from "@/components/theme-provider";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const tenant = getTenantConfig(
    resolveTenantId(env.TENANT, host),
    env.APP_NAME,
  );
  const favicon = getCompanyFavicon(tenant.id);

  return {
    title: tenant.content.meta.title,
    description: tenant.content.meta.description,
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
  const tenant = resolveTenantId(env.TENANT, host);

  return (
    <html
      lang="en"
      data-tenant={tenant}
      className={inter.className}
      suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground relative transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <UserStoreInitializer user={me} />
          <CompanyFavicon company={tenant} />
          {pathname === "/login" ||
          pathname.startsWith("/docs/") ||
          pathname.startsWith("/changelog") ||
          pathname.startsWith("/oauth/") ? null : (
            <Suspense>
              <Navbar company={tenant} />
            </Suspense>
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
