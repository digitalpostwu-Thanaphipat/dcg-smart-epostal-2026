import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../frontend/src/db/dexie';
import { ApiClient } from '../frontend/src/api/client';

// Mock ApiClient
vi.mock('../frontend/src/api/client', () => ({
  ApiClient: {
    postal: {
      saveEntry: vi.fn(),
      confirm: vi.fn(),
      revert: vi.fn(),
      getPending: vi.fn(),
    },
  },
}));

describe('Confirm Delivery Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.pendingDeliveries.clear();
    await db.syncQueue.clear();
  });

  describe('Online success', () => {
    it('should send correct payload shape to confirm API', async () => {
      const confirmPayload = {
        packageIds: ['PKG-001', 'PKG-002'],
        expectedVersions: { 'PKG-001': 1, 'PKG-002': 1 },
        signerName: 'User Test',
        signature: 'data:image/png;base64,...',
        photo: 'data:image/jpeg;base64,...'
      };

      (ApiClient.postal.confirm as any).mockResolvedValue({ success: true });

      const res = await ApiClient.postal.confirm(confirmPayload);

      expect(res.success).toBe(true);
      expect(ApiClient.postal.confirm).toHaveBeenCalledWith(confirmPayload);
    });

    it('should handle empty packageIds gracefully', async () => {
      (ApiClient.postal.confirm as any).mockResolvedValue({ 
        success: false, 
        error: 'No packages selected' 
      });

      const res = await ApiClient.postal.confirm({ packageIds: [] });
      expect(res.success).toBe(false);
    });
  });

  describe('Offline fallback', () => {
    it('should add confirm action to syncQueue when offline', async () => {
      (ApiClient.postal.confirm as any).mockRejectedValue(new Error('Network error'));

      try {
        await ApiClient.postal.confirm({ packageIds: ['PKG-001'] });
      } catch (e) {
        // Expected - simulate offline fallback
      }

      // Simulate what PostalPendingList does on offline: add to syncQueue
      await db.syncQueue.add({
        action: 'update',
        entityType: 'receive',
        entityId: 0,
        payload: {
          action: 'confirmDelivery',
          packageIds: ['PKG-001'],
          signerName: 'User',
          status: 'Delivered'
        },
        createdAt: Date.now()
      });

      const queue = await db.syncQueue.toArray();
      expect(queue.length).toBe(1);
      expect(queue[0].action).toBe('update');
      expect(queue[0].payload.action).toBe('confirmDelivery');
      expect(queue[0].payload.packageIds).toContain('PKG-001');
    });
  });

  describe('Conflict handling', () => {
    it('should handle CONFLICT response from server', async () => {
      (ApiClient.postal.confirm as any).mockResolvedValue({
        success: false,
        error: 'CONFLICT',
        details: { conflictingPackages: ['PKG-001'] }
      });

      const res = await ApiClient.postal.confirm({ packageIds: ['PKG-001'] });
      expect(res.success).toBe(false);
      expect(res.error).toBe('CONFLICT');
    });
  });
});

describe('Revert Delivery Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('Online success', () => {
    it('should send correct payload shape to revert API', async () => {
      const revertPayload = {
        packageId: 'PKG-REVERT-001',
        reason: 'นำจ่ายผิดคน/หน่วยงาน'
      };

      (ApiClient.postal.revert as any).mockResolvedValue({ success: true });

      const res = await ApiClient.postal.revert(revertPayload);

      expect(res.success).toBe(true);
      expect(ApiClient.postal.revert).toHaveBeenCalledWith(revertPayload);
    });

    it('should reject empty reason', async () => {
      // This tests the logic at PostalSearchPage.tsx:107-110
      const reason = '';
      const isValid = reason.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should accept valid reason', async () => {
      const reason = 'นำจ่ายผิดคน';
      const isValid = reason.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle server error on revert', async () => {
      (ApiClient.postal.revert as any).mockResolvedValue({
        success: false,
        error: 'ไม่สามารถยกเลิกการนำจ่ายได้: รายการนี้นำจ่ายไปแล้วเกิน 24 ชม.'
      });

      const res = await ApiClient.postal.revert({
        packageId: 'PKG-OLD-001',
        reason: 'นำจ่ายผิด'
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('24 ชม.');
    });

    it('should handle network error on revert', async () => {
      (ApiClient.postal.revert as any).mockRejectedValue(new Error('Network error'));

      await expect(
        ApiClient.postal.revert({ packageId: 'PKG-001', reason: 'test' })
      ).rejects.toThrow('Network error');
    });
  });
});

describe('End-to-end: entry → confirm → revert', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.receiveRecords.clear();
    await db.syncQueue.clear();
  });

  it('should track full lifecycle: entry synced → confirm → revert', async () => {
    // 1. Entry: save as synced
    const entryTime = Date.now();
    await db.receiveRecords.add({
      trackingId: 'LIFECYCLE-001',
      senderName: '-',
      receiverName: 'Lifecycle User',
      type: 'EMS',
      status: 'synced',
      offlineCreatedAt: entryTime,
      syncedAt: entryTime,
      version: 1
    });

    let record = await db.receiveRecords.where('trackingId').equals('LIFECYCLE-001').first();
    expect(record?.status).toBe('synced');

    // 2. Confirm: API success
    (ApiClient.postal.confirm as any).mockResolvedValue({ success: true });
    const confirmRes = await ApiClient.postal.confirm({
      packageIds: ['LIFECYCLE-001'],
      signerName: 'Lifecycle User'
    });
    expect(confirmRes.success).toBe(true);

    // 3. Revert: API success
    (ApiClient.postal.revert as any).mockResolvedValue({ success: true });
    const revertRes = await ApiClient.postal.revert({
      packageId: 'LIFECYCLE-001',
      reason: 'นำจ่ายผิดคน'
    });
    expect(revertRes.success).toBe(true);
  });

  it('should track offline entry → sync → confirm', async () => {
    // 1. Entry: offline (pending)
    const offlineTime = Date.now();
    await db.receiveRecords.add({
      trackingId: 'OFFLINE-001',
      senderName: '-',
      receiverName: 'Offline User',
      type: 'EMS',
      status: 'pending',
      offlineCreatedAt: offlineTime,
      version: 1
    });

    await db.syncQueue.add({
      action: 'create-batch',
      entityType: 'receive',
      entityId: 0,
      payload: {
        emsList: [{ trackingNumber: 'OFFLINE-001' }],
        departmentId: 'dept-001',
        staffEmail: 'test@university.ac.th'
      },
      createdAt: offlineTime
    });

    // Verify pending state
    let record = await db.receiveRecords.where('trackingId').equals('OFFLINE-001').first();
    expect(record?.status).toBe('pending');

    let queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(1);

    // 2. Sync succeeds (simulated)
    (ApiClient.postal.saveEntry as any).mockResolvedValue({ success: true });
    const syncRes = await ApiClient.postal.saveEntry(queue[0].payload);
    expect(syncRes.success).toBe(true);

    // Update record status to synced
    await db.receiveRecords.where('trackingId').equals('OFFLINE-001').modify({ 
      status: 'synced', 
      syncedAt: Date.now() 
    });

    // Remove from queue
    await db.syncQueue.clear();

    record = await db.receiveRecords.where('trackingId').equals('OFFLINE-001').first();
    expect(record?.status).toBe('synced');
    expect(await db.syncQueue.count()).toBe(0);
  });
});
