import { test, expect, Page } from "@playwright/test";

const screens = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "tablet", viewport: { width: 768, height: 1024 } },
  { name: "mobile", viewport: { width: 375, height: 812 } },
];

async function login(page: Page) {
  await page.goto("http://localhost:3000");
  await page.click("text=Login with Microsoft");
}

for (const screen of screens) {
  test.describe(`Responsive tests on ${screen.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(screen.viewport);
    });

    test(`should display login page`, async ({ page }) => {
      await page.goto("http://localhost:3000/");
      await expect(
        page.getByRole("heading", { name: "Login to Continue" }),
      ).toBeVisible();
      await expect(
        page.getByText("Login to Continue", { exact: true }),
      ).toBeVisible();
    });

    test(`should render microsoft login page when login clicked`, async ({
      page,
    }) => {
      await login(page);
      await expect(page).toHaveURL(/login\.microsoftonline\.com/);
    });
  });
}
