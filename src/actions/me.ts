import { fetcher } from "@/lib/fetcher";
import { isLoginBypassEnabled } from "@/lib/is-login-bypass-enabled";

type Value = {
  email?: string;
  name?: string;
};

type Result = {
  email?: string;
  name?: string;
  initialName?: string;
};

export async function getMe(): Promise<Result | null> {
  if (isLoginBypassEnabled()) {
    return {
      email: "dev@searchpoint.local",
      name: "Dev User",
      initialName: "DU",
    };
  }

  try {
    const path = "/v1/auth/me";
    const response = await fetcher(path);

    if (response.status === 401) {
      return null;
    }

    const data = await response.json();
    const user = data.value as Value | undefined;

    return {
      email: user?.email,
      name: user?.name,
      initialName: generateInitialName(user?.name),
    };
  } catch {
    return null;
  }
}

function generateInitialName(name?: string) {
  return name
    ?.replace(/(\w)\w*\s*/g, "$1")
    ?.slice(0, 2)
    ?.toUpperCase();
}
