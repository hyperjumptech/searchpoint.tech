import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded shadow">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Login to Continue
        </h2>
        <Link href="https://api.scse.hyperjump.tech/v1/auth" passHref>
          <Button
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            variant="outline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <rect fill="#F35325" x="1" y="1" width="10" height="10" />
                <rect fill="#81BC06" x="13" y="1" width="10" height="10" />
                <rect fill="#05A6F0" x="1" y="13" width="10" height="10" />
                <rect fill="#FFBA08" x="13" y="13" width="10" height="10" />
              </g>
            </svg>
            Login with Microsoft
          </Button>
        </Link>
      </div>
    </div>
  );
}
