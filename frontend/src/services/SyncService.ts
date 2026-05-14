import { db } from '@/db/dexie';
import { ApiClient } from '@/api/client';
import { toast } from 'react-hot-toast';

export class SyncService {
  static async updatePendingCount() {
    return await db.syncQueue.count();
  }

  static async processQueue(onProgress?: (total: number) => void) {
    const queue = await db.syncQueue.orderBy('createdAt').toArray();
    if (queue.length === 0) return 0;

    let totalSuccess = 0;

    for (const item of queue) {
      try {
        let res;
        
        if (item.action === 'create-batch' && item.entityType === 'receive') {
           res = await ApiClient.postal.saveEntry(item.payload);
        } else if (item.action === 'create' && item.entityType === 'receive') {
           res = await ApiClient.postal.saveEntry({
              ...item.payload,
              emsList: [item.payload]
           });
        } else if (item.action === 'update' && item.payload.action === 'confirmDelivery') {
           res = await ApiClient.postal.confirm(item.payload);
        }

        if (res && res.success) {
          await db.syncQueue.delete(item.id!);
          
          if (item.action === 'create-batch') {
            await db.receiveRecords
              .where('offlineCreatedAt')
              .equals(item.payload.offlineCreatedAt)
              .modify({ status: 'synced', syncedAt: Date.now() });
          } else if (item.action === 'create') {
            await db.receiveRecords.update(item.entityId, { status: 'synced', syncedAt: Date.now() });
          }
          
          totalSuccess++;
          if (onProgress) onProgress(totalSuccess);
        } else if (res && res.error === 'CONFLICT') {
           console.error('Sync Conflict detected for item:', item.id);
           await db.syncQueue.update(item.id!, { 
             payload: { ...item.payload, conflict: res } 
           });
           toast.error('พบข้อขัดแย้งของข้อมูล กรุณาตรวจสอบการนำจ่ายอีกครั้ง', { icon: '⚠️' });
        }
      } catch (error: any) {
        console.error(`Sync failed for item ${item.id}`, error);
        if (item.action === 'create') {
           await db.receiveRecords.update(item.entityId, { 
             status: 'failed', 
             lastError: error.message 
           });
        }
      }
    }

    return totalSuccess;
  }
}
