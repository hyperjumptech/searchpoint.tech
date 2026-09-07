import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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
