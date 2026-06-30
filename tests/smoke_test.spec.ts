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

  test('loads login screen with current branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const heading = page.locator('h1');
    await expect(heading).toContainText(/DCG Smart/i);
    await expect(heading).toContainText(/ePostal/i);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', /อีเมล|email/i);

    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText(/ส่งรหัส|เข้าสู่ระบบ/i);

    await expect(page.locator('button[aria-label]').first()).toBeVisible();
  });

  test('keeps primary login action styled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toHaveClass(/bg-(emerald|zinc|primary)-/);
  });
});
