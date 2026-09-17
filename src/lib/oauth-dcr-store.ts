import { hashSecret } from "@/lib/oauth-dcr";
import { delKey, getJSON, oauthKeys, setPersistent } from "@/lib/oauth-valkey";

export type ClientRecord = {
  id: string;
  name?: string;
  secretHash?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
  policyId?: string;
  createdAt: number;
};

export async function registerClient(input: {
  id: string;
  name?: string;
  secret?: string;
  redirectUris: string[];
  scope?: string;
  tokenEndpointAuthMethod: string;
  registrationTokenId: string;
  policyId?: string;
}): Promise<void> {
  const record: ClientRecord = {
    id: input.id,
    name: input.name,
    secretHash: input.secret ? hashSecret(input.secret) : undefined,
    redirectUris: input.redirectUris,
    scope: input.scope,
    tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
    registrationTokenId: input.registrationTokenId,
    policyId: input.policyId,
    createdAt: Math.floor(Date.now() / 1000),
  };
  // Non-expiring client record (persistent across restarts).
  await setPersistent(oauthKeys.client(input.id), record);

  // Maintain per-token index for duplicate-registration detection.
  const indexKey = oauthKeys.clientByToken(input.registrationTokenId);
  const existing = (await getJSON<string[]>(indexKey)) ?? [];
  await setPersistent(indexKey, [...new Set([...existing, input.id])]);
}

export async function resolveClient(
  clientId: string,
): Promise<ClientRecord | null> {
  return getJSON<ClientRecord>(oauthKeys.client(clientId));
}

export async function deleteClient(clientId: string): Promise<void> {
  const record = await resolveClient(clientId);
  if (record) {
    const indexKey = oauthKeys.clientByToken(record.registrationTokenId);
    const existing = (await getJSON<string[]>(indexKey)) ?? [];
    const next = existing.filter((id) => id !== clientId);
    if (next.length > 0) {
      await setPersistent(indexKey, next);
    } else {
      await delKey(indexKey);
    }
  }
  await delKey(oauthKeys.client(clientId));
}

export async function clientExists(clientId: string): Promise<boolean> {
  return (await resolveClient(clientId)) !== null;
}

export async function getClientByTokenRegistration(
  tokenId: string,
): Promise<string[]> {
  return (await getJSON<string[]>(oauthKeys.clientByToken(tokenId))) ?? [];
}
