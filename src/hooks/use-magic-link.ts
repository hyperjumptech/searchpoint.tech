import { useState } from "react";
import { z } from "zod";

import { sendMagicLink } from "@/actions/send-magic-link";

export function useMagicLink() {
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
      const res = await sendMagicLink(email);
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
