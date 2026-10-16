import { useState } from "react";
import { z } from "zod";

import { sendMagicLink } from "@/actions/send-magic-link";
import { isSafeRedirectPath } from "@/lib/safe-redirect";

export function useMagicLink(initialReturnTo?: string) {
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [isMagicLinkSubmitted, setIsMagicLinkSubmitted] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState("");

  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const email = magicLinkEmail.trim();
    if (!email) return;

    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setMagicLinkError("Enter a valid email address.");
      return;
    }

    try {
      setIsSendingMagicLink(true);
      setMagicLinkError("");
      let returnTo: string | undefined = initialReturnTo;
      if (typeof window !== "undefined") {
        if (isSafeRedirectPath(returnTo)) {
          returnTo = `${window.location.origin}${returnTo}`;
        } else if (!returnTo) {
          const urlParams = new URLSearchParams(window.location.search);
          const fromParam = urlParams.get("return_to");
          if (isSafeRedirectPath(fromParam)) {
            returnTo = `${window.location.origin}${fromParam}`;
          } else {
            returnTo = window.location.origin;
          }
        } else {
          returnTo = window.location.origin;
        }
      }
      const res = await sendMagicLink(email, returnTo);
      if (res.success) {
        setIsMagicLinkSubmitted(true);
      } else {
        setMagicLinkError(
          res.error || "Couldn't send the sign-in email. Try again.",
        );
      }
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Couldn't send the sign-in email. Try again.";

      if (
        message.includes("Server Action") &&
        message.includes("was not found")
      ) {
        window.location.reload();
        return;
      }

      setMagicLinkError(
        message || "Couldn't send the sign-in email. Try again.",
      );
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setIsMagicLinkSubmitted(false);
    setMagicLinkEmail("");
    setMagicLinkError("");
  };

  return {
    magicLinkEmail,
    setMagicLinkEmail,
    isMagicLinkSubmitted,
    isSendingMagicLink,
    magicLinkError,
    setMagicLinkError,
    handleSendMagicLink,
    handleUseDifferentEmail,
  };
}
