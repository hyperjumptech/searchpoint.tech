"use client";

import * as React from "react";
import Link from "next/link";
import CompanyLogo from "@/components/company-logo";
import { LandingContainer } from "./landing-ui";
import { useLandingLanguage } from "./landing-language-provider";
import { COMPANY_LOGOS, type Company } from "@/lib/company";
import type { TenantContent } from "@/lib/tenant";

interface LandingFooterProps {
  company?: Company;
  content?: TenantContent;
}

export default function LandingFooter({
  company,
  content,
}: LandingFooterProps) {
  const { t } = useLandingLanguage();

  const companyName = company
    ? COMPANY_LOGOS[company]?.alt || company
    : "Hyperjump";
  const brandName = content?.legalName || companyName;
  const copyrightText = `© ${new Date().getFullYear()} ${brandName}`;

  const navLinks = [
    { href: "#desktop-search", label: t("nav.search") },
    { href: "#features", label: t("nav.features") },
    { href: "#architecture", label: t("nav.arch") },
    { href: "#manifesto", label: t("nav.security") },
    { href: "#faq", label: t("nav.faq") },
    { href: "#download", label: t("nav.download") },
  ];

  return (
    <footer className="site-footer w-full border-t border-border/40 bg-card/40">
      <LandingContainer className="footer-main">
        {/* Brand identity block */}
        <div className="footer-brand-block">
          <div className="flex items-center gap-2.5">
            <CompanyLogo
              company={company}
              className="header-logo-img h-5 w-auto opacity-90 object-contain"
            />
          </div>
          <p className="footer-copy text-xs font-light text-muted-foreground/70">
            {copyrightText}
          </p>
        </div>

        {/* Semantic footer navigation */}
        <nav
          aria-label="Footer Navigation"
          className="footer-nav text-xs font-light text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </LandingContainer>
    </footer>
  );
}
