import "server-only";

import { z } from "zod";

import { env as publicEnv } from "./env";

const serverSchema = z.object({
  DATABASE_URL: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().optional()),
  MCP_ADMIN_USERNAME: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().optional()),
  MCP_ADMIN_PASSWORD: z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().optional()),
});

export const env = {
  ...publicEnv,
  ...serverSchema.parse(process.env),
};
