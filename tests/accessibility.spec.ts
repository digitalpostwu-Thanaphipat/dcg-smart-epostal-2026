import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('should not have any detectable accessibility issues', async ({ page }) => {
    // Navigate to the app (assuming it's running locally or using the provided URL)
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('#root');

    // Run the accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Verify no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
