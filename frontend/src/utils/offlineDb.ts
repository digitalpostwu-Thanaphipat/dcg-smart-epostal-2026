/**
 * offlineDb.ts - Lite Version (LocalStorage)
 * แก้ไขปัญหา TS Error จาก Library idb เพื่อให้บิวด์ผ่านและใช้งานได้ทันที
 */

export const offlineDb = {
  async save(id: string, data: any) {
    try {
      const payload = {
        data,
        updatedAt: Date.now()
      };
      localStorage.setItem(`epostal_cache_${id}`, JSON.stringify(payload));
    } catch (e) {
      console.warn("Offline save failed", e);
    }
  },

  async get(id: string) {
    try {
      const item = localStorage.getItem(`epostal_cache_${id}`);
      if (!item) return null;
      const payload = JSON.parse(item);
      return payload.data;
    } catch {
      return null;
    }
  },

  async clear() {
    localStorage.clear();
  }
};
