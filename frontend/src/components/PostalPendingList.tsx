import React, { useEffect, useState, useMemo } from 'react';
import { Package, CheckCircle2, Clock, ChevronUp, ChevronDown, Building2, RefreshCw, Truck, Send, Zap, Loader2, ClipboardList, Search, X, Users, User, AlertTriangle, Lock, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/api/client';
import { toast } from 'react-hot-toast';
import { SignaturePad } from './ui/SignaturePad';
import { db } from '@/db/dexie';
import { useAuthStore } from '@/store/useAuthStore';
import { ConflictDialog } from './common/ConflictDialog';
import { cn, formatThaiDate } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { getBuildingColorClass } from '@/utils/designUtils';

// Optimized Memoized Component for Individual Package Items
const PackageItem = React.memo(({ 
  pkg, 
  isSelected, 
  canManageDept, 
  togglePackage, 
  handleReportIssue 
}: { 
  pkg: any, 
  isSelected: boolean, 
  canManageDept: boolean, 
  togglePackage: (id: string) => void, 
  handleReportIssue: (e: React.MouseEvent, pkg: any) => void 
}) => {
  const buildingColor = getBuildingColorClass(pkg.building || '', 'bg');
  const buildingLightBg = getBuildingColorClass(pkg.building || '', 'lightBg');

  return (
    <div 
      onClick={() => {
        if (canManageDept) togglePackage(pkg.id);
        else {
          toast.error('คุณมีสิทธิ์จัดการเฉพาะพัสดุของหน่วยงานตัวเองเท่านั้น', { id: 'rbac-error' });
          haptics.error();
        }
      }}
      className={cn(
        "group relative p-6 rounded-[2.5rem] border transition-all cursor-pointer animate-in fade-in zoom-in duration-300 overflow-hidden",
        canManageDept ? "hover:scale-[1.03] hover:shadow-2xl active:scale-[0.97]" : "opacity-80 grayscale-[20%]",
        isSelected 
          ? "bg-primary border-primary text-white shadow-xl shadow-primary/30" 
          : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:border-primary/40 shadow-sm shadow-zinc-200/50"
      )}
    >
       {/* Building Color Stripe */}
       <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all", isSelected ? "bg-white/40" : buildingColor)} />

       {/* Top Row: Icon & Status & Tracking */}
       <div className="flex justify-between items-start mb-6">
          <div className="flex gap-3">
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-500", 
              isSelected ? "bg-white/20 text-white rotate-12" : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 group-hover:text-primary group-hover:rotate-0"
            )}>
               <Package className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isSelected ? "text-white/60" : "text-zinc-400")}>Tracking No.</span>
              <span className={cn("text-sm font-mono font-black tracking-tighter", isSelected ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                {pkg.trackingNumber || pkg.trackingNo || "ไม่มีเลขพัสดุ"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
             <div className={cn(
               "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
               isSelected 
                 ? "bg-white/20 text-white" 
                 : (pkg.status === 'รอจ่าย' || pkg.status === 'รอนำจ่าย' || pkg.status === 'Pending')
                   ? "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                   : "bg-rose-500/10 text-rose-500 border border-rose-500/10"
             )}>
                {pkg.status === 'Pending' ? 'รอนำจ่าย' : (pkg.status || 'รอนำจ่าย')}
             </div>
             
             {canManageDept && (
               <button 
                 onClick={(e) => handleReportIssue(e, pkg)}
                 className={cn(
                   "p-2.5 rounded-xl border transition-all hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-90",
                   isSelected ? "bg-white/10 border-white/20 text-white" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-300"
                 )}
                 title="แจ้งปัญหา/ตีกลับ"
               >
                 <AlertTriangle className="w-4 h-4" />
               </button>
             )}
          </div>
       </div>
       
       {/* Content Area */}
       <div className="space-y-4">
          <div className="space-y-1.5">
            <h4 className={cn("text-xl font-heading font-black tracking-tight leading-tight truncate", isSelected ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
              {pkg.recipientName || pkg.receiverName || 'ไม่ระบุชื่อผู้รับ'}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-colors", isSelected ? "bg-white/20 text-white border border-white/20" : buildingLightBg)}>
                {pkg.building || 'ไม่ระบุอาคาร'}
              </div>
              <p className={cn("text-xs font-bold flex items-center gap-1.5", isSelected ? "text-white/70" : "text-zinc-400")}>
                 <Building2 className="w-3.5 h-3.5 opacity-50" /> {pkg.department || pkg.deptName || 'ไม่ระบุหน่วยงาน'}
              </p>
            </div>
          </div>
          
          <div className={cn("flex items-center justify-between pt-4 border-t mt-2", isSelected ? "border-white/10" : "border-zinc-50 dark:border-zinc-800")}>
             <p className={cn("text-[10px] font-bold flex items-center gap-2", isSelected ? "text-white/70" : "text-zinc-400")}>
                <Clock className="w-3.5 h-3.5 opacity-50" /> {formatThaiDate(pkg.date || pkg.receivedAt)}
             </p>
             <div className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", isSelected ? "bg-white/20 text-white border border-white/10" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500")}>
                {pkg.type || pkg.itemType || 'พัสดุทั่วไป'}
             </div>
          </div>
       </div>
       
       {/* Bottom ID Bar (Subtle) */}
       <div className={cn("mt-4 pt-3 border-t", isSelected ? "border-white/10" : "border-zinc-50 dark:border-zinc-800")}>
          <div className="flex justify-between items-center">
            <p className={cn("font-mono text-[8px] font-black tracking-widest uppercase opacity-40", isSelected ? "text-white" : "text-zinc-400")}>
              SYS-ID: {pkg.id}
            </p>
            {pkg.floor && pkg.floor !== "-" && (
              <span className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-white/60" : "text-zinc-400")}>
                Floor: {pkg.floor}
              </span>
            )}
          </div>
       </div>

       {isSelected && (
          <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
             <div className="bg-white rounded-full p-1 shadow-2xl shadow-primary/50">
                <CheckCircle2 className="w-5 h-5 text-primary" />
             </div>
          </div>
       )}
    </div>
  );
});

export const PostalPendingList = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [expandedBuildings, setExpandedBuildings] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [confirmingBatch, setConfirmingBatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuthStore();
  
  // Conflict States
  const [activeConflict, setActiveConflict] = useState<any>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.postal.getPending();
      if (!res) throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Response is null)");
      
      if (!res.success) {
        setError(res.error || "เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์");
        setLoading(false);
        return;
      }

      const rawData = res.data || (Array.isArray(res) ? res : []);
      
      // Normalize API field names → frontend field names + ensure unique IDs
      const seenIds = new Set<string>();
      const data = rawData.map((pkg: any, idx: number) => {
        let baseId = pkg.packageId || pkg.id || `pkg-${idx}`;
        // Ensure unique IDs (backend may have duplicates for batch entries)
        let uniqueId = baseId;
        let suffix = 1;
        while (seenIds.has(uniqueId)) {
          uniqueId = `${baseId}-${suffix++}`;
        }
        seenIds.add(uniqueId);
        return {
          ...pkg,
          id: uniqueId,
          department: pkg.department || pkg.departmentName || pkg.deptName || 'ไม่ระบุหน่วยงาน',
          building: pkg.building || pkg.buildingName || 'อื่นๆ/ไม่ระบุอาคาร',
          recipientName: pkg.recipientName || pkg.receiverName || 'ไม่ระบุชื่อผู้รับ'
        };
      });
      
      setItems(data);
      
      // Update Dexie Cache
      try {
        await db.pendingDeliveries.clear();
        await db.pendingDeliveries.bulkAdd(data.map((p: any) => ({
          packageId: p.packageId || p.id || `unknown-${Date.now()}`,
          trackingNumber: p.trackingNumber || p.trackingNo || '-',
          departmentName: p.department,
          recipientName: p.recipientName || p.receiverName || '',
          status: 'รอจ่าย',
          version: p.version || 1,
          building: p.building,
          receivedAt: p.receivedAt || p.createdAt || ''
        })));
      } catch (e) {
        console.warn('Failed to cache pending deliveries:', e);
      }
      
      if (data.length > 0 && data[0].building && expandedBuildings.length === 0) {
        setExpandedBuildings([data[0].building]);
      }
    } catch (error) {
      console.error('Fetch Pending Error:', error);
      
      // Try local cache
      const cached = await db.pendingDeliveries.toArray();
      if (cached.length > 0) {
        setItems(cached.map((p: any) => ({
          ...p,
          id: p.packageId,
          department: p.departmentName,
        })));
        toast('แสดงข้อมูลจากหน่วยความจำ (Offline)', { icon: '📶' });
      } else {
        toast.error('ไม่สามารถดึงข้อมูลได้และไม่มีข้อมูลสำรอง');
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Periodically check for conflicts in SyncQueue
    const conflictChecker = setInterval(async () => {
       const conflicts = await db.syncQueue
          .filter(item => !!item.payload.conflict)
          .toArray();
       
       if (conflicts.length > 0 && !showConflictDialog) {
          const conflict = conflicts[0];
          setActiveConflict(conflict);
          setShowConflictDialog(true);
       }
    }, 5000);

    return () => clearInterval(conflictChecker);
  }, [showConflictDialog]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(pkg =>
      (pkg.recipientName || '').toLowerCase().includes(q) ||
      (pkg.trackingNumber || pkg.id || '').toLowerCase().includes(q) ||
      (pkg.department || '').toLowerCase().includes(q) ||
      (pkg.building || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Group: Building → Department → Packages
  const groupedItems = useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {};
    filteredItems.forEach(pkg => {
      const bName = pkg.building || 'อื่นๆ/ไม่ระบุอาคาร';
      const dName = pkg.department || 'ไม่ระบุหน่วยงาน';
      if (!groups[bName]) groups[bName] = {};
      if (!groups[bName][dName]) groups[bName][dName] = [];
      groups[bName][dName].push(pkg);
    });
    return groups;
  }, [filteredItems]);

  const togglePackage = (id: string) => {
    haptics.light();
    setSelectedPackages(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Select/deselect all packages in ONE department only
  const selectAllInDept = (pkgList: any[]) => {
    const ids = pkgList.map(p => p.id);
    const allSelected = ids.every(id => selectedPackages.includes(id));
    if (allSelected) {
      setSelectedPackages(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedPackages(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Get department name of the currently selected packages (for modal display)
  const getSelectedDeptName = (): string => {
    if (selectedPackages.length === 0) return '';
    const firstSelected = items.find(p => p.id === selectedPackages[0]);
    return firstSelected?.department || '';
  };

  const handleOpenSignature = () => {
    // Auto-scroll to top so modal is visible immediately
    // [Skill: haptics-vibration]
    haptics.medium();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowSignature(true), 200);
  };

  const handleConfirmDelivery = async (signatureData: string, receiverName: string, deliveryMethod?: string) => {
    if (selectedPackages.length === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการนำจ่าย');
      return;
    }
    setConfirmingBatch(true);
    
    // Map disambiguated IDs back to original packageIds for backend
    const originalIds = selectedPackages.map(selId => {
      const pkg = items.find(p => p.id === selId);
      return pkg?.packageId || selId;
    });

    const expectedVersions: Record<string, number> = {};
    selectedPackages.forEach(selId => {
      const pkg = items.find(p => p.id === selId);
      if (pkg) expectedVersions[pkg.packageId || selId] = pkg.version || 1;
    });

    try {

      const res = await ApiClient.postal.confirm({ 
        packageIds: originalIds, 
        signatureImage: signatureData,
        signatureName: receiverName,
        receiverName: receiverName,
        deliveryMethod: deliveryMethod || 'เซ็นรับที่เคาน์เตอร์',
        expectedVersions: expectedVersions,
        staffEmail: currentUser?.email || 'system'
      });
      if (res && res.success) {
        haptics.success();
        toast.success(`นำจ่ายไปรษณีย์ภัณฑ์สำเร็จทั้งหมด ${selectedPackages.length} รายการ`);
        setSelectedPackages([]);
        setShowSignature(false);
        fetchItems();
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      if (error.message === 'CONFLICT' || (error.response && error.response.error === 'CONFLICT')) {
         toast.error('พบข้อมูลพัสดุถูกแก้ไขไปแล้ว กรุณารีเฟรชข้อมูล', { duration: 5000 });
      } else {
         // Offline Fallback for Confirmation
         try {
            await db.syncQueue.add({
              action: 'update',
              entityType: 'receive',
              entityId: 0, // Not used for multiple update
              payload: {
                action: 'confirmDelivery',
                packageIds: originalIds,
                signatureImage: signatureData,
                signatureName: receiverName,
                deliveryMethod: deliveryMethod || 'เซ็นรับที่เคาน์เตอร์',
                staffEmail: currentUser?.email || 'system',
                expectedVersions: expectedVersions
              },
              createdAt: Date.now()
            });
            
            toast.success('บันทึกการนำจ่ายแบบ Offline (จะ Sync เมื่อออนไลน์)', { icon: '📶' });
            setSelectedPackages([]);
            setShowSignature(false);
            
            // Optimistic Update local cache
            await db.pendingDeliveries.where('packageId').anyOf(originalIds).delete();
            fetchItems();
         } catch (dbErr) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกการนำจ่าย');
         }
      }
    } finally {
      setConfirmingBatch(false);
    }
  };

  const handleReportIssue = async (e: React.MouseEvent, pkg: any) => {
    e.stopPropagation();
    haptics.medium();
    const reason = window.prompt(`🚩 ระบุสาเหตุที่นำจ่าย ${pkg.recipientName} ไม่ได้:`, "หาตัวไม่พบ / หน่วยงานปิด");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('กรุณาระบาสาเหตุ');
      return;
    }

    try {
      // Use original packageId for backend
      const originalId = pkg.packageId || pkg.id.split('-')[0];
      const res = await ApiClient.postal.reportIssue(originalId, reason);
      if (res.success) {
        toast.success('บันทึกปัญหาพัสดุเรียบร้อยแล้ว');
        fetchItems(); // Refresh list
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleResolveConflict = async (decision: 'keep_mine' | 'keep_server') => {
    if (!activeConflict) return;
    
    try {
      if (decision === 'keep_mine') {
         // Re-queue without the old version (let it overwrite or increment version)
         // Actually, best is to update expected version to current server version
         const serverVersion = activeConflict.payload.conflict.currentData.version || 1;
         const pkgId = activeConflict.payload.conflict.packageId;
         
         const newPayload = { ...activeConflict.payload };
         delete newPayload.conflict;
         newPayload.expectedVersions[pkgId] = serverVersion; // Accept reality and try again
         
         await db.syncQueue.update(activeConflict.id!, { payload: newPayload });
         toast.success('กำลังส่งข้อมูลใหม่ของคุณ...');
      } else {
         // Abandon mine, delete from queue
         await db.syncQueue.delete(activeConflict.id!);
         toast.success('ยกเลิกข้อมูลของคุณและใช้ข้อมูลบนเซิร์ฟเวอร์');
      }
      
      setShowConflictDialog(false);
      setActiveConflict(null);
      fetchItems();
    } catch (e) {
       toast.error('ไม่สามารถแก้ไขข้อขัดแย้งได้');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-body pb-24">
      {/* Page Header */}
      <section className="clay-card-deep p-8 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden !bg-zinc-900 !rounded-[3rem]">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Truck className="w-56 h-56 text-white rotate-[-10deg]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
               <Zap className="w-3 h-3 text-emerald-400" /> ระบบนำจ่ายแบบกลุ่ม
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tighter uppercase leading-none">รายการรอนำจ่าย</h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-400 max-w-xl">เลือกหน่วยงานที่ต้องการนำจ่าย → ตรวจสอบรายการ → ลงนามรับ</p>
          </div>
          <button 
            onClick={fetchItems}
            disabled={loading}
            className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 border border-white/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            รีเฟรช
          </button>
        </div>
      </section>

      {/* Search Bar */}
      <div className="clay-card p-4 sm:p-5 shadow-sm border-none">
         <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-300" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้รับ / เลขพัสดุ / หน่วยงาน / อาคาร..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3.5 sm:py-4 pl-12 pr-12 outline-none text-sm font-heading font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 p-1.5 text-zinc-300 hover:text-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
         </div>
         {searchQuery && (
           <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2">
             พบ {filteredItems.length} รายการจากทั้งหมด {items.length} รายการ
           </p>
         )}
      </div>

      {/* Floating Batch Selection Bar */}
      {selectedPackages.length > 0 && (
         <div className="fixed bottom-6 left-3 right-3 sm:bottom-8 sm:left-4 sm:right-4 md:left-auto md:right-8 z-50 md:w-96 flex flex-col gap-3 p-5 sm:p-6 rounded-3xl bg-zinc-900 text-white shadow-2xl animate-in slide-in-from-bottom-8 duration-500 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
                   <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">เลือกนำจ่าย</p>
                   <h4 className="text-lg font-black tracking-tight leading-none">{selectedPackages.length} รายการ</h4>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPackages([])}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                ยกเลิกทั้งหมด
              </button>
            </div>
            <button 
              onClick={handleOpenSignature}
              className="w-full py-4 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
            >
               <Send className="w-5 h-5" /> ยืนยันการนำจ่ายที่เลือก
            </button>
         </div>
      )}

      {/* Grouped Data Display: Building → Department Cards → Package Details */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900/40 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-zinc-400">กำลังประมวลผลข้อมูลไปรษณีย์ภัณฑ์...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border-2 border-dashed border-red-200 dark:border-red-900/30">
             <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
             <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
             <p className="text-sm font-bold text-red-400 mt-2 max-w-md mx-auto">{error}</p>
             <button 
                onClick={fetchItems}
                className="mt-6 px-8 py-3 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
             >
                ลองใหม่อีกครั้ง
             </button>
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
             <Package className="w-16 h-16 mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
             <h3 className="text-lg font-black text-zinc-400 uppercase tracking-widest">ไม่มีไปรษณีย์ภัณฑ์คงค้าง</h3>
             <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest mt-2">นำจ่ายสำเร็จทุกรายการ</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([building, departments]) => {
            const deptCount = Object.keys(departments).length;
            const totalPkgs = Object.values(departments).flat().length;
            
            return (
            <div key={building} className="space-y-3">
              {/* Building Header */}
              <button 
                onClick={() => {
                  haptics.light();
                  setExpandedBuildings(prev => prev.includes(building) ? prev.filter(b => b !== building) : [...prev, building]);
                }}
                className="w-full flex items-center justify-between p-5 sm:p-7 clay-card hover:shadow-xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-400 group-hover:text-primary transition-colors">
                     <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-left">
                     <h3 className="text-lg sm:text-2xl font-heading font-black text-zinc-900 dark:text-white tracking-tight">{building}</h3>
                     <p className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest">
                       {deptCount} หน่วยงาน | {totalPkgs} ชิ้น
                     </p>
                  </div>
                </div>
                {expandedBuildings.includes(building) ? <ChevronUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300" /> : <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300" />}
              </button>

              {/* Department Cards inside Building */}
              {expandedBuildings.includes(building) && (
                <div className="ml-3 sm:ml-6 md:ml-12 space-y-4 animate-in slide-in-from-top-4 duration-500">
                  {Object.entries(departments).map(([dept, packages]: [string, any]) => {
                    const deptKey = `${building}-${dept}`;
                    const isExpanded = expandedDepartments.includes(deptKey);
                    
                    // RBAC Authorization Check
                    const canManageDept = !currentUser || 
                      currentUser.role === 'Admin' || 
                      currentUser.role === 'Staff' || 
                      (currentUser.role === 'DeptRep' && currentUser.department === dept);

                    const allSelected = packages.every((p: any) => selectedPackages.includes(p.id));
                    const someSelected = packages.some((p: any) => selectedPackages.includes(p.id));

                    return (
                    <div key={deptKey} className="space-y-3">
                      {/* Department Card */}
                      <div className={cn(
                        "rounded-[1.5rem] sm:rounded-[2rem] border transition-all overflow-hidden",
                        someSelected ? "border-primary/30 bg-primary/5" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      )}>
                        <div className="flex items-center justify-between p-4 sm:p-5">
                          <button 
                            onClick={() => {
                              haptics.light();
                              setExpandedDepartments(prev => prev.includes(deptKey) ? prev.filter(d => d !== deptKey) : [...prev, deptKey]);
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                             <div className={cn("p-2.5 rounded-xl", someSelected ? "bg-primary/20 text-primary" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400")}>
                               <Users className="w-5 h-5" />
                             </div>
                             <div className="text-left min-w-0">
                               <span className="text-sm sm:text-base font-heading font-black text-zinc-800 dark:text-zinc-200 block truncate">{dept}</span>
                               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{packages.length} ชิ้นรอนำจ่าย</span>
                             </div>
                             {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-300 shrink-0 ml-2" /> : <ChevronDown className="w-5 h-5 text-zinc-300 shrink-0 ml-2" />}
                          </button>
                          
                          <button 
                            disabled={!canManageDept}
                            onClick={(e) => { e.stopPropagation(); selectAllInDept(packages); }}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all shrink-0 ml-2",
                              allSelected 
                                ? "bg-primary text-white" 
                                : canManageDept 
                                  ? "text-primary hover:bg-primary/10" 
                                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed opacity-50"
                            )}
                          >
                            {!canManageDept ? <Lock className="w-3 h-3 inline pb-0.5" /> : allSelected ? '✓ เลือกแล้ว' : 'เลือกทั้งหมด'}
                          </button>
                        </div>

                        {/* Package Details (expanded) */}
                        {isExpanded && (
                          <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 sm:p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {packages.map((pkg: any) => (
                                <PackageItem 
                                  key={pkg.id}
                                  pkg={pkg}
                                  isSelected={selectedPackages.includes(pkg.id)}
                                  canManageDept={canManageDept}
                                  togglePackage={togglePackage}
                                  handleReportIssue={handleReportIssue}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )})
        )}
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <SignaturePad
          onConfirm={handleConfirmDelivery}
          onClose={() => setShowSignature(false)}
          loading={confirmingBatch}
          selectedItems={items.filter(item => selectedPackages.includes(item.id))}
        />
      )}

      {/* Conflict Dialog */}
      {activeConflict && (
        <ConflictDialog
          isOpen={showConflictDialog}
          onClose={() => setShowConflictDialog(false)}
          onResolve={handleResolveConflict}
          conflictData={{
            packageId: activeConflict.payload.conflict.packageId,
            serverData: {
              status: activeConflict.payload.conflict.currentData.status,
              updatedBy: activeConflict.payload.conflict.currentData.updatedBy
            },
            clientData: {
              status: activeConflict.payload.signatureName ? 'จ่ายแล้ว' : 'กำลังรอนำจ่าย',
              updatedBy: activeConflict.payload.staffEmail
            }
          }}
        />
      )}
    </div>
  );
};
