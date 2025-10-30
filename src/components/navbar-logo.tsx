import Link from "next/link";
import Image from "next/image";

export default function NavbarLogo() {
  return (
    <Link href="/">
      <Image
        width={143}
        height={32}
        priority={true}
        alt="Logo"
        src="/icons/logo.svg"
      />
    </Link>
  );
}
