"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnlockingAnimation } from "@/components/ui/unlocking-animation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface LoginClientProps {
  authUrl: string;
}

export function LoginClient({ authUrl }: LoginClientProps) {
  const [isLoading, setIsLoading] = useState(false);

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
        <article className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-bold px-4">SearchPoint</h1>
            <p className="text-sm text-muted-foreground">
              Secure Corporate Search Engine
            </p>
          </div>

          <Button
            onClick={handleLogin}
            className="rounded-full space-x-2 w-full py-6">
            <Image
              src="/images/microsoft-logo.svg"
              alt="Microsoft"
              width={25}
              height={25}
            />
            <span>Log in with Microsoft Account</span>
          </Button>
          <div className="text-sm flex space-x-1">
            <p className="text-muted-foreground">Having trouble logging in?</p>
            <a
              href="mailto:searchpoint@hyperjump.tech"
              className="text-primary font-medium">
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
