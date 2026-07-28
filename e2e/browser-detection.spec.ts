import { expect, test } from "@playwright/test";
import { hasGoogleChromeBrand } from "../src/lib/detect-os";

test("detects only the exact Google Chrome UA-CH brand", () => {
  expect(
    hasGoogleChromeBrand(
      '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    ),
  ).toBe(true);
  expect(hasGoogleChromeBrand('"Google Chrome";foo=?1;v="150"')).toBe(true);
  expect(hasGoogleChromeBrand('"Chromium";v="150"')).toBe(false);
  expect(
    hasGoogleChromeBrand('"Not;A=Brand";v="8", "Microsoft Edge";v="150"'),
  ).toBe(false);
  expect(hasGoogleChromeBrand(null)).toBe(false);
});
