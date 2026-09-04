import { env } from "@/lib/env";
import { getJSON, oauthKeys, setWithTTL } from "@/lib/oauth-valkey";

export { describeScopes } from "@/lib/oauth-consent-ui";

export const CONSENT_TTL_SEC = 30 * 24 * 3600;

export function consentKey(clientId: string, email: string) {
  return oauthKeys.consent(clientId, email);
}

export async function hasConsent(
  clientId: string,
  email: string,
): Promise<boolean> {
  return (await getJSON(consentKey(clientId, email))) !== null;
}

export async function recordConsent(
  clientId: string,
  email: string,
): Promise<void> {
  await setWithTTL(
    consentKey(clientId, email),
    { grantedAt: Date.now() },
    CONSENT_TTL_SEC,
  );
}

export function clientLabel(): string {
  return env.OAUTH_CLIENT_LABEL;
}
