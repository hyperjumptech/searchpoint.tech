import Link from "next/link";
import Image from "next/image";

export default function NavbarLogo() {
  return (
    <Link href="/landing" className="flex items-center lg:min-w-32">
      <Image
        width={128}
        height={32}
        priority={true}
        alt="Logo"
        src="/icons/logo.svg"
        className="w-32 h-auto"
      />
    </Link>
  );
}
