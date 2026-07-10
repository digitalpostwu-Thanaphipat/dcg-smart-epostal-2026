import Dexie, { type Table } from 'dexie';

export interface ReceiveRecord {
  id?: number;
  trackingId: string;
  senderName: string;
  receiverName: string;
  type: string;
  status: 'pending' | 'synced' | 'failed';
  offlineCreatedAt: number;
  syncedAt?: number;
  lastError?: string;
  version: number; // For Strict Sequencing
}

export interface SyncQueue {
  id?: number;
  action: 'create' | 'update' | 'delete' | 'create-batch';
  entityType: 'receive';
  entityId: number;
  payload: any;
  createdAt: number;
  // [P2-10] retry/conflict tracking fields (optional สำหรับ migration แบบนุ่มนวล)
  attempts?: number;
  conflict?: boolean;
  lastError?: string;
}

export class EpostalDatabase extends Dexie {
  receiveRecords!: Table<ReceiveRecord>;
  syncQueue!: Table<SyncQueue>;
  pendingDeliveries!: Table<any>;

  constructor() {
    super('EpostalDB');
    this.version(3).stores({
      receiveRecords: '++id, trackingId, status, version, offlineCreatedAt',
      syncQueue: '++id, action, entityId, createdAt',
      pendingDeliveries: 'packageId, trackingNumber, status, version'
    });
  }
}

export const db = new EpostalDatabase();
