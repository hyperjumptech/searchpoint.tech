"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";

import NavbarLogo from "@/components/navbar-logo";
import CompanyLogo from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UnlockingAnimation } from "@/components/ui/unlocking-animation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMagicLink } from "@/hooks/use-magic-link";
import { resolveMagicLinkUrl } from "@/actions/resolve-magic-link";
import { companyFromHostname, type Company } from "@/lib/company";
import { getTenantConfig } from "@/lib/tenant";

interface LoginClientProps {
  authUrl: string;
  enableMagicLink?: boolean;
  enableMicrosoftLogin?: boolean;
  isDev?: boolean;
  company?: Company;
}

export function LoginClient({
  authUrl,
  enableMagicLink = true,
  enableMicrosoftLogin = false,
  isDev = false,
  company: initialCompany,
}: LoginClientProps) {
  const [company, setCompany] = useState<Company>(() => {
    if (initialCompany) return initialCompany;
    if (typeof window !== "undefined") {
      return companyFromHostname(
        window.location.href || window.location.hostname,
      );
    }
    return "hyperjump";
  });

  // A server-provided company is authoritative: the deployment is pinned to one
  // tenant via TENANT, which the client cannot see. Only sniff the hostname when
  // no tenant was passed down.
  useEffect(() => {
    if (initialCompany) return;
    if (typeof window !== "undefined") {
      setCompany(
        companyFromHostname(window.location.href || window.location.hostname),
      );
    }
  }, [initialCompany]);

  const [isLoading, setIsLoading] = useState(false);

  const [showDevModal, setShowDevModal] = useState(false);
  const [devCallbackUrl, setDevCallbackUrl] = useState("");
  const [devError, setDevError] = useState("");
  const [isResolvingDevLink, setIsResolvingDevLink] = useState(false);

  const showMicrosoftLogin = enableMicrosoftLogin;
  const isMagicLinkEnabled = enableMagicLink;

  const {
    magicLinkEmail,
    setMagicLinkEmail,
    isMagicLinkSubmitted,
    isSendingMagicLink,
    magicLinkError,
    setMagicLinkError,
    handleSendMagicLink,
    handleUseDifferentEmail,
  } = useMagicLink();

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = authUrl;
    }, 1200);
  };

  const handleManualDevCallback = async () => {
    if (!devCallbackUrl.trim()) {
      setDevError("Please enter a callback or magic link URL.");
      return;
    }
    setIsResolvingDevLink(true);
    setDevError("");

    try {
      const res = await resolveMagicLinkUrl(devCallbackUrl);
      if (res.success) {
        setShowDevModal(false);
        setIsLoading(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setDevError(res.error || "Failed to resolve authentication link.");
      }
    } catch (err) {
      setDevError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsResolvingDevLink(false);
    }
  };

  return (
    <>
      <section className="flex-1 w-full flex-col flex items-center justify-between py-16">
        <header>
          <NavbarLogo company={company} />
        </header>
        <article
          className={`flex flex-col items-center justify-center space-y-4 p-8 text-center ${
            isMagicLinkEnabled ? "w-full max-w-md" : ""
          }`}>
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-bold px-4">SearchPoint</h1>
            <p className="text-sm text-muted-foreground">
              Secure Corporate Search Engine
            </p>
          </div>

          {!isMagicLinkEnabled ? (
            <>
              {showMicrosoftLogin && (
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="rounded-full space-x-2 w-full py-6">
                  <Image
                    src="/images/microsoft-logo.svg"
                    alt="Microsoft"
                    width={25}
                    height={25}
                  />
                  <span>Log in with Microsoft Account</span>
                </Button>
              )}

              {showMicrosoftLogin && (
                <>
                  <div className="relative my-2 w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Authentication
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Single sign-on via Microsoft Entra ID.
                    </p>
                    <p className="text-xs font-normal leading-relaxed text-muted-foreground">
                      Your organization controls access. No separate password
                      required.
                    </p>
                  </div>
                </>
              )}
            </>
          ) : isMagicLinkSubmitted ? (
            <div className="mt-4 mb-6 flex w-full flex-col items-center text-center">
              <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-xs dark:border-blue-800 dark:bg-blue-950/50">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  Check your email. We sent a sign-in link to{" "}
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    {magicLinkEmail.trim()}
                  </span>
                  . You will receive a message if your domain is on the allow
                  list.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseDifferentEmail}
                className="mt-6 cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Use a different email
              </button>
              {isDev && (
                <button
                  type="button"
                  onClick={() => {
                    setDevError("");
                    setDevCallbackUrl("");
                    setShowDevModal(true);
                  }}
                  className="mt-4 cursor-pointer text-xs text-muted-foreground underline hover:text-foreground">
                  Dev Mode: Paste Callback URL
                </button>
              )}
            </div>
          ) : (
            <>
              {showMicrosoftLogin && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleLogin}
                    disabled={isLoading || isSendingMagicLink}
                    className="w-full rounded-full py-6 space-x-2 text-base font-semibold">
                    <Image
                      src="/images/microsoft-logo.svg"
                      alt="Microsoft"
                      width={25}
                      height={25}
                    />
                    <span>Log in with Microsoft Account</span>
                  </Button>

                  <div className="relative my-2 w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-xs font-medium text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>
                </>
              )}

              <form
                onSubmit={handleSendMagicLink}
                className="w-full space-y-4 text-left">
                <div className="space-y-1.5">
                  <label
                    htmlFor="magic-link-email"
                    className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="magic-link-email"
                    type="text"
                    value={magicLinkEmail}
                    onChange={(e) => {
                      setMagicLinkEmail(e.target.value);
                      if (magicLinkError) setMagicLinkError("");
                    }}
                    placeholder="name@example.com"
                    disabled={isSendingMagicLink || isLoading}
                    className="w-full"
                  />
                </div>

                {magicLinkError && (
                  <p
                    role="alert"
                    className="text-center text-sm text-destructive">
                    {magicLinkError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={
                    !magicLinkEmail.trim() || isSendingMagicLink || isLoading
                  }
                  className="w-full rounded-full py-6 text-base font-semibold">
                  {isSendingMagicLink ? "Sending..." : "Send sign-in link"}
                </Button>
              </form>

              {showMicrosoftLogin && (
                <>
                  <div className="relative my-2 w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Authentication
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Single sign-on via Microsoft Entra ID.
                    </p>
                    <p className="text-xs font-normal leading-relaxed text-muted-foreground">
                      Your organization controls access. No separate password
                      required.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <div className="text-sm flex space-x-1 pt-2">
            <p className="text-muted-foreground">Having trouble logging in?</p>
            <a
              href="mailto:searchpoint@hyperjump.tech"
              className="text-primary font-medium hover:underline">
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
        </article>
        <footer className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()}{" "}
          {getTenantConfig(company).content.legalName}. All Rights Reserved.
        </footer>
      </section>

      <Dialog open={isLoading}>
        <DialogContent className="sm:max-w-md [&>button]:hidden flex flex-col items-center justify-between">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Authenticating</DialogTitle>
            </VisuallyHidden>
            <CompanyLogo
              company={company}
              className="h-8 w-auto object-contain"
            />
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4 my-8">
            <UnlockingAnimation className="h-16 w-16 text-primary" />
            <p className="text-xl font-bold">
              Setting up your secure session...
            </p>
            <p className="text-xs text-muted-foreground">
              {"We're validating your identity and loading your access."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDevModal} onOpenChange={setShowDevModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dev Mode: Paste Callback URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-left">
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs leading-relaxed dark:border-blue-800 dark:bg-blue-950/40">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Instructions:
              </p>
              <ol className="list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
                <li>
                  Check your email inbox (or Mailpit at http://localhost:8025)
                </li>
                <li>
                  Copy the &quot;Sign in&quot; link from the email or the
                  redirect URL
                </li>
                <li>
                  The URL should look like:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                    https://.../v1/auth/magic-link/redirect?token=...
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                    searchpoint://auth/callback?session=...
                  </code>
                </li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="dev-callback-url"
                className="text-xs font-medium text-foreground">
                Callback / Redirect URL
              </label>
              <textarea
                id="dev-callback-url"
                value={devCallbackUrl}
                onChange={(e) => {
                  setDevCallbackUrl(e.target.value);
                  if (devError) setDevError("");
                }}
                placeholder="https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=... or searchpoint://auth/callback?session=..."
                className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              />
            </div>

            {devError && (
              <p role="alert" className="text-xs text-destructive">
                {devError}
              </p>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDevModal(false)}
                disabled={isResolvingDevLink}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleManualDevCallback}
                disabled={!devCallbackUrl.trim() || isResolvingDevLink}>
                {isResolvingDevLink ? "Resolving..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
