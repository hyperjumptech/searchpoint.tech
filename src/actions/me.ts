import { fetcher } from "@/lib/fetcher";

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
  try {
    const path = "/v1/auth/me";
    const data = await fetcher<{ value?: Value }>(path);

    return {
      email: data.value?.email,
      name: data.value?.name,
      initialName: generateInitialName(data.value?.name),
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
