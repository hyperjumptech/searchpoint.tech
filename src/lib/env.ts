import { z } from "zod";

const schema = z.object({
  APP_BASE_URL: z.url(),
  BACKEND_BASE_URL: z.url(),
  UPDATER_BASE_URL: z.url().optional(),
});

export const env = schema.parse(process.env);
