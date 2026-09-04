"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MagicClientProps = {
  state: string;
};

export function MagicClient({ state }: MagicClientProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/oauth/magic-ui/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, state }),
      });
      const j = (await r.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!j?.success) {
        setError(j?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSent(true);
      setSubmitting(false);
      const poll = async () => {
        try {
          const pr = await fetch(
            "/api/oauth/poll?state=" + encodeURIComponent(state),
          );
          const pj = (await pr.json()) as {
            status?: string;
            redirect?: string;
          } | null;
          if (pj?.status === "done" && pj.redirect) {
            window.location.href = pj.redirect;
            return;
          }
        } catch {
          // ignore poll errors, retry
        }
        setTimeout(poll, 3000);
      };
      poll();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-3 text-lg font-bold text-foreground">
            Sign in to SearchPoint
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent
              ? "Check your email for the magic link"
              : "Enter your email to receive a magic link"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={sent || submitting}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || sent}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sent ? (
              "Check your email"
            ) : (
              "Send magic link"
            )}
          </Button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        {sent && !error && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Didn’t get it? Check spam or try again in a few seconds.
          </p>
        )}
      </div>
    </main>
  );
}
