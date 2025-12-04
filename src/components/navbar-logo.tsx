import Link from "next/link";
import Image from "next/image";

export default function NavbarLogo() {
  return (
    <Link href="/" className="flex lg:min-w-32">
      <Image
        width={128}
        height={32}
        priority={true}
        alt="Logo"
        src="/icons/logo.svg"
        className="w-32 h-auto mt-2.5"
      />
    </Link>
  );
}
