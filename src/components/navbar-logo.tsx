import Link from "next/link";
import Image from "next/image";

export default function NavbarLogo() {
  return (
    <Link href="/">
      <Image alt="Logo" src="/icons/logo.svg" width={143} height={32} />
    </Link>
  );
}
