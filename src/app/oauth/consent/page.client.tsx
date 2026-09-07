"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { describeScopes } from "@/lib/oauth-consent-ui";

type ConsentClientProps = {
  state: string;
  clientId: string;
  scopes: string;
  userEmail: string;
  ttlDays: number;
};

export function ConsentClient({
  state,
  clientId,
  scopes,
  userEmail,
  ttlDays,
}: ConsentClientProps) {
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { visible, unknown } = describeScopes(scopes);

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
      <div className="space-y-1 text-center">
        <h1 className="px-4 text-lg font-bold md:text-xl">SearchPoint</h1>
        <p className="text-sm text-muted-foreground">
          Secure Corporate Search Engine
        </p>
      </div>

      <div className=" w-full space-y-2">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg text-foreground">
            <span className="font-semibold">{clientId}</span> wants to access
            your account
          </h2>
        </div>

        <div className="space-y-2 flex items-center justify-center w-full">
          <div className="rounded-lg bg-muted/50 w-max px-4 py-2 text-center">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{userEmail}</span>
            </p>
          </div>
        </div>

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
          {clientId} can see your info for {ttlDays} days.
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
