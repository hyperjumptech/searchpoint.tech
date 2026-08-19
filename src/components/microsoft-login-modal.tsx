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
import { User, Building2 } from "lucide-react";

export interface MicrosoftLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: () => void;
}

export type MicrosoftAccountType = "personal" | "work_school";

/**
 * Wizard shown before signing in with Microsoft.
 * Account type selection (Personal vs Work/School).
 */
export function MicrosoftLoginModal({
  open,
  onOpenChange,
  onContinue,
}: MicrosoftLoginModalProps) {
  const [accountType, setAccountType] = useState<MicrosoftAccountType | null>(
    null,
  );

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!open) {
      setAccountType(null);
    }
  }, [open]);

  const handleAccountTypeNext = () => {
    if (!accountType) return;
    onOpenChange(false);
    onContinue?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
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
            Choose whether you are signing in with a personal Microsoft account
            or an organization account.
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
                Organization account provided by your company, university, or
                school.
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
      </DialogContent>
    </Dialog>
  );
}
