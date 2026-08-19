"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Building2, ShieldCheck, ShieldAlert, Info } from "lucide-react";

export interface MicrosoftLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: () => void;
}

export type MicrosoftLoginModalStep =
  | "account_type"
  | "org_type"
  | "admin_check"
  | "admin_notice"
  | "non_admin_blocked";

export type MicrosoftAccountType = "personal" | "work_school";
export type MicrosoftOrgType = "hyperjump_smdv" | "sinarmas";

/**
 * Multi-step wizard shown before signing in with Microsoft.
 * 1. Account type selection (Personal vs Work/School)
 * 2. Organization selection (Hyperjump/SMDV vs Sinar Mas)
 * 3. Admin check / verification for Sinar Mas
 * 4. Admin instructions or Non-admin notice
 */
export function MicrosoftLoginModal({
  open,
  onOpenChange,
  onContinue,
}: MicrosoftLoginModalProps) {
  const [step, setStep] = useState<MicrosoftLoginModalStep>("account_type");
  const [accountType, setAccountType] = useState<MicrosoftAccountType | null>(
    null,
  );
  const [orgType, setOrgType] = useState<MicrosoftOrgType | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!open) {
      setStep("account_type");
      setAccountType(null);
      setOrgType(null);
      setIsAdmin(null);
    }
  }, [open]);

  const handleAccountTypeNext = () => {
    if (!accountType) return;

    if (accountType === "personal") {
      onOpenChange(false);
      onContinue?.();
      return;
    }

    setStep("org_type");
  };

  const handleOrgTypeNext = () => {
    if (!orgType) return;

    if (orgType === "hyperjump_smdv") {
      // Hyperjump & SMDV have pre-approved tenant-wide admin consent
      onOpenChange(false);
      onContinue?.();
      return;
    }

    // Sinar Mas requires admin check
    setStep("admin_check");
  };

  const handleAdminCheckNext = () => {
    if (isAdmin === null) return;
    if (isAdmin) {
      setStep("admin_notice");
    } else {
      setStep("non_admin_blocked");
    }
  };

  const handleAdminConsentContinue = () => {
    onOpenChange(false);
    onContinue?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {step === "account_type" && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0078d4]/10 dark:bg-[#0078d4]/20">
                  <Image
                    src="/images/microsoft-logo.svg"
                    alt=""
                    aria-hidden
                    width={20}
                    height={20}
                    className="shrink-0"
                  />
                </div>
                <DialogTitle>Select Microsoft Account Type</DialogTitle>
              </div>
              <DialogDescription>
                Choose whether you are signing in with a personal Microsoft
                account or an organization account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 py-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAccountType("personal")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setAccountType("personal");
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  accountType === "personal"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Personal Account
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Personal Microsoft account (@outlook.com, @hotmail.com, or
                    personal account).
                  </div>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setAccountType("work_school")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setAccountType("work_school");
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  accountType === "work_school"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Work or School Account
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Organization account provided by your company, university,
                    or school.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAccountTypeNext}
                disabled={!accountType}
                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </>
        )}

        {step === "org_type" && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0078d4]/10 dark:bg-[#0078d4]/20">
                  <Image
                    src="/images/microsoft-logo.svg"
                    alt=""
                    aria-hidden
                    width={20}
                    height={20}
                    className="shrink-0"
                  />
                </div>
                <DialogTitle>Select Your Organization</DialogTitle>
              </div>
              <DialogDescription>
                Which organization does your work or school account belong to?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 py-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOrgType("hyperjump_smdv")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setOrgType("hyperjump_smdv");
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  orgType === "hyperjump_smdv"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Hyperjump / SMDV
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Hyperjump Technology or SMDV account (@hyperjump.tech,
                    @smdv.com).
                  </div>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setOrgType("sinarmas")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setOrgType("sinarmas");
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  orgType === "sinarmas"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Sinar Mas
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Sinar Mas Group account or other affiliated companies.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("account_type")}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Back
              </button>
              <button
                type="button"
                onClick={handleOrgTypeNext}
                disabled={!orgType}
                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </>
        )}

        {step === "admin_check" && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <ShieldCheck size={22} />
                </div>
                <DialogTitle>Organization Admin Check</DialogTitle>
              </div>
              <DialogDescription>
                Work or school accounts require administrator consent before
                members can sign in with Microsoft.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 py-1">
              <div className="text-xs font-medium text-foreground mb-1">
                Are you an administrator of your organization?
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsAdmin(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsAdmin(true);
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  isAdmin === true
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Yes, I am an admin
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    I have administrator permissions to grant consent on behalf
                    of the organization.
                  </div>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsAdmin(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsAdmin(false);
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  isAdmin === false
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    No, I am not an admin
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    I am a team member without administrator permissions.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("org_type")}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Back
              </button>
              <button
                type="button"
                onClick={handleAdminCheckNext}
                disabled={isAdmin === null}
                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </>
        )}

        {step === "admin_notice" && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <ShieldCheck size={22} />
                </div>
                <DialogTitle>Grant Organization Consent</DialogTitle>
              </div>
              <DialogDescription>
                A Microsoft login page will appear in your browser.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
                <div className="flex gap-2.5">
                  <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs leading-relaxed text-foreground">
                    <span className="font-semibold block mb-1">
                      Important Admin Step:
                    </span>
                    When the Microsoft consent prompt appears, please check the
                    box for{" "}
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                      &quot;Consent on behalf of your organization&quot;
                    </strong>{" "}
                    so members of your organization can sign in to SearchPoint.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("admin_check")}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Back
              </button>
              <button
                type="button"
                onClick={handleAdminConsentContinue}
                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Continue to Microsoft
              </button>
            </div>
          </>
        )}

        {step === "non_admin_blocked" && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <ShieldAlert size={22} />
                </div>
                <DialogTitle>Admin Consent Required</DialogTitle>
              </div>
              <DialogDescription>
                Cannot sign in with Microsoft at this moment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-sm text-muted-foreground">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-xs leading-relaxed text-foreground">
                  Your organization requires an IT administrator to sign in and
                  grant consent first before members can log in with their
                  Microsoft accounts.
                </p>
              </div>
              <p className="text-xs leading-relaxed pl-1">
                Please ask your organization&apos;s administrator to log in to
                SearchPoint to enable access for your team.
              </p>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("admin_check")}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Back
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Close
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
