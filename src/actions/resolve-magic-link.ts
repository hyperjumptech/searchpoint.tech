"use server";

import { cookies } from "next/headers";

export type ResolveMagicLinkResult = {
  success: boolean;
  error?: string;
};

export async function resolveMagicLinkUrl(
  rawUrl: string,
): Promise<ResolveMagicLinkResult> {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Dev mode resolution is disabled in production.",
    };
  }

  const urlStr = rawUrl.trim();
  if (!urlStr) {
    return { success: false, error: "Please enter a valid URL." };
  }

  // 1. Direct session query parameter (e.g. searchpoint://auth/callback?session=<jwt>)
  if (urlStr.includes("?")) {
    try {
      const queryString = urlStr.split("?")[1];
      const params = new URLSearchParams(queryString);
      const session = params.get("session");
      if (session) {
        const cookieStore = await cookies();
        cookieStore.set("SCSE_ID", session, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: false,
        });
        return { success: true };
      }
    } catch {
      // Continue to HTTP fetch
    }
  }

  // 2. HTTP redirect URL resolution (e.g. GET /v1/auth/magic-link/redirect?token=... or confirm endpoint)
  if (
    (urlStr.startsWith("http://") || urlStr.startsWith("https://")) &&
    (urlStr.includes("/magic-link/redirect") ||
      urlStr.includes("token=") ||
      urlStr.includes("/magic-link/confirm"))
  ) {
    try {
      const parsedUrl = new URL(urlStr);
      const token = parsedUrl.searchParams.get("token");

      let res: Response;

      if (token) {
        const confirmUrl = new URL("confirm", parsedUrl);
        confirmUrl.search = "";

        const formBody = new URLSearchParams();
        formBody.set("token", token);

        res = await fetch(confirmUrl.toString(), {
          method: "POST",
          redirect: "manual",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "frontend-dev",
          },
          body: formBody.toString(),
        });
      } else {
        res = await fetch(urlStr, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent": "frontend-dev",
          },
        });

        // If GET returned 200 OK (interstitial page), extract token and submit form
        if (res.status === 200) {
          const html = await res.text();
          const tokenMatch =
            html.match(/name=["']token["']\s+value=["']([^"']+)["']/) ||
            html.match(/value=["']([^"']+)["']\s+name=["']token["']/);
          const formActionMatch = html.match(
            /<form[^>]*action=["']([^"']+)["']/,
          );

          if (tokenMatch && tokenMatch[1]) {
            const extractedToken = tokenMatch[1];
            const action =
              formActionMatch && formActionMatch[1]
                ? formActionMatch[1]
                : "confirm";
            const confirmUrl = new URL(action, parsedUrl);
            confirmUrl.search = "";

            const formBody = new URLSearchParams();
            formBody.set("token", extractedToken);

            res = await fetch(confirmUrl.toString(), {
              method: "POST",
              redirect: "manual",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "frontend-dev",
              },
              body: formBody.toString(),
            });
          }
        }
      }

      // Check Location header for redirect with session query param
      const location = res.headers.get("location");
      if (location && location.includes("?")) {
        const params = new URLSearchParams(location.split("?")[1]);
        const session = params.get("session");
        if (session) {
          const cookieStore = await cookies();
          cookieStore.set("SCSE_ID", session, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: false,
          });
          return { success: true };
        }
      }

      // Check Set-Cookie header for SCSE_ID cookie
      const setCookie = res.headers.get("set-cookie") || "";
      const scseMatch = setCookie.match(/SCSE_ID=([^;]+)/);
      if (scseMatch && scseMatch[1]) {
        const session = scseMatch[1];
        const cookieStore = await cookies();
        cookieStore.set("SCSE_ID", session, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: false,
        });
        return { success: true };
      }

      if (res.status === 400) {
        return {
          success: false,
          error: "This login link is expired or invalid.",
        };
      }
      if (res.status === 403) {
        return {
          success: false,
          error: "Your email domain is not on the allow list.",
        };
      }
      if (res.status === 503) {
        return {
          success: false,
          error: "Login service is temporarily unavailable.",
        };
      }

      return {
        success: false,
        error: "Could not extract authentication session from link.",
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to magic link redirect endpoint.",
      };
    }
  }

  return {
    success: false,
    error: "Unrecognized callback or magic link URL format.",
  };
}
