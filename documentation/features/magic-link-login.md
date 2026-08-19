# Magic Link Email Login

## Overview

The Magic Link Email Login feature allows users on the SearchPoint web application to authenticate without requiring a Microsoft account. Users can enter their organization email address to request a sign-in magic link.

## Flow & User Experience

```
+-------------------------------------------------------------+
|                        /login Screen                        |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         Log in with Microsoft Account               |   |
|   +-----------------------------------------------------+   |
|                                                             |
|   ------------------------- or --------------------------   |
|                                                             |
|   Email                                                     |
|   +-----------------------------------------------------+   |
|   | user@domain.com                                     |   |
|   +-----------------------------------------------------+   |
|                                                             |
|   +-----------------------------------------------------+   |
|   |                Send sign-in link                    |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
                              |
                [User enters email & submits]
                              |
                              v
+-------------------------------------------------------------+
|                   Check-Your-Email State                    |
|                                                             |
|   Check your email. We sent a sign-in link to               |
|   user@domain.com. You will receive a message if your       |
|   domain is on the allow list.                              |
|                                                             |
|   [Use a different email]                                   |
+-------------------------------------------------------------+
                              |
           [User clicks "Sign in" in email]
                              |
                              v
                Browser hits Backend Redirect:
          GET /v1/auth/magic-link/redirect?token=...
                              |
                              v
                    Backend responds 302:
          Set-Cookie: SCSE_ID=<jwt>; HttpOnly; SameSite=Lax
          Location: <return_to> (Web application origin)
                              |
                              v
+-------------------------------------------------------------+
|              SearchPoint Web Application Landing            |
|                                                             |
|   - Browser lands on `return_to` with `SCSE_ID` cookie      |
|   - Next.js middleware verifies active `SCSE_ID` session    |
|   - `GET /v1/auth/me` verifies identity and loads user      |
|   - Navigates to Home (`/`)                                 |
+-------------------------------------------------------------+
```

### UI States & Interactions

1. **Initial / Unsubmitted State**:
   - Displays the standard **Log in with Microsoft Account** button.
   - A horizontal `"or"` divider separates SSO from the magic link input.
   - An **Email** input field with label `Email` and placeholder `name@example.com`.
   - **Send sign-in link** button:
     - **Disabled** when the email input is empty or contains only whitespace.
     - **Enabled** when any non-empty text is typed into the input.

2. **Validation & Error Handling**:
   - **Invalid Email Format**: When submitted with an invalid email address (e.g. `invalid-user`), the form displays `Enter a valid email address.` in red and remains on the login form.
   - **Backend / Request Failure**: If the backend returns an error or the request fails, the form displays the error message returned from the server action and remains on the login form.

3. **Check-Your-Email State**:
   - Triggered upon submitting a valid email.
   - **Hides** the Microsoft login button and email form.
   - Displays the notice: `Check your email. We sent a sign-in link to <email>. You will receive a message if your domain is on the allow list.` with the entered email highlighted.
   - Provides a **Use a different email** action button.

4. **Resetting Form**:
   - Clicking **Use a different email** returns the user to the initial login screen, clearing the email input and any displayed error messages.

---

## Security & Anti-Enumeration Design

- **Generic Confirmation Screen**: Users see the generic confirmation notice: *"Check your email. You will receive a message if your domain is on the allow list."* This prevents external users or attackers from enumerating valid organization accounts or partner domains.
- **Authoritative Backend Validation**: Domain validation is managed solely by the backend as the single source of truth. The frontend sends any syntactically valid email to `POST /v1/auth/magic-link`.
- **Single-Use Token**: The backend invalidates the token upon consumption. Subsequent clicks on the same email link will return a 400 "this login link is expired or invalid" page in the browser.

---

## Backend & Integration

- **Server Action**: `sendMagicLink(email: string, returnTo?: string)`
- **HTTP Endpoint**: `POST /v1/auth/magic-link`
- **Request Headers**: Unauthenticated (`User-Agent: frontend`, `Content-Type: application/json`)
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "return_to": "https://searchpoint.hyperjump.tech"
  }
  ```
- **Response**: `202 Accepted` on successful acceptance.

---

## Feature Toggle

The Magic Link feature is guarded by an environment variable to safely manage rollouts:

- **Environment Variable**: `ENABLE_MAGIC_LINK`
- **Default Value**: `true`
- **Behavior**:
  - `false`: Only Microsoft SSO login is displayed. The email input and "or" divider are hidden. The `sendMagicLink` server action is blocked.
  - `true` (default): Full magic link email login UI and server action are enabled.

---

## Dev Mode Callback URL Handling

When running the web app locally (`NODE_ENV !== "production"`):
- A **"Dev Mode: Paste Callback URL"** button is displayed on the "Check your email" screen.
- Developers can paste the link from their email/Mailpit (e.g. `https://api.searchpoint.hyperjump.tech/v1/auth/magic-link/redirect?token=...` or `searchpoint://auth/callback?session=<jwt>`).
- The `resolveMagicLinkUrl` server action resolves the URL, extracts the `SCSE_ID` JWT session, sets the cookie on `localhost`, and seamlessly authenticates the local session.

