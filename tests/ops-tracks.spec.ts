import { test, expect } from "@playwright/test";

test("ops tracks panel opens and layers toolbar works", async ({ page }) => {
    await page.goto("/ops");
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 30000 });

    await page.locator('[data-testid="cop-panel-toolbar"] button[aria-label="Open layers"]').click();
    await expect(page.locator('[data-testid="left-panel-manager"]')).toBeVisible();

    await page.locator('.ops-left-rail__btn[aria-label="Assets"]').click();
    await expect(page.locator(".ops-entity-list")).toBeVisible();
});
