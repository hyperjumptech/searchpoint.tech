import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ConsentClient } from "./page.client";
import { env } from "@/lib/env";
import { getStaticClient } from "@/lib/oauth-static-client";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";
import { getTenantConfig, resolveTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type StateData = {
  client_id: string;
  client_name?: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource?: string;
  email?: string;
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  if (!state) {
    return <ConsentError message="Missing consent state." />;
  }

  const stateData = await getJSON<StateData>(oauthKeys.state(state));
  if (!stateData) {
    return (
      <ConsentError message="Consent state is invalid or expired. Please try again." />
    );
  }
  if (!stateData.email) {
    return (
      <ConsentError message="Unable to identify the account. Please try again." />
    );
  }

  const ttlDays = Math.round((30 * 24 * 3600) / 86400);
  const client = await getStaticClient(stateData.client_id);
  const headersList = await headers();
  const host =
    headersList.get("x-hostname") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "";
  const tenant = getTenantConfig(
    resolveTenantId(env.TENANT, host),
    env.APP_NAME,
  );

  return (
    <ConsentClient
      state={state}
      clientId={stateData.client_id}
      clientName={stateData.client_name}
      scopes={stateData.scope}
      userEmail={stateData.email}
      ttlDays={ttlDays}
      logoDataUrl={client?.logoDataUrl ?? null}
      resourceName={tenant.content.productName}
      tenantLogo={{ src: tenant.logo.src, alt: tenant.logo.alt }}
      redirectUri={stateData.redirect_uri}
    />
  );
}

function ConsentError({ message }: { message: string }) {
  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="px-4 text-lg font-bold md:text-xl">SearchPoint</h1>
        <p className="text-sm text-muted-foreground">
          Secure Corporate Search Engine
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="pt-2">
        <Link
          href="/landing"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to home</span>
        </Link>
      </div>
    </>
  );
}
