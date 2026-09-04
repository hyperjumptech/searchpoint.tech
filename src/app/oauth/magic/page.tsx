import { MagicClient } from "./page.client";
import { getJSON, oauthKeys } from "@/lib/oauth-valkey";

export const dynamic = "force-dynamic";

type StateData = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string;
  resource?: string;
};

export default async function MagicPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  if (!state) {
    return <MagicError message="Missing magic state." />;
  }

  const stateData = await getJSON<StateData>(oauthKeys.state(state));
  if (!stateData) {
    return (
      <MagicError message="Magic state is invalid or expired. Please try again." />
    );
  }

  return <MagicClient state={state} />;
}

function MagicError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-foreground">
          Sign in unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
