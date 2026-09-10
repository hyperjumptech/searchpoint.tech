import Link from "next/link";
import CompanyLogo from "@/components/company-logo";
import type { Company } from "@/lib/company";

export default function NavbarLogo({ company }: { company?: Company } = {}) {
  return (
    <Link href="/landing" className="flex items-center lg:min-w-32">
      <CompanyLogo
        company={company}
        priority={true}
        className="h-8 w-auto object-contain"
      />
    </Link>
  );
}
