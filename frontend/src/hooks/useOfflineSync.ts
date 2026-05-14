import { useEffect, useState } from 'react';
import { SyncService } from '@/services/SyncService';
import { toast } from 'react-hot-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('กลับมาออนไลน์แล้ว! กำลังเริ่ม Sync ข้อมูล...', { icon: '📡' });
      processQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('คุณกำลังใช้งานโหมด Offline', { icon: '📴' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await SyncService.updatePendingCount();
    setPendingCount(count);
  };

  const processQueue = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const totalSuccess = await SyncService.processQueue();
      if (totalSuccess > 0) {
        toast.success(`Sync ข้อมูลสำเร็จ ${totalSuccess} รายการ`, { icon: '✅' });
      }
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      await updatePendingCount();
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, pendingCount, processQueue };
}
