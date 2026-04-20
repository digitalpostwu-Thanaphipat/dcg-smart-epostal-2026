import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
  X,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Package,
  User,
  Download,
  RefreshCw,
  Loader2,
  Inbox,
  Zap,
  ClipboardList
} from 'lucide-react';
import { ApiClient, type PostalPackage } from '@/api/client';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
// import * as XLSX from 'xlsx'; // Removed for Dynamic Import Performance Optimization


export const PostalSearchPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PostalPackage[]>([]);
  const [showFilters, setShowFilters] = useState(false); // Mobile Drawer Toggle
  const { departments } = useMasterDataStore();
  
  // Intelligence Filters
  const currentFY = String(new Date().getFullYear() + 543);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    department: '', 
    dateFrom: '',
    dateTo: '',
    fiscalYear: currentFY
  });

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
      if (res.success) {
        const hits = res.data?.results || res.results || [];
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
    const timer = setTimeout(() => {
      handleSearch();
    }, 600); // ดีเลย์ 600ms เพื่อประหยัด API call
    return () => clearTimeout(timer);
  }, [query, filters.status, filters.type]);

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
      'ชื่อผู้รับ': pkg.recipientName || pkg.receiverName || '-',
      'หน่วยงาน': pkg.departmentName || '-',
      'สถานะ': pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว' ? 'ส่งมอบสำเร็จ' : (pkg.status === 'Pending' ? 'รอนำจ่าย' : pkg.status),
      'ประเภท': pkg.type || pkg.itemประเภท || 'พัสดุ',
      'วันที่บันทึก': pkg.timestamp || pkg.created_at ? new Date(pkg.timestamp || pkg.created_at).toLocaleString('th-TH') : '-',
      'วันที่นำจ่าย': pkg.delivered_at ? new Date(pkg.delivered_at).toLocaleString('th-TH') : '-'
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
      <section className="relative overflow-hidden rounded-[3rem] clay-card-deep p-8 sm:p-12 lg:p-16 animate-fade-in border-none">
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
             <div className="relative flex items-center bg-zinc-100/50 dark:bg-zinc-950/50 backdrop-blur-3xl border-2 border-zinc-100 dark:border-zinc-800 p-2 sm:p-3 rounded-[2.5rem] shadow-2xl transition-all group-focus-within:border-primary group-focus-within:bg-white/15">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 ml-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วย เลขที่พัสดุ, ชื่อผู้รับ, หน่วยงาน..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg sm:text-xl font-medium px-4 sm:px-6 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
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
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-heading font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-emerald-500/20"
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black whitespace-nowrap">
                <Tag className="w-3.5 h-3.5" /> {filters.status}
              </div>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black whitespace-nowrap">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((pkg, idx) => (
              <div 
                key={`${pkg.id}-${idx}`}
                className="group relative p-6 clay-card hover:border-primary/50 transition-all animate-slide-fade-in hover:shadow-2xl hover:scale-[1.01] cursor-pointer !rounded-3xl"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Top Row: Icon and Badge */}
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-primary transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      (pkg.status === 'ส่งมอบแล้ว' || pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว') ? "bg-emerald-500/10 text-emerald-500" :
                      (pkg.status === 'รอจ่าย' || pkg.status === 'Pending') ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว' ? 'ส่งมอบสำเร็จ' : 
                       pkg.status === 'Pending' ? 'รอนำจ่าย' : pkg.status}
                    </span>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-widest">
                       {pkg.type || pkg.itemType || 'พัสดุ'}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-heading font-black text-zinc-900 dark:text-white group-hover:text-primary transition-colors leading-tight truncate">
                      {pkg.receiverName || pkg.recipientName}
                    </h3>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                       <Building2 className="w-3.5 h-3.5 opacity-50 text-zinc-400" /> {pkg.department}
                    </p>
                  </div>

                  <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-300" /> {(pkg.date || pkg.receivedAt || "").split(' ')[0]}
                  </p>
                </div>

                {/* Bottom Bar: Tracking ID */}
                <div className="mt-5 pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                  <p className="font-mono text-[11px] font-black text-zinc-400 dark:text-zinc-500 tracking-tighter uppercase">
                    ID: {pkg.id} · {pkg.trackingNo || pkg.trackingNumber}
                  </p>
                  
                  {(pkg.status === 'ส่งมอบแล้ว' || pkg.status === 'Delivered' || pkg.status === 'จ่ายแล้ว') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRevert(pkg); }}
                      className="p-2 rounded-xl bg-orange-500/5 hover:bg-orange-500 text-orange-500 hover:text-white transition-all font-black text-[9px] flex items-center gap-1.5 uppercase tracking-widest shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" /> ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                className="px-12 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-heading font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
             >
               ล้างการกรองทั้งหมด
             </button>
          </div>
        )}
      </div>

      {/* 4. FILTER OVERLAY — Full-screen on mobile (top-aligned), centered modal on desktop */}
      {showFilters && (
        <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-fade-in" 
            onClick={() => setShowFilters(false)}
          />
          
          {/* Panel: full-screen on mobile, contained modal on desktop */}
          <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:mx-4 bg-white dark:bg-zinc-900 sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-zinc-200 dark:sm:border-white/10 flex flex-col overflow-hidden animate-fade-in">
             
             {/* Sticky Header */}
             <div className="shrink-0 px-6 pt-6 pb-4 sm:px-8 sm:pt-8 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h2 className="text-xl sm:text-2xl font-heading font-black text-zinc-900 dark:text-white tracking-tight">เงื่อนไขการกรอง</h2>
                     <p className="text-[9px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest font-heading">ระบุพารามิเตอร์เพื่อจำกัดวงการค้นหา</p>
                   </div>
                   <button 
                     onClick={() => setShowFilters(false)}
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
                      { id: 'มีปัญหา/ตีกลับ', label: 'มีปัญหา' }
                    ].map((s) => (
                      <button 
                        key={s.id}
                        onClick={() => {
                          haptics.light();
                          setFilters(prev => ({ ...prev, status: s.id }));
                        }}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          filters.status === s.id 
                          ? "bg-primary text-white border-primary shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] scale-105" 
                          : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300"
                        )}
                      >
                        {s.label}
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
                      { id: String(new Date().getFullYear() + 542), label: `ปี ${new Date().getFullYear() + 542}` },
                      { id: String(new Date().getFullYear() + 541), label: `ปี ${new Date().getFullYear() + 541}` },
                      { id: 'all', label: 'ค้นหาทุกปี (ช้า)' }
                    ].map((y) => (
                      <button 
                        key={y.id}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setFilters(prev => ({ ...prev, fiscalYear: y.id }));
                        }}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          filters.fiscalYear === y.id 
                          ? "bg-primary text-white border-primary shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] scale-105" 
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
                  className="w-full bg-primary hover:bg-primary-hover text-white p-5 rounded-2xl font-heading font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/30 active:scale-95 btn-primary"
                >
                  ใช้ตัวกรองที่เลือก
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
