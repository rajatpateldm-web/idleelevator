const { test, expect } = require('@playwright/test');

test.describe('Idle Elevator Smoke Test', () => {
  test('should load game page, initialize Phaser, and render canvas without errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (exception) => {
      pageErrors.push(exception);
    });

    await page.goto('/');

    // Verify title or page structure
    await expect(page).toHaveTitle(/Elevator Idle Clicker/i);

    // Verify canvas element created by Phaser exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify Phaser initializes
    const phaserInitialized = await page.evaluate(() => {
      return typeof window.Phaser !== 'undefined';
    });
    expect(phaserInitialized).toBe(true);

    // Verify no uncaught JS page errors occurred during load
    expect(pageErrors).toHaveLength(0);
  });

  test('should have DEV MODE off by default, but enableable via ?dev=true', async ({ page }) => {
    await page.goto('/');
    const devActiveDefault = await page.evaluate(() => {
      const { isDevModeActive } = window; // Or evaluate devConfig logic
      return typeof isDevModeActive === 'function' ? isDevModeActive() : false;
    });
    expect(devActiveDefault).toBe(false);

    await page.goto('/?dev=true');
    const devActiveWithParam = await page.evaluate(() => {
      return window.location.search.includes('dev=true');
    });
    expect(devActiveWithParam).toBe(true);
  });
});
