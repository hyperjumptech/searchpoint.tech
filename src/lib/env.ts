import { z } from "zod";

const schema = z.object({
  APP_NAME: z.string().optional().default("SearchPoint"),
  BACKEND_BASE_URL: z
    .url()
    .optional()
    .default("https://api.searchpoint.hyperjump.tech"),
  AUTH_BASE_URL: z
    .url()
    .optional()
    .default("https://api.searchpoint.hyperjump.tech"),
  UPDATER_BASE_URL: z
    .url()
    .optional()
    .default("https://nss-mr1-searchpoint.nos.wjv-1.neo.id"),
});

export const env = schema.parse(process.env);
