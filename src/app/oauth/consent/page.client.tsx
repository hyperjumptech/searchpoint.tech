"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { clientInitial } from "@/lib/mcp-client-logo";
import { describeScopes } from "@/lib/oauth-consent-ui";

type ConsentClientProps = {
  state: string;
  clientId: string;
  clientName?: string;
  scopes: string;
  userEmail: string;
  ttlDays: number;
  logoDataUrl: string | null;
  resourceName: string;
  tenantLogo: { src: string; alt: string };
  redirectUri: string;
};

function isLoopbackRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    if (url.protocol !== "http:") return false;
    return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function ConsentClient({
  state,
  clientId,
  clientName,
  scopes,
  userEmail,
  ttlDays,
  logoDataUrl,
  resourceName,
  tenantLogo,
  redirectUri,
}: ConsentClientProps) {
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { visible, unknown } = describeScopes(scopes);
  const displayName = clientName ?? clientId;
  const showLocalhostHint = isLoopbackRedirectUri(redirectUri);

  const handleDecision = async (deny: boolean) => {
    setSubmitting(deny ? "deny" : "allow");
    setError(null);
    try {
      const res = await fetch("/api/oauth/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state, deny }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(j?.error ?? "Something went wrong. Please try again.");
        setSubmitting(null);
        return;
      }
      const j = (await res.json()) as { redirect?: string } | null;
      if (j?.redirect) {
        window.location.href = j.redirect;
        return;
      }
      setError("Missing redirect from server.");
      setSubmitting(null);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(null);
    }
  };

  return (
    <>
      <div className="flex w-full items-center justify-center gap-2">
        {logoDataUrl ? (
          <img
            src={logoDataUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {clientInitial(displayName)}
          </div>
        )}
        <span className="text-muted-foreground">···</span>
        <img
          src={tenantLogo.src}
          alt={tenantLogo.alt}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
      </div>

      <div className="w-full space-y-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {displayName}
          </h2>
          <p className="text-sm text-muted-foreground">
            wants to access {resourceName} on behalf of {userEmail}
          </p>
        </div>

        {showLocalhostHint && (
          <p className="text-center text-sm text-muted-foreground">
            Make sure that you trust {displayName}. You may be sharing sensitive
            data with this site or app.
          </p>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            This will allow access to:
          </h3>
          <ul className="space-y-2">
            {visible.map((label) => (
              <li
                key={label}
                className="flex items-start gap-2 rounded-md border p-2.5 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{label}</span>
              </li>
            ))}
            {unknown.length > 0 && (
              <li className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-2.5 text-sm text-amber-700 dark:text-amber-300">
                <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Akses tambahan:{" "}
                  <span className="font-medium">{unknown.join(", ")}</span>
                </span>
              </li>
            )}
          </ul>
        </div>

        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleDecision(true)}
            disabled={submitting !== null}>
            Deny
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleDecision(false)}
            disabled={submitting !== null}>
            {submitting === "allow" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Allow"
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {displayName} can see your info for {ttlDays} days.
        </p>
      </div>

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
