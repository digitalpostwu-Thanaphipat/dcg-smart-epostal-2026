import { test, expect } from '@playwright/test';

test.describe('ePostal app shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api(?:\?|$)/, async route => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            departments: [],
            personnel: [],
            positions: [],
            representatives: [],
            announcements: [],
            stats: {},
            systemInfo: { version: '4.0.2' },
          },
        },
      });
    });
  });

  test('shows the login screen without external network access', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('DCG Smart');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('exposes the local test helpers in development mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => typeof (window as any).ApiClient !== 'undefined', { timeout: 5000 });
    await expect(page.locator('#root')).toBeVisible();
  });
});
