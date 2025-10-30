import { z } from "zod";

const schema = z.object({
  BACKEND_BASE_URL: z.url(),
});

export const env = schema.parse(process.env);
