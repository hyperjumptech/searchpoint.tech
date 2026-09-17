import { env } from "./env.server";

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  const paddedLeft = new Uint8Array(length);
  const paddedRight = new Uint8Array(length);
  paddedLeft.set(left);
  paddedRight.set(right);

  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= paddedLeft[index] ^ paddedRight[index];
  }

  return difference === 0;
}

function decodeCredentials(value: string): [string, string] | undefined {
  if (value.length === 0 || value.length % 4 !== 0) return undefined;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return undefined;

  try {
    const decoded = atob(value);
    const bytes = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0),
    );
    const credentials = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = credentials.indexOf(":");
    if (separator < 0) return undefined;
    return [credentials.slice(0, separator), credentials.slice(separator + 1)];
  } catch {
    return undefined;
  }
}

export function isAdminBasicAuthValid(request: Request): boolean {
  const configuredUsername = env.MCP_ADMIN_USERNAME;
  const configuredPassword = env.MCP_ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  const credentials = decodeCredentials(header.slice("Basic ".length));
  if (!credentials) return false;

  const [username, password] = credentials;
  const usernameMatches = constantTimeEqual(
    new TextEncoder().encode(username),
    new TextEncoder().encode(configuredUsername),
  );
  const passwordMatches = constantTimeEqual(
    new TextEncoder().encode(password),
    new TextEncoder().encode(configuredPassword),
  );
  const credentialsMatch = Number(usernameMatches) & Number(passwordMatches);
  return credentialsMatch === 1;
}

export function unauthorizedBasicAuthResponse(): Response {
  return new Response(null, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="MCP admin"' },
  });
}
