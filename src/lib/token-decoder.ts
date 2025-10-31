import { jwtDecode } from "jwt-decode";

type TokenData = {
  name: string;
  initialName: string;
  preferred_username: string;
};

export function decodeToken(token?: string) {
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenData>(token);

    return {
      name: decoded.name,
      initialName: generateInitialName(decoded.name),
      email: decoded.preferred_username,
    };
  } catch {
    return null;
  }
}

function generateInitialName(name: string) {
  return name
    .replace(/(\w)\w*\s*/g, "$1")
    .slice(0, 2)
    .toUpperCase();
}
