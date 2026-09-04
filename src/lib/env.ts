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
    .default("Qwen3-0.6B-Q8_0.gguf"),
  CURATION_MODEL_GGUF_SHA256: z
    .string()
    .optional()
    .default(
      "9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031",
    ),
  CURATION_MODEL_SIZE_BYTES: z.string().optional().default("639446688"),
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
  OAUTH_ISSUER: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.url().optional(),
  ),
  MCP_RESOURCE_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.url().optional(),
  ),
  OAUTH_CLIENT_LABEL: z
    .string()
    .optional()
    .default("Open WebUI (StartGPT SMDV)"),
  OAUTH_REGISTERED_CLIENTS: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().optional()),
  OAUTH_SCOPES: z
    .string()
    .optional()
    .default("openid profile email search magic"),
  OAUTH_CONSENT_ALWAYS: z
    .preprocess((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string")
        return val.toLowerCase() === "true" || val === "1";
      return false;
    }, z.boolean())
    .default(false),
});

export const env = schema.parse(process.env);
