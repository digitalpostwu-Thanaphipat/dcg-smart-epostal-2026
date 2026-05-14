import { test, expect } from '@playwright/test';

test.describe('PWA Tracer Bullet: Offline Storage', () => {
  test('should initialize Dexie database and save a mock record', async ({ page }) => {
    // Navigate to the app (using the dev server URL)
    await page.goto('http://localhost:5175');

    // Execute script in the browser to interact with Dexie
    const result = await page.evaluate(async () => {
      // Import db dynamically if needed or use the global one if exported to window
      // For this tracer bullet, we'll try to access the db from the window object
      // (We'll need to add window.db = db in our app code for this to work)
      if (!(window as any).db) {
         return { success: false, error: 'Database not found on window object' };
      }

      const db = (window as any).db;
      
      const record = {
        trackingId: 'TRACER-001',
        senderName: 'Test Sender',
        receiverName: 'Test Receiver',
        type: 'Express',
        status: 'pending' as const,
        offlineCreatedAt: Date.now(),
        version: 1
      };

      const id = await db.receiveRecords.add(record);
      const saved = await db.receiveRecords.get(id);

      return { success: !!saved, trackingId: saved?.trackingId };
    });

    expect(result.success).toBe(true);
    expect(result.trackingId).toBe('TRACER-001');
  });
});
