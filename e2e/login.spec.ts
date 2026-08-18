import { test, expect } from "@playwright/test";

const screens = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "tablet", viewport: { width: 768, height: 1024 } },
  { name: "mobile", viewport: { width: 375, height: 812 } },
];

for (const screen of screens) {
  test.describe(`Login page on ${screen.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(screen.viewport);
    });

    test("should display login elements including Microsoft login", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/login");
      await expect(
        page.getByRole("heading", { name: "SearchPoint" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /log in with microsoft/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/^email$/i)).not.toBeVisible();
    });
  });
}
