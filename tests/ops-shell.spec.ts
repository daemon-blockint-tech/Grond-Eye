import { test, expect } from "@playwright/test";

test("ops shell boots and shows layout regions", async ({ page }) => {
    await page.goto("/ops");

    await expect(page).toHaveTitle(/Grond/i);

    await page.waitForSelector('[data-testid="app-ready"]', { state: "attached", timeout: 30000 });

    await expect(page.locator('[data-testid="layout"]')).toBeAttached();
    await expect(page.locator('[data-testid="layout-top"]')).toBeAttached();
    await expect(page.locator('[data-testid="left-sidebar"]')).toBeAttached();
    await expect(page.locator('[data-testid="global-time-scrubber"]')).toBeAttached();

    await page.locator('[data-testid="cop-panel-toolbar"] button[aria-label="Open layers"]').click();
    await expect(page.locator('[data-testid="left-panel-manager"]')).toBeVisible();
});
