"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Company, companyFromHostname, getCompanyLogo } from "@/lib/company";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  company?: Company;
  className?: string;
  priority?: boolean;
}

export default function CompanyLogo({
  company: initialCompany,
  className,
  priority = false,
}: CompanyLogoProps) {
  const [company, setCompany] = useState<Company>(() => {
    if (initialCompany) return initialCompany;
    if (typeof window !== "undefined") {
      return companyFromHostname(
        window.location.href || window.location.hostname,
      );
    }
    return "hyperjump";
  });

  // A server-provided company is authoritative: the deployment is pinned to one
  // tenant via TENANT, which the client cannot see. Only sniff the hostname when
  // no tenant was passed down.
  useEffect(() => {
    if (initialCompany) return;
    if (typeof window !== "undefined") {
      const detected = companyFromHostname(
        window.location.href || window.location.hostname,
      );
      setCompany(detected);
    }
  }, [initialCompany]);

  const logo = getCompanyLogo(company);

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
