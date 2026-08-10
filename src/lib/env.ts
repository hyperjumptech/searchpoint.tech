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
  CURATION_MODEL_FILENAME: z
    .string()
    .optional()
    .default("qwen2.5-coder-0.5b-instruct-q4_k_m.gguf"),
  CURATION_MODEL_GGUF_SHA256: z
    .string()
    .optional()
    .default(
      "0128e77564e43d40682f82d7ebe8a9abdf0c24c8f55fa85629f8cc156b1b6560",
    ),
  CURATION_MODEL_SIZE_BYTES: z.string().optional().default("397808288"),
});

export const env = schema.parse(process.env);
