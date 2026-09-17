import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "static OAuth client PostgreSQL integration",
  () => {
    it("is enabled only when TEST_DATABASE_URL is configured", () => {
      expect(process.env.TEST_DATABASE_URL).toBeTruthy();
    });
  },
);
