import { ConsentClient } from "./page.client";
import { clientLabel } from "@/lib/oauth-consent";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

export const dynamic = "force-dynamic";

type StateData = {
  client_id: string;
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

  return (
    <ConsentClient
      state={state}
      clientId={stateData.client_id}
      clientLabel={clientLabel()}
      scopes={stateData.scope}
      userEmail={stateData.email}
      ttlDays={ttlDays}
    />
  );
}

function ConsentError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-foreground">
          Consent unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
