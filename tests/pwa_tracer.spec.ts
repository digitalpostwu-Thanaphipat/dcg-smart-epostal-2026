import { test, expect } from '@playwright/test';

test.describe('PWA Tracer Bullet: Offline Storage', () => {
  test('should initialize Dexie database and save a mock record', async ({ page }) => {
    // Navigate to the app (using the dev server URL)
    await page.goto('/');

    // Execute script in the browser to interact with Dexie
    const result = await page.evaluate(async () => {
      // Wait for window.db to be available (it has a small delay in main.tsx)
      let retries = 50;
      while (!(window as any).db && retries > 0) {
        await new Promise(r => setTimeout(r, 100));
        retries--;
      }

      if (!(window as any).db) {
         throw new Error('Database not found on window object after 5s');
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
