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

// Static export (GitHub Pages) has no request: no headers(), no session.
// Tenant falls back to TENANT env / default, user is anonymous.
const isStaticExport = process.env.STATIC_EXPORT === "1";

async function requestHost(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    ""
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const host = isStaticExport ? "" : await requestHost();
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
  const me = isStaticExport ? null : await getMe();
  // In static export the Navbar hides itself client-side via usePathname().
  const pathname = isStaticExport
    ? ""
    : (await headers()).get("x-pathname") || "";
  const host = isStaticExport ? "" : await requestHost();
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
          pathname === "/landing" ||
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
