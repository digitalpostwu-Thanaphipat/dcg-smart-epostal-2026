import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
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

  test('should not have any detectable accessibility issues', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for the app to load (increased timeout)
    await page.waitForSelector('#root', { state: 'visible', timeout: 30000 });

    // Verify Skip Link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Run the accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    // Verify no violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
