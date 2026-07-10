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
    // [P2-7 Fix] เดิมใช้ localStorage.clear() → ลบ auth token + theme + ทุกอย่าง
    // แก้เป็นกรองเฉพาะ key ที่ขึ้นต้นด้วย epostal_cache_ เท่านั้น
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('epostal_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Offline clear failed", e);
    }
  }
};
