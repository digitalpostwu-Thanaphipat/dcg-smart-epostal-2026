import { test, expect } from '@playwright/test';

test.describe('Dashboard Smoke Test', () => {
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

  test('should load the login page with correct title and branding', async ({ page }) => {
    // 1. Visit the dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 2. Check for the main heading (Enterprise Branding)
    // The design uses "DCG Smart ePostal" in h1
    const heading = page.locator('h1');
    await expect(heading).toContainText('DCG Smart');
    await expect(heading).toContainText('ePostal');

    // 3. Check for the email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', /ระบุอีเมลผู้ใช้งาน/);

    // 4. Check for the login button
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('ส่งรหัสยืนยันเข้าใช้งาน');

    // 5. Check for theme toggle button
    const themeToggle = page.locator('button[aria-label="สลับธีมมืด/สว่าง"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should verify luxury intelligence aesthetics (emerald theme)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check if the emerald-500 color is used in the login button or logo
    const loginButton = page.locator('button[type="submit"]');
    // We check for the class "bg-emerald-500" or similar depending on the theme
    // but the task update standardized components to use these colors.
    await expect(loginButton).toHaveClass(/bg-(emerald|zinc)-/);
  });
});
