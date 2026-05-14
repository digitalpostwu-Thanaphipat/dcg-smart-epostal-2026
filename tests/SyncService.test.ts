import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { SyncService } from '../frontend/src/services/SyncService';
import { db } from '../frontend/src/db/dexie';
import { ApiClient } from '../frontend/src/api/client';

// Mock ApiClient
vi.mock('../frontend/src/api/client', () => ({
  ApiClient: {
    postal: {
      saveEntry: vi.fn(),
      confirm: vi.fn(),
    },
  },
}));

describe('SyncService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.syncQueue.clear();
    await db.receiveRecords.clear();
  });

  it('should process create-batch successfully', async () => {
    const offlineCreatedAt = Date.now();
    
    // 1. Add record to receiveRecords
    const recordId = await db.receiveRecords.add({
      trackingId: 'TEST-001',
      senderName: 'Test',
      receiverName: 'User',
      type: 'Normal',
      status: 'pending',
      offlineCreatedAt,
      version: 1
    });

    // 2. Add to syncQueue
    await db.syncQueue.add({
      action: 'create-batch',
      entityType: 'receive',
      entityId: 0, // Not used for batch
      payload: { 
        offlineCreatedAt,
        emsList: [{ trackingNumber: 'TEST-001', recipientName: 'User' }]
      },
      createdAt: Date.now()
    });

    (ApiClient.postal.saveEntry as any).mockResolvedValue({ success: true });

    const successCount = await SyncService.processQueue();

    expect(successCount).toBe(1);
    
    // Verify syncQueue is empty
    const queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(0);

    // Verify receiveRecords status updated
    const updatedRecord = await db.receiveRecords.get(recordId);
    expect(updatedRecord?.status).toBe('synced');
    expect(updatedRecord?.syncedAt).toBeDefined();
  });

  it('should handle conflict by updating the queue item instead of deleting it', async () => {
    await db.syncQueue.add({
      action: 'create',
      entityType: 'receive',
      entityId: 123,
      payload: { trackingNumber: 'CONFLICT-001' },
      createdAt: Date.now()
    });

    (ApiClient.postal.saveEntry as any).mockResolvedValue({ 
      success: false, 
      error: 'CONFLICT',
      details: 'Already delivered'
    });

    const successCount = await SyncService.processQueue();

    expect(successCount).toBe(0);
    
    // Verify queue item still exists and has conflict data
    const queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(1);
    expect(queue[0].payload.conflict).toBeDefined();
    expect(queue[0].payload.conflict.error).toBe('CONFLICT');
  });

  it('should handle network errors and mark record as failed', async () => {
    const recordId = await db.receiveRecords.add({
      trackingId: 'FAIL-001',
      senderName: '-',
      receiverName: 'User',
      type: 'Normal',
      status: 'pending',
      offlineCreatedAt: Date.now(),
      version: 1
    });

    await db.syncQueue.add({
      action: 'create',
      entityType: 'receive',
      entityId: recordId as number,
      payload: { trackingNumber: 'FAIL-001' },
      createdAt: Date.now()
    });

    (ApiClient.postal.saveEntry as any).mockRejectedValue(new Error('Internal Server Error'));

    await SyncService.processQueue();

    const updatedRecord = await db.receiveRecords.get(recordId);
    expect(updatedRecord?.status).toBe('failed');
    expect(updatedRecord?.lastError).toBe('Internal Server Error');
  });
});
