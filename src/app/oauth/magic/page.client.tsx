"use client";

import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

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
    <>
      <div className="space-y-1 text-center">
        <h1 className="px-4 text-lg font-bold md:text-xl">SearchPoint</h1>
        <p className="text-sm text-muted-foreground">
          Secure Corporate Search Engine
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
        <div className="space-y-1.5">
          <label htmlFor="oauth-magic-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="oauth-magic-email"
            type="text"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={sent || submitting}
            className="w-full"
          />
        </div>

        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-full py-6 text-base font-semibold"
          disabled={submitting || sent || !email.trim()}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : sent ? (
            "Check your email"
          ) : (
            "Send sign-in link"
          )}
        </Button>
      </form>

      {sent && !error && (
        <p className="text-center text-sm text-muted-foreground">
          Check your email for the magic link.
        </p>
      )}

      <div className="flex space-x-1 pt-2 text-sm">
        <p className="text-muted-foreground">Having trouble logging in?</p>
        <a
          href="mailto:searchpoint@hyperjump.tech"
          className="font-medium text-primary hover:underline">
          Contact admin
        </a>
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
