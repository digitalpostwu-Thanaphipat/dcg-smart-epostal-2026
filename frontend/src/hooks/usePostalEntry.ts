import { useState, useEffect } from 'react';
import { ApiClient } from '@/api/client';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { haptics } from '@/utils/haptics';
import { db } from '@/db/dexie';

export interface EmsItem {
  trackingNumber: string;
  itemType: string;
  recipientName: string;
  isPersonal: boolean;
  notes: string;
}

export function usePostalEntry() {
  const [loading, setLoading] = useState(false);
  const { departments, fetchMasterData } = useMasterDataStore();
  const { user } = useAuthStore();
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [batchData, setBatchData] = useState({
    departmentId: '',
    personalQty: 0,
    workQty: 0,
    emsList: [] as EmsItem[]
  });

  const selectedDept = departments.find(d => String(d.id) === String(batchData.departmentId));

  const [currentEms, setCurrentEms] = useState<EmsItem>({
    trackingNumber: '',
    itemType: 'EMS',
    recipientName: '',
    isPersonal: false,
    notes: ''
  });

  const [isGlobalPersonal, setIsGlobalPersonal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // AI OCR Handler
  const handleOCR = async (imageBase64: string) => {
    setIsScanning(true);
    haptics.medium();
    const t = toast.loading('AI กำลังประมวลผลรูปภาพ...');
    try {
      const res = await ApiClient.ai.processImage(imageBase64);
      if (res.success) {
        setCurrentEms(prev => ({
          ...prev,
          trackingNumber: res.data.trackingNumber || prev.trackingNumber,
          recipientName: res.data.recipientName || prev.recipientName
        }));
        toast.success('AI ประมวลผลสำเร็จ!', { id: t });
      } else {
        throw new Error(res.error || 'AI ไม่สามารถประมวลผลได้');
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'เกิดข้อผิดพลาดในการประมวลผล', { id: t });
    } finally {
      setIsScanning(false);
    }
  };

  // Check Duplicate from Backend (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (currentEms.trackingNumber.length > 5) {
        setIsCheckingDuplicate(true);
        try {
          const res = await ApiClient.postal.checkDuplicate(currentEms.trackingNumber);
          if (res.data?.isDuplicate) {
            setDuplicateWarning(res.data.detail || "รายการนี้ถูกบันทึกในระบบแล้ว");
          } else {
            setDuplicateWarning(null);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsCheckingDuplicate(false);
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentEms.trackingNumber]);

  const addEmsItem = () => {
    if (!currentEms.trackingNumber) {
      toast.error('กรุณาระบุเลขพัสดุ');
      return;
    }

    // Hard-block Duplicate from Backend
    if (duplicateWarning) {
      haptics.error();
      toast.error(duplicateWarning, {
        icon: '🚫',
        duration: 4000,
        style: { borderRadius: '15px', background: '#e11d48', color: '#fff' }
      });
      return;
    }

    // Duplicate Check in Current Batch
    const isDuplicateInBatch = batchData.emsList.some(item =>
      item.trackingNumber.trim().toUpperCase() === currentEms.trackingNumber.trim().toUpperCase()
    );

    if (isDuplicateInBatch) {
      toast.error('เลขพัสดุนี้มีอยู่ในรายการที่จะบันทึกแล้ว', {
        icon: '⚠️',
        style: { borderRadius: '15px', background: '#333', color: '#fff' }
      });
      return;
    }

    setBatchData(prev => ({
      ...prev,
      emsList: [...prev.emsList, { ...currentEms }]
    }));

    // Reset only tracking and recipient
    setCurrentEms(prev => ({
      ...prev,
      trackingNumber: '',
      recipientName: '',
      notes: ''
    }));
    haptics.medium();
    toast.success('เพิ่มรายการเรียบร้อย');
  };

  const removeEmsItem = (index: number) => {
    haptics.light();
    setBatchData(prev => ({
      ...prev,
      emsList: prev.emsList.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!batchData.departmentId) {
      toast.error('กรุณาเลือกหน่วยงาน/ส่วนราชการ');
      return;
    }
    if (batchData.emsList.length === 0 && batchData.personalQty === 0 && batchData.workQty === 0) {
      toast.error('กรุณาเพิ่มรายการพัสดุหรือจำนวนอย่างน้อย 1 รายการ');
      return;
    }

    setLoading(true);
    const t = toast.loading('กำลังบันทึกข้อมูล...');
    
    const payload = {
      ...batchData,
      departmentName: selectedDept?.DeptName || selectedDept?.name || batchData.departmentId,
      staffEmail: user?.email || 'admin@university.ac.th',
      offlineCreatedAt: Date.now()
    };

    try {
      // 1. Try Online First
      const res = await ApiClient.postal.saveEntry(payload);
      
      if (res.success) {
        // Save to Dexie as 'synced' for history
        for (const item of batchData.emsList) {
          await db.receiveRecords.add({
            trackingId: item.trackingNumber,
            senderName: '-', // Needs OCR or Input
            receiverName: item.recipientName,
            type: item.itemType,
            status: 'synced',
            offlineCreatedAt: payload.offlineCreatedAt,
            syncedAt: Date.now(),
            version: 1
          });
        }

        haptics.success();
        toast.success(res.message || 'บันทึกข้อมูลสำเร็จ (Online)', { id: t });
        
        setBatchData({
          departmentId: '',
          personalQty: 0,
          workQty: 0,
          emsList: []
        });
        fetchMasterData();
      } else {
        throw new Error(res.error || 'Server returned error');
      }
    } catch (error: any) {
      // 2. Offline Fallback
      console.warn('Network failed, falling back to Offline mode', error);
      
      try {
        // Save records as 'pending' for local UI visibility
        for (const item of batchData.emsList) {
          await db.receiveRecords.add({
            trackingId: item.trackingNumber,
            senderName: '-',
            receiverName: item.recipientName,
            type: item.itemType,
            status: 'pending',
            offlineCreatedAt: payload.offlineCreatedAt,
            version: 1
          });
        }

        // Save the ENTIRE batch as a single sync item to preserve workQty/personalQty
        await db.syncQueue.add({
          action: 'create-batch',
          entityType: 'receive',
          entityId: 0,
          payload: payload,
          createdAt: Date.now()
        });

        haptics.notification('warning');
        toast.success('บันทึกข้อมูลแบบ Offline เรียบร้อยแล้ว (จะ Sync เมื่อต่อเน็ตได้)', { id: t, icon: '📶' });
        
        setBatchData({
          departmentId: '',
          personalQty: 0,
          workQty: 0,
          emsList: []
        });
      } catch (dbError: any) {
        haptics.error();
        toast.error('ไม่สามารถบันทึกข้อมูลแบบ Offline ได้: ' + dbError.message, { id: t });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isCheckingDuplicate,
    duplicateWarning,
    batchData,
    setBatchData,
    selectedDept,
    currentEms,
    setCurrentEms,
    isGlobalPersonal,
    setIsGlobalPersonal,
    isScanning,
    handleOCR,
    addEmsItem,
    removeEmsItem,
    handleSubmit
  };
}
