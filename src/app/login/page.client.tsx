"use client";

import Image from "next/image";
import { useState } from "react";
import { Mail } from "lucide-react";

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

interface LoginClientProps {
  authUrl: string;
  enableMagicLink?: boolean;
}

export function LoginClient({
  authUrl,
  enableMagicLink = false,
}: LoginClientProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <>
      <section className="flex-1 w-full flex-col flex items-center justify-between py-16">
        <header>
          <Image src="/icons/logo.svg" alt="Sinarmas" width={143} height={32} />
        </header>
        <article
          className={`flex flex-col items-center justify-center space-y-4 p-8 text-center ${
            enableMagicLink ? "w-full max-w-md" : ""
          }`}>
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-bold px-4">SearchPoint</h1>
            <p className="text-sm text-muted-foreground">
              Secure Corporate Search Engine
            </p>
          </div>

          {!enableMagicLink ? (
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
            </div>
          ) : (
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
        </article>
        <footer className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} Sinar Mas. All Right Reserved.
        </footer>
      </section>

      <Dialog open={isLoading}>
        <DialogContent className="sm:max-w-md [&>button]:hidden flex flex-col items-center justify-between">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Authenticating</DialogTitle>
            </VisuallyHidden>
            <Image
              src="/icons/logo.svg"
              alt="Sinarmas"
              width={143}
              height={32}
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
    </>
  );
}
