import { jwtDecode } from "jwt-decode";

type TokenData = {
  name: string;
  preferred_username: string;
};

export function decodeToken(token?: string) {
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenData>(token);

    return {
      name: decoded.name,
      email: decoded.preferred_username,
    };
  } catch {
    return null;
  }
}
