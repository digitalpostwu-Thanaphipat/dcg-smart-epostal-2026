import { db } from '@/db/dexie';
import { ApiClient } from '@/api/client';
import { toast } from 'react-hot-toast';

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000;

/**
 * [P2-10] sleep helper — inject ได้จาก test เพื่อข้าม backoff จริง (เร็ว)
 */
export const _testHooks = {
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

export class SyncService {
  static async updatePendingCount() {
    return await db.syncQueue.count();
  }

  /**
   * [P2-10] processQueue — harden:
   * - max-retry (dead-letter: หลัง MAX_RETRIES ทำเครื่องหมาย failed และเอาออกจากคิว)
   * - exponential backoff ระหว่าง retry
   * - conflict handling: ทำเครื่องหมาย conflict ให้ UI ตัดสินใจ (keep_mine/keep_server)
   * - ลบ dead-letter (item ที่ match ไม่ได้ action) กันค้าง forever
   * - idempotency: ได้รับการคุ้มครองที่ backend (payload.idempotencyKey)
   */
  static async processQueue(onProgress?: (total: number) => void) {
    const queue = await db.syncQueue.orderBy('createdAt').toArray();
    if (queue.length === 0) return 0;

    let totalSuccess = 0;

    for (const item of queue) {
      const attempts = (item.attempts || 0) + 1;
      try {
        let res;

        if (item.action === 'create-batch' && item.entityType === 'receive') {
          res = await ApiClient.postal.saveEntry(item.payload);
        } else if (item.action === 'create' && item.entityType === 'receive') {
          res = await ApiClient.postal.saveEntry({
            ...item.payload,
            emsList: [item.payload]
          });
        } else if (item.action === 'update' && item.payload && item.payload.action === 'confirmDelivery') {
          res = await ApiClient.postal.confirm(item.payload);
        } else {
          // [P2-10] unknown action → dead-letter ทันทีกันค้าง forever
          console.error('Sync dead-letter (unknown action):', item.id, item.action);
          await db.syncQueue.delete(item.id!);
          continue;
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
          // [P2-10] conflict → normalize shape for ConflictDialog
          console.error('Sync Conflict detected for item:', item.id);
          const conflicts = res.conflicts || [];
          const first = conflicts[0] || {};
          await db.syncQueue.update(item.id!, {
            payload: {
              ...item.payload,
              conflict: {
                packageId: first.packageId || item.payload?.packageIds?.[0] || '',
                currentData: {
                  version: first.current || 0,
                  status: first.currentStatus || ''
                },
                conflicts: conflicts
              }
            },
            conflict: true
          });
          toast.error('พบข้อขัดแย้งของข้อมูล กรุณาตรวจสอบการนำจ่ายอีกครั้ง', { icon: '⚠️' });
        } else {
          // [P2-10] ข้อผิดพลาดทั่วไป → backoff + retry จนถึง MAX_RETRIES
          await this._handleRetryOrFail(item, attempts, res?.error);
        }
      } catch (error: any) {
        await this._handleRetryOrFail(item, attempts, error.message);
      }
    }

    return totalSuccess;
  }

  /**
   * _handleRetryOrFail — retry ด้วย backoff หรือ dead-letter
   * @private
   */
  static async _handleRetryOrFail(item: any, attempts: number, errorMsg?: string) {
    if (attempts >= MAX_RETRIES) {
      console.error(`Sync dead-letter (max retries): item ${item.id} after ${attempts} attempts: ${errorMsg}`);
      // [P2-10] Mark records as FAILED before deleting queue — user must see the error
      if (item.action === 'create-batch') {
        const batchRecords = item.payload?.emsList || [];
        if (item.payload?.offlineCreatedAt) {
          await db.receiveRecords
            .where('offlineCreatedAt')
            .equals(item.payload.offlineCreatedAt)
            .modify({
              status: 'failed',
              lastError: `ล้มเหลว ${attempts} ครั้ง: ${errorMsg || 'unknown'}`
            });
        } else if (batchRecords.length > 0) {
          // Fallback: mark by tracking IDs
          const trackingIds = batchRecords.map((r: any) => r.trackingNumber).filter(Boolean);
          if (trackingIds.length > 0) {
            await db.receiveRecords
              .where('trackingId')
              .anyOf(trackingIds)
              .modify({
                status: 'failed',
                lastError: `ล้มเหลว ${attempts} ครั้ง: ${errorMsg || 'unknown'}`
              });
          }
        }
      } else if (item.action === 'create') {
        await db.receiveRecords.update(item.entityId, {
          status: 'failed',
          lastError: `ล้มเหลว ${attempts} ครั้ง: ${errorMsg || 'unknown'}`
        });
      }
      // Delete queue AFTER marking records
      await db.syncQueue.delete(item.id!);
      return;
    }

    // exponential backoff: 2s, 4s, 8s, 16s
    const backoff = BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
    console.warn(`Sync retry ${attempts}/${MAX_RETRIES} สำหรับ item ${item.id} ใน ${backoff}ms: ${errorMsg}`);
    await db.syncQueue.update(item.id!, { attempts, lastError: errorMsg });

    // รอ backoff ก่อน item ถัดไป (กัน hammer server)
    await _testHooks.sleep(backoff);
  }

  /**
   * [P2-10] resolveConflict — เรียกจาก UI (ConflictDialog) เมื่อ user เลือก
   * @param itemId id ใน syncQueue
   * @param resolution "keep_mine" | "keep_server"
   */
  static async resolveConflict(itemId: number, resolution: 'keep_mine' | 'keep_server') {
    const item = await db.syncQueue.get(itemId);
    if (!item) return;

    if (resolution === 'keep_server') {
      // ยอมรับฝั่ง server → ลบ item ออกจากคิว + อัปเดต local record
      await db.syncQueue.delete(itemId);
      if (item.action === 'create-batch') {
        await db.receiveRecords
          .where('offlineCreatedAt')
          .equals(item.payload.offlineCreatedAt)
          .modify({ status: 'synced', syncedAt: Date.now() });
      }
      toast.success('ยอมรับข้อมูลจากเซิร์ฟเวอร์แล้ว');
    } else {
      // keep_mine → ลบ flag conflict + bump version ให้ retry ใหม่
      const newPayload = { ...item.payload };
      delete newPayload.conflict;
      // bump expectedVersions ถ้ามี (กัน conflict ซ้ำ)
      if (newPayload.expectedVersions && typeof newPayload.expectedVersions === 'object') {
        Object.keys(newPayload.expectedVersions).forEach(k => {
          newPayload.expectedVersions[k] = (newPayload.expectedVersions[k] || 0) + 1;
        });
      }
      await db.syncQueue.update(itemId, {
        payload: newPayload,
        conflict: false,
        attempts: 0,
        lastError: undefined
      });
      toast.success('จะส่งข้อมูลของคุณอีกครั้ง');
    }
  }
}

