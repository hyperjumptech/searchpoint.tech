import type { ReactNode } from "react";
import Image from "next/image";
import { headers } from "next/headers";
import NavbarLogo from "@/components/navbar-logo";
import { companyFromHostname } from "@/lib/company";

export default async function OAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const company = companyFromHostname(host);

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
      <section className="flex-1 w-full flex-col flex items-center justify-between py-16">
        <header>
          <NavbarLogo company={company} />
        </header>
        <article className="flex w-full max-w-md flex-col items-center justify-center space-y-4 p-8 text-center">
          {children}
        </article>
        <footer className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} Sinar Mas. All Right Reserved.
        </footer>
      </section>
    </main>
  );
}
