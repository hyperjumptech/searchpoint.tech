import Image from "next/image";
import { headers } from "next/headers";
import { LoginClient } from "./page.client";
import { env } from "@/lib/env";
import { resolveTenantId } from "@/lib/tenant";

export default async function Login() {
  const headersList = await headers();
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const company = resolveTenantId(env.TENANT, host);

  return (
    <main className="h-screen flex">
      <aside className="hidden md:flex md:flex-2 w-full relative">
        <Image
          fill={true}
          priority={true}
          alt="Sinarmas"
          src="/images/sml.jpeg"
          className="object-cover object-top"
        />
      </aside>
      <LoginClient
        authUrl={`${env.AUTH_BASE_URL}/v1/auth`}
        enableMagicLink={env.ENABLE_MAGIC_LINK}
        enableMicrosoftLogin={env.ENABLE_MICROSOFT_LOGIN}
        isDev={process.env.NODE_ENV !== "production"}
        company={company}
      />
    </main>
  );
}
