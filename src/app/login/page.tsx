import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Link href="https://api.scse.hyperjump.tech/v1/auth">
        <Button>Login</Button>
      </Link>
    </div>
  );
}
