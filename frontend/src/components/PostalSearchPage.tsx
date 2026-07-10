import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Calendar,
  Clock,
  X,
  Building2,
  Tag,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Package,
  User,
  Download,
  Inbox,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ApiClient, type PostalPackage } from '@/api/client';
import { toast } from 'react-hot-toast';
import { cn, formatThaiDate, getThaiFiscalYear } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getBuildingColorClass } from '@/utils/designUtils';
import { Modal } from '@/components/ui/Modal';
// import * as XLSX from 'xlsx'; // Removed for Dynamic Import Performance Optimization


const PAGE_SIZE = 20;

export const PostalSearchPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PostalPackage[]>([]);
  const [showFilters, setShowFilters] = useState(false); // Mobile Drawer Toggle
  const [selectedPackage, setSelectedPackage] = useState<PostalPackage | null>(null);
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const { departments } = useMasterDataStore();

  // Intelligence Filters
  const currentFY = String(getThaiFiscalYear());
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    department: '',
    dateFrom: '',
    dateTo: '',
    fiscalYear: currentFY
  });

  // Pagination derived state
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, currentPage]);

  // [Security] Fetch signature image via authenticated endpoint using packageId
  useEffect(() => {
    if (!selectedPackage?.signature || !selectedPackage?.id) {
      setSignatureImage('');
      return;
    }
    // If signature is already a data URI, use it directly (legacy base64 stored inline)
    if (selectedPackage.signature.startsWith('data:')) {
      setSignatureImage(selectedPackage.signature);
      return;
    }
    // Fetch via authenticated endpoint — backend resolves file ID from packageId
    let cancelled = false;
    ApiClient.admin.getSignatureImage(selectedPackage.id).then((res: any) => {
      if (!cancelled && res?.success && res.data) {
        setSignatureImage(res.data);
      }
    });
    return () => { cancelled = true; };
  }, [selectedPackage?.signature, selectedPackage?.id]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      haptics.light();
    }
    setLoading(true);
    try {
      const res = await ApiClient.postal.searchPackages({
        keyword: query.trim(),
        status: filters.status === 'all' ? '' : filters.status,
        type: filters.type === 'all' ? '' : filters.type,
        department: filters.department,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        fiscalYear: filters.fiscalYear
      });
      if (res && res.success) {
        const hits = Array.isArray(res.data) ? res.data : (res.results || []);
        setResults(hits);
        if (e && (hits.length === 0)) {
          toast.error('ไม่พบข้อมูลพัสดุตามเงื่อนไขที่ระบุ');
        } else if (e) {
          haptics.success();
          toast.success(`พบ ${hits.length} รายการ`);
        }

      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setLoading(false);
    }
  };

  // Real-time Search when query changes (Debounced)
  useEffect(() => {
    setCurrentPage(1); // eslint-disable-line react-hooks/set-state-in-effect
    const timer = setTimeout(() => {
      handleSearch();
    }, 600); // ดีเลย์ 600ms เพื่อประหยัด API call
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.status, filters.type, filters.department, filters.dateFrom, filters.dateTo, filters.fiscalYear]);

  const handleRevert = async (pkg: PostalPackage) => {
    haptics.medium();
    const reason = window.prompt(`🔒 ระบุสาเหตุที่ต้องการยกเลิกการนำจ่ายของ ${pkg.recipientName}:`, "นำจ่ายผิดคน/หน่วยงาน");
    if (reason === null) return; 
    if (!reason.trim()) {
      toast.error('กรุณาระบุสาเหตุ');
      return;
    }

    try {
      const res = await ApiClient.postal.revert({ packageId: pkg.id, reason });
      if (res.success) {
        haptics.success();
        toast.success('ยกเลิกการนำจ่ายสำเร็จ');
        handleSearch();
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'ไม่สามารถยกเลิกการนำจ่ายได้');
    }
  };

  const handleExportExcel = async () => {
    if (results.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    
    haptics.light();
    
    // Dynamic Import for heavy library
    const XLSX = await import('xlsx');
    
    const exportData = results.map((pkg, idx) => ({
      'ลำดับ': idx + 1,
      'เลขพัสดุ': pkg.trackingNumber,
      'ชื่อผู้รับไปรษณีย์ภัณฑ์': pkg.recipientName || pkg.receiverName || '-',
      'หน่วยงาน': pkg.departmentName || '-',
      'สถานะ': pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว' || pkg.status === 'จ่ายสำเร็จ' ? 'ส่งมอบแล้ว' : (pkg.status === 'Pending' || pkg.status === 'รอจ่าย' ? 'รอนำจ่าย' : pkg.status),
      'ประเภท': pkg.type || pkg.itemประเภท || 'พัสดุ',
      'วันที่บันทึก': formatThaiDate(pkg.timestamp || pkg.created_at),
      'วันที่นำจ่าย': formatThaiDate(pkg.delivered_at)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ผลการค้นหาพัสดุ');
    
    const wscols = [{ wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
    worksheet['!cols'] = wscols;

    const fileName = `ePostal_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('ดาวน์โหลดไฟล์ Excel สำเร็จ');
    haptics.success();
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== 'ธุรการกลาง').length;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 relative min-h-[120vh] space-y-6">
      {/* 1. SECTION: HERO SEARCH (MATCHING GLOBAL STYLE) */}
      <section className="relative overflow-hidden rounded-5xl clay-card-deep p-8 sm:p-12 lg:p-16 animate-fade-in border-none">
        {/* Background Icon Accent */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Search className="w-64 h-64 text-zinc-400 dark:text-white rotate-[-10deg]" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/10">
               <Zap className="w-4 h-4" /> ระบบค้นหาและติดตามอัจฉริยะ (Smart Tracking)
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black text-zinc-900 dark:text-white leading-none tracking-tighter uppercase">
                ค้นหาและ <span className="text-primary">ติดตามพัสดุ</span>
              </h1>
              <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400 max-w-xl">
                 สืบค้นข้อมูลพัสดุจากทุกหน่วยงานในระบบ — ตรวจสอบสถานะการนำจ่ายแบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Search Input Layer inside Header or directly below */}
          <form onSubmit={handleSearch} className="relative group max-w-4xl font-body">
             <div className="absolute inset-x-0 inset-y-0 bg-primary/20 blur-2xl group-focus-within:bg-primary/40 transition-all rounded-3xl" />
             <div className="relative flex items-center bg-zinc-100/50 dark:bg-zinc-950/50 backdrop-blur-3xl border-2 border-zinc-100 dark:border-zinc-800 p-2 sm:p-3 rounded-5xl shadow-2xl transition-all group-focus-within:border-primary group-focus-within:bg-white/15">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 ml-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <label htmlFor="admin-search-query" className="sr-only">ค้นหาพัสดุ</label>
                <input
                  id="admin-search-query"
                  type="text"
                  placeholder="ค้นหาด้วย เลขที่พัสดุ, ชื่อผู้รับไปรษณีย์ภัณฑ์, หน่วยงาน..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg sm:text-xl font-medium px-4 sm:px-6 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  aria-label="ค้นหาพัสดุ"
                  className="hidden sm:flex items-center gap-3 bg-primary text-white px-8 lg:px-12 py-4 lg:py-5 rounded-3xl font-heading font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>ค้นหา</>
                  )}
                </button>
             </div>
          </form>
        </div>
      </section>

      {/* 2. SECTION: FILTER BAR */}
      <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-6 p-4 rounded-3xl glass-card shadow-lg border border-white/20 dark:border-zinc-800/30 font-body">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={() => {
              haptics.light();
              setShowFilters(true);
            }}
            aria-label="เปิดเมนูตัวกรองขั้นสูง"
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-heading font-black text-[10px] uppercase tracking-widest transition-all shadow-lg group relative"
          >
            <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> 
            ตัวกรองขั้นสูง
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 font-black animate-bounce">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {/* Export Button */}
          {results.length > 0 && (
            <button 
              onClick={handleExportExcel}
              aria-label="ดาวน์โหลดรายงานเป็นไฟล์ Excel"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-success/10 hover:bg-success/20 text-success dark:text-success/80 font-heading font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-success/20"
            >
              <Download className="w-4 h-4" /> 
              ดาวน์โหลดรายงาน
            </button>
          )}
          
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
          
          {/* Active Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filters.department && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black whitespace-nowrap">
                <Building2 className="w-3.5 h-3.5" /> {filters.department}
              </div>
            )}
            {filters.status !== 'all' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning border border-warning/20 text-[10px] font-black whitespace-nowrap">
                <Tag className="w-3.5 h-3.5" /> {filters.status}
              </div>
            )}
            {filters.type !== 'all' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black whitespace-nowrap">
                <Package className="w-3.5 h-3.5" /> {filters.type}
              </div>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 text-info border border-info/20 text-[10px] font-black whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5" /> ช่วงเวลา
              </div>
            )}
            {filters.fiscalYear && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-black whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" /> ปี {filters.fiscalYear === 'all' ? 'ทั้งหมด' : filters.fiscalYear}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
           พบทั้งหมด <span className="text-zinc-900 dark:text-white underline font-black">{results.length} รายการ</span>
        </div>
      </div>

      {/* 3. SECTION: RESULTS GRID (ALIGNED TO GLOBAL CARD STYLE) */}
      <div className="font-body">
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResults.map((pkg, idx) => {
              const buildingColor = getBuildingColorClass(pkg.building || '', 'bg');
              const buildingLightBg = getBuildingColorClass(pkg.building || '', 'lightBg');
              const isDelivered = pkg.status === 'ส่งมอบแล้ว' || pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว' || pkg.status === 'จ่ายสำเร็จ';

              return (
                <div 
                  key={`${pkg.id}-${idx}`}
                  className={cn(
                    "group relative p-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-4xl transition-all animate-slide-fade-in hover:shadow-2xl hover:scale-[1.03] cursor-pointer overflow-hidden shadow-sm shadow-zinc-200/50",
                    idx === 0 ? "delay-0" :
                    idx === 1 ? "delay-75" :
                    idx === 2 ? "delay-100" :
                    idx === 3 ? "delay-150" :
                    idx === 4 ? "delay-200" :
                    idx === 5 ? "delay-300" :
                    idx === 6 ? "delay-500" :
                    "delay-700"
                  )}
                  onClick={() => { haptics.light(); setSelectedPackage(pkg); }}
                >
                  {/* Building Color Stripe */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all", buildingColor)} />

                  {/* Top Row: Icon & Status & Tracking */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-3">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-zinc-400 group-hover:text-primary transition-all duration-500 group-hover:rotate-12">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Tracking No.</span>
                        <span className="text-sm font-mono font-black tracking-tighter text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                          {pkg.trackingNumber || pkg.trackingNo || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                        isDelivered ? "bg-success/10 text-success border-success/10" :
                        (pkg.status === 'รอจ่าย' || pkg.status === 'รอนำจ่าย' || pkg.status === 'Pending') ? "bg-warning/10 text-warning border-warning/10" :
                        "bg-error/10 text-error border-error/10"
                      )}>
                        {isDelivered ? 'ส่งมอบแล้ว' : 
                         (pkg.status === 'Pending' || pkg.status === 'รอจ่าย' || pkg.status === 'รอนำจ่าย') ? 'รอนำจ่าย' : (pkg.status || 'รอนำจ่าย')}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white group-hover:text-primary transition-colors leading-tight truncate">
                        {pkg.recipientName || pkg.receiverName || 'ไม่ระบุชื่อผู้รับไปรษณีย์ภัณฑ์'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-colors", buildingLightBg)}>
                          {pkg.building || 'ไม่ระบุอาคาร'}
                        </div>
                        <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                           <Building2 className="w-3.5 h-3.5 opacity-50" /> {pkg.department || pkg.deptName || 'ไม่ระบุหน่วยงาน'}
                        </p>
                      </div>
                    </div>

                    {isDelivered && pkg.signerName && pkg.signerName !== "-" && (
                      <div className="p-3 rounded-2xl bg-success/5 border border-success/10 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <p className="text-[10px] font-black text-success uppercase tracking-widest">
                          รับโดย: {pkg.signerName}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800/50 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                        <span className="text-[10px] font-bold text-zinc-500">{formatThaiDate(pkg.date || pkg.receivedAt)}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-[8px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                        {pkg.type || pkg.itemType || 'พัสดุทั่วไป'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom ID Bar (Subtle) */}
                  <div className="mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                    <p className="font-mono text-[8px] font-black tracking-widest uppercase opacity-40 text-zinc-400">
                      SYS-ID: {pkg.id}
                    </p>
                    
                    {isDelivered && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRevert(pkg); }}
                        aria-label="ยกเลิกการนำจ่ายพัสดุรายการนี้"
                        className="p-2.5 rounded-xl bg-warning/5 hover:bg-warning text-warning hover:text-white transition-all font-black text-[9px] flex items-center gap-1.5 uppercase tracking-widest shadow-sm active:scale-90"
                      >
                        <RotateCcw className="w-3 h-3" /> ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
              <div className="text-sm font-bold text-zinc-500">
                หน้า <span className="text-zinc-900 dark:text-white font-black">{currentPage}</span> จาก <span className="text-zinc-900 dark:text-white font-black">{totalPages}</span>
                <span className="text-zinc-400 ml-2">({results.length} รายการ)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { haptics.light(); setCurrentPage(p => Math.max(1, p - 1)); }}
                  disabled={currentPage === 1}
                  aria-label="หน้าก่อนหน้า"
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    currentPage === 1
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 active:scale-95"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
                </button>
                <button
                  onClick={() => { haptics.light(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                  disabled={currentPage === totalPages}
                  aria-label="หน้าถัดไป"
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    currentPage === totalPages
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 active:scale-95"
                  )}
                >
                  ถัดไป <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="glass-card p-24 rounded-[3rem] text-center space-y-6 flex flex-col items-center border border-dashed border-zinc-200 dark:border-zinc-800">
             <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
               <Inbox className="w-12 h-12 opacity-20" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-heading font-black text-zinc-900 dark:text-white uppercase tracking-tighter">ไม่พบข้อมูลพัสดุ</h3>
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-12 leading-relaxed opacity-40">ไม่พบรายการที่ตรงกับพารามิเตอร์การสืบค้นของคุณในขณะนี้</p>
             </div>
             <button 
                onClick={() => {
                  haptics.light();
                  setFilters({ status: 'all', type: 'all', department: '', dateFrom: '', dateTo: '', fiscalYear: currentFY });
                }}
                aria-label="ล้างการกรองทั้งหมด"
                className="px-12 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-heading font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
             >
               ล้างการกรองทั้งหมด
             </button>
          </div>
        )}
      </div>

      {/* 4. FILTER OVERLAY */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        label="เงื่อนไขการกรอง"
        className="items-start sm:items-center"
        contentClassName="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:mx-4"
      >
          <div className="w-full h-full sm:h-auto sm:max-h-[85vh] bg-white dark:bg-zinc-900 sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-zinc-200 dark:sm:border-white/10 flex flex-col overflow-hidden animate-fade-in">
             
             {/* Sticky Header */}
             <div className="shrink-0 px-6 pt-6 pb-4 sm:px-8 sm:pt-8 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h2 className="text-xl sm:text-2xl font-heading font-black text-zinc-900 dark:text-white tracking-tight">เงื่อนไขการกรอง</h2>
                     <p className="text-[9px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest font-heading">ระบุพารามิเตอร์เพื่อจำกัดวงการค้นหา</p>
                   </div>
                   <button 
                     onClick={() => setShowFilters(false)}
                     aria-label="ปิดกล่องเลือกตัวกรอง"
                     className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
             </div>

             {/* Scrollable Body */}
             <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-5 font-body custom-scrollbar">
                {/* สถานะ Group */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase ml-1 block">สถานะพัสดุ</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: 'ทั้งหมด' },
                      { id: 'Pending', label: 'รอนำจ่าย' },
                      { id: 'Delivered', label: 'ส่งมอบแล้ว' },
                      { id: 'มีปัญหา/ตีกลับ', label: 'มีปัญหา/ตีกลับ' }
                    ].map((s) => (
                      <button 
                        key={s.id}
                        onClick={() => {
                          haptics.light();
                          setFilters(prev => ({ ...prev, status: s.id }));
                        }}
                        aria-label={`กรองสถานะเป็น ${s.label}`}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          filters.status === s.id 
                          ? "bg-primary text-white border-primary shadow-success/50 scale-105" 
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item Type Group */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase ml-1 block">ประเภทพัสดุ</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: 'ทั้งหมด' },
                      { id: 'EMS', label: 'EMS' },
                      { id: 'ลงทะเบียน', label: 'ลงทะเบียน' },
                      { id: 'ธรรมดา', label: 'ธรรมดา' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          haptics.light();
                          setFilters(prev => ({ ...prev, type: t.id }));
                        }}
                        aria-label={`กรองประเภทเป็น ${t.label}`}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          filters.type === t.id
                          ? "bg-primary text-white border-primary shadow-success/50 scale-105"
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Group */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase ml-1 flex items-center gap-2 block">
                    <Calendar className="w-4 h-4 text-primary" /> ช่วงเวลาที่รับเข้า
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 ml-2 uppercase tracking-widest">วันที่เริ่มต้น</span>
                      <input 
                        type="date"
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-primary rounded-xl px-3 py-3 text-xs font-bold focus:ring-0 transition-all text-zinc-900 dark:text-white"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 ml-2 uppercase tracking-widest">วันที่สิ้นสุด</span>
                      <input 
                        type="date"
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-primary rounded-xl px-3 py-3 text-xs font-bold focus:ring-0 transition-all text-zinc-900 dark:text-white"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Fiscal Year Group */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase ml-1 block">ปีงบประมาณที่ค้นหา</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: currentFY, label: `ปี ${currentFY} (ปัจจุบัน)` },
                      { id: String(Number(currentFY) - 1), label: `ปี ${Number(currentFY) - 1}` },
                      { id: String(Number(currentFY) - 2), label: `ปี ${Number(currentFY) - 2}` },
                      { id: 'all', label: 'ค้นหาทุกปี (ช้า)' }
                    ].map((y) => (
                      <button 
                        key={y.id}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setFilters(prev => ({ ...prev, fiscalYear: y.id }));
                        }}
                        aria-label={`กรองปีงบประมาณเป็น ${y.label}`}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          filters.fiscalYear === y.id 
                          ? "bg-primary text-white border-primary shadow-success/50 scale-105" 
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300"
                        )}
                      >
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* หน่วยงาน Group */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase ml-1 block">หน่วยงาน</label>
                  <SearchableSelect
                    options={departments.map(d => ({ id: d.name, label: d.name }))}
                    value={filters.department}
                    onChange={(val) => setFilters(prev => ({ ...prev, department: String(val) }))}
                    placeholder="ระบุชื่อหน่วยงาน..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus-within:border-primary rounded-xl h-[48px] text-xs font-bold transition-all text-zinc-900 dark:text-white z-50 block"
                    allowCustom={true}
                    onCustomChange={(val) => setFilters(prev => ({ ...prev, department: val }))}
                  />
                </div>
             </div>

             {/* Sticky Footer Button */}
             <div className="shrink-0 px-6 py-4 sm:px-8 sm:py-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <button 
                  onClick={() => {
                    haptics.medium();
                    handleSearch();
                    setShowFilters(false);
                  }}
                  aria-label="ใช้ตัวกรองที่เลือก"
                  className="w-full bg-primary hover:bg-primary-hover text-white p-5 rounded-2xl font-heading font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/30 active:scale-95 btn-primary"
                >
                  ใช้ตัวกรองที่เลือก
                </button>
             </div>
          </div>
      </Modal>
      {/* 5. PACKAGE DETAIL MODAL */}
      {selectedPackage && (
      <Modal
        isOpen={true}
        onClose={() => setSelectedPackage(null)}
        label="รายละเอียดพัสดุ"
        className="p-4"
        contentClassName="w-full max-w-2xl"
      >
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          (selectedPackage.status === 'ส่งมอบแล้ว' || selectedPackage.status === 'Delivered' || selectedPackage.status === 'จ่ายแล้ว' || selectedPackage.status === 'จ่ายสำเร็จ') ? "bg-success text-white" : "bg-warning text-white"
                       )}>
                          {(selectedPackage.status === 'Delivered' || selectedPackage.status === 'จ่ายแล้ว' || selectedPackage.status === 'จ่ายสำเร็จ') ? 'ส่งมอบแล้ว' : (selectedPackage.status === 'Pending' || selectedPackage.status === 'รอจ่าย') ? 'รอนำจ่าย' : selectedPackage.status}
                       </span>
                       <span className="px-3 py-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                          {selectedPackage.type || selectedPackage.itemType}
                       </span>
                    </div>
                    <h2 className="text-3xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter leading-tight">
                       {selectedPackage.recipientName || selectedPackage.receiverName}
                    </h2>
                    <p className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                       <Building2 className="w-4 h-4" /> {selectedPackage.department}
                    </p>
                 </div>
                 <button onClick={() => setSelectedPackage(null)} aria-label="ปิดหน้าต่างรายละเอียด" className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Delivery Evidence */}
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">ลายเซ็นผู้รับ</label>
                          <div className="aspect-[4/3] rounded-3xl bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                             {signatureImage ? (
                               <img src={signatureImage} alt="Signature" className="w-full h-full object-contain p-4 dark:invert" />
                             ) : (
                               <div className="text-center space-y-2 opacity-20">
                                  <User className="w-12 h-12 mx-auto" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">ไม่มีข้อมูลลายเซ็น</p>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">รูปภาพยืนยัน</label>
                          <div className="aspect-square rounded-3xl bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                             {selectedPackage.photo ? (
                               <img src={selectedPackage.photo} alt="Delivery Proof" className="w-full h-full object-cover" />
                             ) : (
                               <div className="text-center space-y-2 opacity-20">
                                  <Package className="w-12 h-12 mx-auto" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">ไม่มีข้อมูลรูปภาพ</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Meta Data */}
                    <div className="space-y-6">
                       <div className="clay-card-deep p-6 rounded-3xl space-y-6 border-none shadow-none bg-zinc-50/50 dark:bg-white/5">
                          <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">รหัสพัสดุ / เลข Tracking</span>
                                <p className="text-sm font-mono font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                                   {selectedPackage.id}
                                   <span className="block text-primary text-xs mt-1">{selectedPackage.trackingNo || selectedPackage.trackingNumber}</span>
                                </p>
                             </div>
                             
                             <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                             
                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ผู้รับตามจ่าหน้า / ผู้ลงนาม</span>
                                <p className="text-base font-black text-zinc-900 dark:text-white">
                                   {selectedPackage.signerName || "-"}
                                </p>
                             </div>

                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">วิธีการส่งมอบ / ประเภทการใช้</span>
                                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                   {selectedPackage.method || "-"} · {selectedPackage.useType || "-"}
                                </p>
                             </div>

                             <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">เจ้าหน้าที่ผู้นำจ่าย</span>
                                <p className="text-sm font-black text-primary flex items-center gap-2">
                                   <User className="w-4 h-4" /> {selectedPackage.deliverer || "-"}
                                </p>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">เวลาที่รับเข้า</span>
                                   <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                      {formatThaiDate(selectedPackage.date)}
                                   </p>
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">เวลาที่ส่งมอบ</span>
                                   <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                      {formatThaiDate(selectedPackage.deliveredAt)}
                                   </p>
                                </div>
                             </div>

                             {selectedPackage.note && selectedPackage.note !== "-" && (
                               <>
                                 <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                                 <div className="space-y-1">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">หมายเหตุ</span>
                                    <p className="text-xs font-medium text-rose-500 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                                       {selectedPackage.note}
                                    </p>
                                 </div>
                               </>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                 <button 
                   onClick={() => setSelectedPackage(null)}
                   aria-label="ปิดหน้าต่างรายละเอียด"
                   className="px-10 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-heading font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-500/20"
                 >
                    ปิดหน้าต่าง
                 </button>
              </div>
           </div>
      </Modal>
      )}
    </div>
  );
};
