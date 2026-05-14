import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../frontend/src/db/dexie';

describe('Dexie Database Tracer Bullet', () => {
  beforeEach(async () => {
    await db.receiveRecords.clear();
    await db.syncQueue.clear();
  });

  it('should save and retrieve a receive record', async () => {
    const record = {
      trackingId: 'UNIT-TRACER-001',
      senderName: 'Sender A',
      receiverName: 'Receiver B',
      type: 'Normal',
      status: 'pending' as const,
      offlineCreatedAt: Date.now(),
      version: 1
    };

    const id = await db.receiveRecords.add(record);
    const saved = await db.receiveRecords.get(id);

    expect(saved).toBeDefined();
    expect(saved?.trackingId).toBe('UNIT-TRACER-001');
    expect(saved?.status).toBe('pending');
  });

  it('should add items to sync queue', async () => {
    const queueItem = {
      action: 'create' as const,
      entityType: 'receive' as const,
      entityId: 123,
      payload: { data: 'test' },
      createdAt: Date.now()
    };

    const id = await db.syncQueue.add(queueItem);
    const saved = await db.syncQueue.get(id);

    expect(saved).toBeDefined();
    expect(saved?.entityId).toBe(123);
  });

  it('should handle offline fallback: save to Dexie and add to sync queue', async () => {
    // Simulate batchData from hook
    const batchData = {
      emsList: [
        { trackingNumber: 'OFFLINE-001', itemType: 'EMS', recipientName: 'User A' },
        { trackingNumber: 'OFFLINE-002', itemType: 'REG', recipientName: 'User B' }
      ]
    };

    // Simulate handleSubmit offline logic
    for (const item of batchData.emsList) {
      const id = await db.receiveRecords.add({
        trackingId: item.trackingNumber,
        senderName: '-',
        receiverName: item.recipientName,
        type: item.itemType,
        status: 'pending',
        offlineCreatedAt: Date.now(),
        version: 1
      });

      await db.syncQueue.add({
        action: 'create',
        entityType: 'receive',
        entityId: id as number,
        payload: item,
        createdAt: Date.now()
      });
    }

    const records = await db.receiveRecords.toArray();
    const queue = await db.syncQueue.toArray();

    expect(records.length).toBe(2);
    expect(queue.length).toBe(2);
    expect(records[0].status).toBe('pending');
    expect(queue[0].action).toBe('create');
  });

  it('should group items by department for batch sync', async () => {
    // Add multiple items with different departments
    await db.syncQueue.bulkAdd([
      { action: 'create', entityType: 'receive', entityId: 1, payload: { departmentId: 'DEP1', staffEmail: 'a@a.com' }, createdAt: 1 },
      { action: 'create', entityType: 'receive', entityId: 2, payload: { departmentId: 'DEP1', staffEmail: 'a@a.com' }, createdAt: 2 },
      { action: 'create', entityType: 'receive', entityId: 3, payload: { departmentId: 'DEP2', staffEmail: 'b@b.com' }, createdAt: 3 },
    ]);

    const queue = await db.syncQueue.toArray();
    
    // Manual grouping logic for test verification
    const groups = queue.reduce((acc, item) => {
      const key = `${item.payload.departmentId}|${item.payload.staffEmail}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    expect(Object.keys(groups).length).toBe(2);
    expect(groups['DEP1|a@a.com'].length).toBe(2);
    expect(groups['DEP2|b@b.com'].length).toBe(1);
  });
});
