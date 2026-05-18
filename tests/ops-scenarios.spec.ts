import { test, expect } from "@playwright/test";

async function openSimPanel(page: import("@playwright/test").Page) {
    await page.goto("/ops");
    await page.waitForSelector('[data-testid="app-ready"]', { state: "attached", timeout: 30000 });

    const simTab = page.locator('[data-testid="right-sidebar"] button[aria-label="Sim"]');
    if ((await simTab.count()) === 0) {
        return false;
    }
    await simTab.click();
    return true;
}

test("ops sim panel exposes scenario run controls", async ({ page }) => {
    const hasSim = await openSimPanel(page);
    if (!hasSim) {
        test.skip();
        return;
    }

    await expect(page.locator(".ops-sim-panel__title")).toHaveText("Simulation");
    await expect(page.locator(".ops-sim-panel__field select")).toBeVisible();
    await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
});

test("maritime scenario run populates entities via API", async ({ page }) => {
    const hasSim = await openSimPanel(page);
    if (!hasSim) {
        test.skip();
        return;
    }

    const select = page.locator(".ops-sim-panel__field select");
    await select.selectOption("maritime-ais-patrol");
    await page.getByRole("button", { name: "Run" }).click();

    await expect(page.locator(".ops-sim-panel__status")).toContainText("maritime-ais-patrol", {
        timeout: 15000,
    });
    await expect(page.locator(".ops-sim-panel__status")).toContainText("3 entities", {
        timeout: 15000,
    });

    const stateRes = await page.request.get("/api/ops/scenarios/state");
    expect(stateRes.ok()).toBeTruthy();
    const state = await stateRes.json();
    expect(state.active).toBe(true);
    expect(state.entityCount).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(state.entities)).toBe(true);
    expect(state.entities.length).toBeGreaterThanOrEqual(3);

    await page.getByRole("button", { name: "Stop" }).click();
    await expect(page.locator(".ops-sim-panel__status--idle")).toBeVisible({ timeout: 15000 });
});
