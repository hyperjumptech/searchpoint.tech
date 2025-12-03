"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = "https://api.scse.hyperjump.tech/v1/auth";
    }, 2000);
  };

  return (
    <main className="h-screen flex">
      <aside className="hidden md:flex md:flex-1 w-full relative">
        <Image
          fill={true}
          priority={true}
          alt="Sinarmas"
          src="/images/sml.jpeg"
          className="object-cover"
          sizes="(max-width: 768px) 0vw, 50vw"
        />
      </aside>
      <section className="flex-1 w-full flex-col flex items-center justify-between py-6">
        <header>
          <Image src="/icons/logo.svg" alt="Sinarmas" width={143} height={32} />
        </header>
        <article className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Secure Corporate Search Engine</h1>
          <Button
            onClick={handleLogin}
            className="rounded-full space-x-2 w-full">
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
            <Spinner className="h-16 w-16 text-primary" />
            <p className="text-xl font-bold">
              Setting up your secure session...
            </p>
            <p className="text-xs text-muted-foreground">
              {"We're validating your identity and loading your file access."}
            </p>
          </div>
          <DialogFooter>
            <p className="text-xs text-secondary-foreground">
              Copyright © 2025 Sinar Mas. All Right Reserved.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
