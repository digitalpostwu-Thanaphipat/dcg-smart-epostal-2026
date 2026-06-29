import React, { useState } from 'react';
import { Package, CheckCircle2, AlertCircle, Clock, TrendingUp, Building2, User, Filter, X, Calendar, Search } from 'lucide-react';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { cn, formatThaiDate } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface StatCardProps {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  trend?: string;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'zinc';
  description?: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, subValue, icon: Icon, trend, color, description, isLoading }: StatCardProps) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  };

  return (
    <div className={cn(
      "relative group overflow-hidden clay-card p-6 lg:p-8 transition-all duration-500 hover:-translate-y-1",
      "hover:shadow-2xl"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl border animate-fade-in transition-transform duration-500 group-hover:scale-110", colorClasses[color])}>
          <Icon className="w-8 h-8 lg:w-10 lg:h-10" />
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> {trend}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm lg:text-base font-black uppercase tracking-[0.2em]">{title}</p>
        <div className="flex items-baseline gap-2">
           <h3 className="text-4xl lg:text-7xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter">
             {isLoading ? <span className="animate-pulse opacity-20">---</span> : value}
           </h3>
           <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {typeof value === 'number' ? 'รายการ' : ''}
           </span>
        </div>
        
        {subValue && !isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-sm bg-zinc-100/50 dark:bg-zinc-800/50 w-fit px-3 py-1 rounded-lg">
             {subValue}
          </div>
        )}

        {description && <p className="text-zinc-400 dark:text-zinc-500 text-xs lg:text-sm font-medium mt-2">{description}</p>}
      </div>

      <div className="absolute -right-4 -bottom-4 opacity-5 transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12">
        <Icon className="w-32 h-32" />
      </div>
    </div>
  );
};

export const BentoStats = () => {
  const { stats, departments, fetchStats, isLoading, statsFilters } = useMasterDataStore();
  
  // Local state for filter inputs (Empty by default for "smart clear")
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const handleApplyFilter = () => {
    fetchStats({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      departmentName: selectedDept || undefined
    });
    // Auto-clear inputs after search as requested
    setStartDate('');
    setEndDate('');
    setSelectedDept('');
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDept('');
    fetchStats(null);
  };

  const isFiltered = !!(statsFilters.startDate || statsFilters.endDate || statsFilters.departmentName);
  
  // Format the applied date label properly
  let dateLabel = "วันนี้";
  if (statsFilters.startDate) {
    const start = formatThaiDate(statsFilters.startDate, false);
    const end = statsFilters.endDate ? formatThaiDate(statsFilters.endDate, false) : 'ปัจจุบัน';
    if (statsFilters.startDate === statsFilters.endDate) {
      dateLabel = start;
    } else {
      dateLabel = `${start} ถึง ${end}`;
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ⚠️ Alert Bar for Pending Departments */}
      {stats.pendingDepts > 0 && (
        <div className="flex items-center justify-between p-4 px-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
               <span className="font-black text-sm uppercase tracking-wider">แจ้งเตือนสถานะนำจ่ายค้าง:</span>
               <span className="text-sm font-medium opacity-80">มีทั้งหมด <span className="font-black underline">{stats.pendingDepts} หน่วยงาน</span> ที่ยังมีพัสดุรอนำจ่าย</span>
            </div>
          </div>
          <Building2 className="w-5 h-5 opacity-20 hidden md:block" />
        </div>
      )}

      {/* 🔍 Filter HUD */}
      <div className="relative z-20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1 space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              <Calendar className="w-3.5 h-3.5" /> ช่วงเวลาที่ตรวจสอบ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-zinc-500 transition-all"
              />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-zinc-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-[1.5] space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
               <Building2 className="w-3.5 h-3.5" /> หน่วยงานผู้รับ
            </label>
            <SearchableSelect
              options={departments.map(d => ({ id: d.name, label: d.name }))}
              value={selectedDept}
              onChange={(val) => setSelectedDept(String(val))}
              placeholder="ทั้งหมดทุกหน่วยงาน (พิมพ์เพื่อค้นหาแบบระบุเองได้)"
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl h-[44px]"
              allowCustom={true}
              onCustomChange={(val) => setSelectedDept(val)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0">
            <button 
              onClick={handleApplyFilter}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-lg active:scale-95 shadow-zinc-500/20"
            >
              <Filter className="w-4 h-4" /> กรองข้อมูล
            </button>
            {isFiltered && (
              <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200/50 transition-all"
                title="ล้างตัวกรอง"
              >
                <X className="w-4 h-4" /> ล้าง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔮 Smart Clear Ribbon / Active Filters */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4 animate-fade-in px-2">
          <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Search className="w-4 h-4" /> กำลังแสดงผล:
          </span>
          {statsFilters.departmentName && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-sm">
              <Building2 className="w-4 h-4" />
              {statsFilters.departmentName}
            </div>
          )}
          {statsFilters.startDate && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20 rounded-xl text-sm font-bold">
              <Calendar className="w-4 h-4" />
              {dateLabel}
            </div>
          )}
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 ml-auto md:ml-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-200/50 rounded-xl transition-all text-xs font-bold uppercase"
            title="ล้างข้อมูลการค้นหาทั้งหมด"
          >
            <X className="w-4 h-4" /> ล้างตัวกรอง
          </button>
        </div>
      )}

      {/* 📊 Bento Cards Implementation */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-12">
        <StatCard
          title={statsFilters.startDate ? `รับเข้าระบบ (${dateLabel})` : "รับเข้าระบบ (วันนี้)"}
          value={stats.todayReceived}
          subValue={`ลงทะเบียน ${stats.regCount}, ธรรมดา ${stats.ordCount}`}
          description="รายการทั้งหมดที่รับเข้าเครื่องในช่วงเวลา"
          icon={Package}
          color="zinc"
          isLoading={isLoading}
        />
        <StatCard
          title={statsFilters.startDate ? `ประเภท: ส่วนบุคคล (${dateLabel})` : "ประเภท: ส่วนบุคคล (วันนี้)"}
          value={stats.personalCount}
          subValue={`งานมหาวิทยาลัย ${stats.todayReceived - stats.personalCount} รายการ`}
          description="รายการที่เจ้าหน้าที่ระบุว่าเป็นเรื่องส่วนตัว"
          icon={User}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title={statsFilters.startDate ? `ส่งสำเร็จ (${dateLabel})` : "ส่งสำเร็จรายหน่วยงาน (วันนี้)"}
          value={stats.successDepts}
          subValue={`จ่ายฝากแล้วรวม ${stats.deliveredToday} รายการ`}
          description="จำนวนหน่วยงานที่รับพัสดุครบ 100% แล้ว"
          icon={CheckCircle2}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="สถานะ: รอนำจ่ายสะสม (ทั้งหมด)"
          value={stats.pendingDepts}
          subValue={`รวมทุกวัน ${stats.pendingDelivery} รายการ`}
          description="จำนวนหน่วยงานที่ยังมีพัสดุค้าง (ไม่อิงวันที่)"
          icon={Building2}
          color="rose"
          isLoading={isLoading}
        />
      </div>

      {/* 📊 Historical YoY Stats (T-005) */}
      {stats.yoy && Object.keys(stats.yoy).length > 0 && (
         <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-6">
           <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <Clock className="w-4 h-4" /> สถิติภาพรวมย้อนหลัง (Historical)
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {Object.keys(stats.yoy).sort((a,b)=>Number(b)-Number(a)).map(year => (
                <div key={year} className="relative overflow-hidden p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/50 hover:shadow-lg hover:-translate-y-1 transition-all">
                   <div className="flex justify-between items-center mb-6">
                     <div className="text-2xl font-heading font-black text-zinc-900 dark:text-white">ปีงบ {year}</div>
                     <span className="px-3 py-1 bg-zinc-200/50 dark:bg-zinc-800 text-[9px] text-zinc-500 font-black rounded-lg uppercase tracking-widest border border-zinc-300/50 dark:border-zinc-700">จัดเก็บ</span>
                   </div>
                   <div className="flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">รับเข้าทั้งหมด (ชิ้น)</div>
                        <div className="text-3xl font-heading font-black text-zinc-700 dark:text-zinc-300">{stats.yoy![year].total.toLocaleString()}</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">ส่งมอบแล้ว</div>
                        <div className="text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                           {stats.yoy![year].total > 0 ? ((stats.yoy![year].completed / stats.yoy![year].total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                   </div>
                </div>
             ))}
           </div>
         </div>
      )}
    </div>
  );
};
