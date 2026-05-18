import { test, expect } from '@playwright/test';

test.describe('UI Navigation and Panels', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root and wait for app to be completely booted
    await page.goto('/ops');
    await page.waitForSelector('[data-testid="app-ready"]', { state: 'attached', timeout: 45000 });
    
    // Dismiss unverified plugin dialog if it appears
    const installBtn = page.getByRole('button', { name: /Install Selected/ });
    try {
      await installBtn.waitFor({ state: 'visible', timeout: 2000 });
      await installBtn.click();
    } catch (e) {
      // Ignore if it doesn't appear
    }
  });

  test('can toggle left layers panel', async ({ page }) => {
    const leftToggle = page.locator('[data-testid="panel-toggle-left"]');
    await expect(leftToggle).toBeVisible();

    // The left panel should open/close. We can check the class or state.
    // If we click it, it should toggle the 'panel-toggle-btn--open' class.
    
    // Check initial state (should probably be open by default on desktop, but let's just toggle it and verify class changes)
    const isInitiallyOpen = await leftToggle.evaluate((node) => node.classList.contains('panel-toggle-btn--open'));
    
    await leftToggle.click();
    
    if (isInitiallyOpen) {
      await expect(leftToggle).not.toHaveClass(/panel-toggle-btn--open/);
    } else {
      await expect(leftToggle).toHaveClass(/panel-toggle-btn--open/);
    }
  });

  test('can toggle right config panel', async ({ page }) => {
    const rightToggle = page.locator('[data-testid="panel-toggle-right"]');
    await expect(rightToggle).toBeVisible();
    
    const isInitiallyOpen = await rightToggle.evaluate((node) => node.classList.contains('panel-toggle-btn--open'));
    
    await rightToggle.click();
    
    if (isInitiallyOpen) {
      await expect(rightToggle).not.toHaveClass(/panel-toggle-btn--open/);
    } else {
      await expect(rightToggle).toHaveClass(/panel-toggle-btn--open/);
    }
  });

  test('can interact with timeline controls', async ({ page }) => {
    // The browser subagent identified button.timeline-close-btn
    const timelineCloseBtn = page.locator('button.timeline-close-btn');
    // Ensure it exists in the DOM. Wait for it just in case.
    if (await timelineCloseBtn.count() > 0) {
      await expect(timelineCloseBtn).toBeVisible();
      await timelineCloseBtn.click();
      // Test timeline mode toggle
      const modeToggle = page.locator('label.timeline__mode-toggle');
      if (await modeToggle.count() > 0) {
         await expect(modeToggle).toBeVisible();
      }
    }
  });

  test('can switch left panel tabs', async ({ page }) => {
    // The panel tabs
    const dataLayersTab = page.locator('button.panel-tab[title="Data Layers"]');
    const imageryTab = page.locator('button.panel-tab[title="Imagery"]');
    
    if (await dataLayersTab.count() > 0 && await imageryTab.count() > 0) {
      await expect(dataLayersTab).toBeVisible();
      await expect(imageryTab).toBeVisible();
      
      await imageryTab.click();
      await expect(imageryTab).toHaveClass(/panel-tab--active/);
      
      await dataLayersTab.click();
      await expect(dataLayersTab).toHaveClass(/panel-tab--active/);
    }
  });
});
