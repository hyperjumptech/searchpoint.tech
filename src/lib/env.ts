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
    .default("SmolLM2-1.7B-Instruct-Q4_K_M.gguf"),
  CURATION_MODEL_GGUF_SHA256: z
    .string()
    .optional()
    .default(
      "77665ea4815999596525c636fbeb56ba8b080b46ae85efef4f0d986a139834d7",
    ),
  CURATION_MODEL_SIZE_BYTES: z.string().optional().default("1055609824"),
});

export const env = schema.parse(process.env);
