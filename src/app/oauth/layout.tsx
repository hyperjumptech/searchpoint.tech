import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function OAuthLayout({ children }: { children: ReactNode }) {
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
          <Link
            href="/landing"
            aria-label="Go to landing page"
            className="transition-opacity hover:opacity-80">
            <Image
              src="/icons/logo.svg"
              alt="Sinarmas"
              width={143}
              height={32}
            />
          </Link>
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
