"use client";

import Image from "next/image";
import Link from "next/link";
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

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = "https://api.scse.hyperjump.tech/v1/auth";
    }, 1200);
  };

  return (
    <main className="h-screen flex">
      <aside className="hidden md:flex md:flex-2 w-full relative">
        <Image
          fill={true}
          priority={true}
          alt="Sinarmas"
          src="/images/sml.jpeg"
          className="object-cover object-top"
        />
      </aside>
      <section className="flex-1 w-full flex-col flex items-center justify-between py-16">
        <header>
          <Image src="/icons/logo.svg" alt="Sinarmas" width={143} height={32} />
        </header>
        <article className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <h1 className="text-lg md:text-xl font-bold px-4">
            Secure Corporate Search Engine
          </h1>
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
            <Link
              href="mailto:ferdi@hyperjump.tech"
              className="text-primary font-medium">
              Contact admin
            </Link>
          </div>
        </article>
        <footer className="text-xs text-muted-foreground">
          Copyright © 2025 Sinar Mas. All Right Reserved.
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
    </main>
  );
}
