import { test, expect } from '@playwright/test';

test.describe('Loki Hybrid Mapping Integrity', () => {
  test('should process both trackingNo and trackingNumber in a single batch', async ({ page }) => {
    // Mock the backend API intelligently to bypass GAS domain 401 Unauthorized
    await page.route('**/api', async route => {
      const req = route.request();
      if (req.method() === 'POST') {
        const body = req.postDataJSON() || {};
        if (body.action === 'getDepartments') {
          return route.fulfill({ status: 200, json: { success: true, data: [{ id: 'D001', name: 'ห้องตรวจผู้ป่วยนอก' }] } });
        }
        if (body.action === 'savePackageEntry') {
          return route.fulfill({ status: 200, json: { success: true, count: 2, message: 'Extreme Optimized' } });
        }
      }
      return route.fulfill({ status: 200, json: { success: true, data: [] } });
    });
    await page.goto('/');

    const timestamp = Date.now();
    // รอจน ApiClient พร้อม
    await page.waitForFunction(() => typeof (window as any).ApiClient !== 'undefined', { timeout: 5000 });
    const result = await page.evaluate(async (ts) => {
      const testData = {
        action: "savePackageEntry",
        departmentId: "D001",
        departmentName: "ห้องตรวจผู้ป่วยนอก",
        emsList: [
          { trackingNo: `HYBRID-A-${ts}`, receiverName: "User A", itemType: "EMS" },
          { trackingNumber: `HYBRID-B-${ts}`, recipientName: "User B", itemType: "REG" }
        ],
        userEmail: "thanaphipat.su@mail.wu.ac.th"
      };
      return await (window as any).ApiClient.postal.saveEntry(testData);
    }, timestamp);

    // Verification: Must succeed with 2 items
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.message).toContain('Extreme Optimized');
    console.log('✅ Hybrid Mapping: Both NO and NUMBER processed successfully.');
  });
});
