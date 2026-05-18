import { test, expect } from "@playwright/test";

test("ops right rail panels render functional copy", async ({ page }) => {
    await page.goto("/ops");
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 30000 });

    await page.locator('.ops-right-rail button[aria-label="Tasks"]').click();
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
    await expect(page.getByText(/No tasks/i)).toBeVisible();

    await page.locator('.ops-right-rail button[aria-label="Alerts"]').click();
    await expect(page.getByRole("heading", { name: "Alerts" })).toBeVisible();
    await expect(page.getByText(/No alerts/i)).toBeVisible();
});
