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
  VALKEY_URL: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().optional()),
  UPDATER_RATE_LIMIT: z.preprocess((val) => {
    if (val === undefined || val === "") return 60;
    return Number(val);
  }, z.number().int().positive().default(60)),
  MANIFEST_RATE_LIMIT: z.preprocess((val) => {
    if (val === undefined || val === "") return 30;
    return Number(val);
  }, z.number().int().positive().default(30)),
  ENABLE_MAGIC_LINK: z
    .preprocess((val) => {
      if (val === undefined || val === "") return true;
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        return val.toLowerCase() !== "false" && val !== "0";
      }
      return true;
    }, z.boolean())
    .default(true),
  ENABLE_MICROSOFT_LOGIN: z
    .preprocess((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1";
      }
      return false;
    }, z.boolean())
    .default(false),
});

export const env = schema.parse(process.env);
