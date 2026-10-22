"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import CompanyLogo from "@/components/company-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/company";
import { useLandingLanguage } from "./landing-language-provider";
import { LandingContainer } from "./landing-ui";

interface LandingHeaderProps {
  company?: Company;
}

export default function LandingHeader({ company }: LandingHeaderProps) {
  const { lang, setLang, t } = useLandingLanguage();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 1. Optimized scroll listener for frosted glass transition
  React.useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Close mobile menu on Escape key press
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // 3. Close mobile menu on outside click
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [mobileMenuOpen]);

  // 4. Auto-close mobile menu on desktop breakpoint (>= 1280px)
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  // 5. Body scroll lock when mobile menu is active with safe cleanup
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  const closeMenu = React.useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const navLinks = React.useMemo(
    () => [
      { href: "#desktop-search", label: t("nav.search") },
      { href: "#features", label: t("nav.features") },
      { href: "#architecture", label: t("nav.arch") },
      { href: "#manifesto", label: t("nav.security") },
      { href: "#faq", label: t("nav.faq") },
    ],
    [t],
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 pt-3 md:pt-4 transition-all duration-300">
      <LandingContainer className="relative">
        {/* Ambient frosted glass background activated on scroll */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-full theme-glass-nav transition-opacity duration-300 pointer-events-none",
            isScrolled ? "opacity-100" : "opacity-0",
          )}
        />

        <nav
          className="relative flex items-center justify-between h-[68px] px-3 sm:px-4"
          aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link
            href="/landing"
            onClick={closeMenu}
            aria-label="SearchPoint Home"
            className="shrink-0 flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full px-2 py-1">
            <CompanyLogo
              company={company}
              className="h-6 md:h-7 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links (xl+) */}
          <ul className="hidden xl:flex flex-1 items-center justify-center gap-6 2xl:gap-8 whitespace-nowrap px-4">
            {navLinks.map((link) => (
              <li key={link.href} className="shrink-0">
                <a
                  href={link.href}
                  className="header-nav-link whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right Controls: Desktop */}
          <div className="hidden xl:flex items-center gap-2.5 shrink-0">
            {/* Language Switcher Pills */}
            <div
              className="flex items-center rounded-full bg-muted/60 p-0.5 border border-border/80 text-[11px] font-semibold tracking-wide"
              role="group"
              aria-label={t("nav.language")}>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer",
                  lang === "en"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={lang === "en"}>
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("id")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer",
                  lang === "id"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={lang === "id"}>
                ID
              </button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle className="w-[35px] h-[35px] rounded-full" />

            {/* Get App Button */}
            <Button
              asChild
              variant="outline"
              className="rounded-full text-[13px] font-semibold h-[35px] px-4 border-border/80 hover:bg-muted/60 transition-all cursor-pointer">
              <a href="#download">{t("nav.get_app")}</a>
            </Button>

            {/* Sign In Button */}
            <Button
              asChild
              className="gradient-brand-btn rounded-full text-[13px] font-semibold h-[35px] px-4 cursor-pointer">
              <Link href="/login">{t("nav.sign_in")}</Link>
            </Button>
          </div>

          {/* Right Controls: Mobile / Tablet (< xl) */}
          <div className="flex xl:hidden items-center gap-2">
            <Button
              asChild
              className="gradient-brand-btn rounded-full text-[13px] font-semibold h-[35px] px-3.5 cursor-pointer">
              <Link href="/login">{t("nav.sign_in")}</Link>
            </Button>

            <ThemeToggle className="w-[35px] h-[35px] rounded-full" />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
              className="relative z-10 inline-flex items-center justify-center rounded-full w-[35px] h-[35px] border border-border/80 bg-card/60 text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Panel */}
        <div
          id="landing-mobile-menu"
          ref={menuRef}
          aria-hidden={!mobileMenuOpen}
          className={cn(
            "xl:hidden absolute inset-x-4 top-full mt-2 rounded-3xl p-3 no-scrollbar shadow-2xl border border-border/80 transition-all duration-300",
            "bg-background/95 dark:bg-card/95 backdrop-blur-2xl",
            mobileMenuOpen
              ? "is-open opacity-100 visible pointer-events-auto translate-y-0"
              : "opacity-0 invisible pointer-events-none -translate-y-2",
          )}>
          {/* Navigation Items */}
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="mobile-menu-item flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors">
                <span>{link.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-40" />
              </a>
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-2 flex flex-col gap-1.5 border-t border-border/60 pt-2.5">
            <a
              href="#download"
              onClick={closeMenu}
              className="mobile-menu-item flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-foreground/90 hover:bg-muted/60 transition-colors">
              <span>{t("nav.get_app")}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </a>

            {/* Language Selector Row */}
            <div className="mobile-menu-item flex items-center justify-between rounded-2xl px-4 py-2.5 bg-muted/30">
              <span className="text-sm font-medium text-foreground/80">
                {t("nav.language")}
              </span>
              <div
                className="flex items-center rounded-full bg-background p-0.5 border border-border/80 text-[11px] font-semibold"
                role="group"
                aria-label={t("nav.language")}>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={cn(
                    "px-3 py-1 rounded-full transition-all duration-200 cursor-pointer",
                    lang === "en"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("id")}
                  className={cn(
                    "px-3 py-1 rounded-full transition-all duration-200 cursor-pointer",
                    lang === "id"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  ID
                </button>
              </div>
            </div>
          </div>
        </div>
      </LandingContainer>
    </header>
  );
}
