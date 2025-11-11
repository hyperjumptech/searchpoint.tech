import { fetcher } from "@/lib/fetcher";

export async function GET() {
  const response = await fetcher("/v1/auth/logout", {
    method: "POST",
  });

  return response;
}
