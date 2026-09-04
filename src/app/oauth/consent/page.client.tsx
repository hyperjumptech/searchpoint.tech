"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { describeScopes } from "@/lib/oauth-consent-ui";

type ConsentClientProps = {
  state: string;
  clientId: string;
  clientLabel: string;
  scopes: string;
  userEmail: string;
  ttlDays: number;
};

export function ConsentClient({
  state,
  clientId,
  clientLabel,
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="mt-3 text-lg font-bold text-foreground">
            Izinkan akses?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{clientLabel}</p>
          <p className="text-xs text-muted-foreground">{clientId}</p>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-sm text-foreground">
            Masuk sebagai <span className="font-semibold">{userEmail}</span>
          </p>
        </div>

        <ul className="mt-4 space-y-2">
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
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleDecision(true)}
            disabled={submitting !== null}>
            Tolak
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleDecision(false)}
            disabled={submitting !== null}>
            {submitting === "allow" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Izinkan"
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {ttlDays} hari · {clientLabel} dapat melihat info ini selama kamu
          login
        </p>
      </div>
    </main>
  );
}
