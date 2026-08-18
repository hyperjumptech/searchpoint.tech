"use server";

import { env } from "@/lib/env";

export type SendMagicLinkResult = {
  success: boolean;
  error?: string;
};

export async function sendMagicLink(
  email: string,
): Promise<SendMagicLinkResult> {
  if (!env.ENABLE_MAGIC_LINK) {
    return { success: false, error: "Magic link login is currently disabled." };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { success: false, error: "Enter a valid email address." };
  }

  try {
    const url = new URL("/v1/auth/magic-link", env.BACKEND_BASE_URL);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "frontend",
      },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    if (!response.ok) {
      const status = response.status;
      const bodyText = await response.text().catch(() => "");
      let errMsg = `Magic link request failed with status ${status}`;
      if (bodyText.trim()) {
        try {
          const jsonVal = JSON.parse(bodyText);
          if (typeof jsonVal === "string") {
            errMsg = jsonVal;
          } else if (typeof jsonVal.error === "string") {
            errMsg = jsonVal.error;
          } else if (
            typeof jsonVal.error === "object" &&
            jsonVal.error !== null &&
            typeof jsonVal.error.message === "string"
          ) {
            errMsg = jsonVal.error.message;
          } else if (typeof jsonVal.message === "string") {
            errMsg = jsonVal.message;
          } else if (typeof jsonVal.detail === "string") {
            errMsg = jsonVal.detail;
          } else if (
            Array.isArray(jsonVal.errors) &&
            jsonVal.errors.length > 0
          ) {
            const first = jsonVal.errors[0];
            if (typeof first === "string") {
              errMsg = first;
            } else if (typeof first?.message === "string") {
              errMsg = first.message;
            } else {
              errMsg = bodyText;
            }
          } else {
            errMsg = bodyText;
          }
        } catch {
          errMsg = bodyText;
        }
      }
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Couldn't send the sign-in email. Try again.",
    };
  }
}
