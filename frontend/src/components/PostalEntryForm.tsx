import React, { useState, useRef } from 'react';
import { Package, User, Building2, MapPin, Search, CheckCircle2, Plus, Trash2, Camera, Loader2, Send, ClipboardCheck, History, Laptop, ShieldCheck, AlertCircle, Sparkles, Briefcase, UserCog } from 'lucide-react';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { BarcodeScanner } from './ui/BarcodeScanner';
import { SearchableSelect } from './ui/SearchableSelect';
import { cn } from '@/lib/utils';
import { usePostalEntry } from '@/hooks/usePostalEntry';
import { filterBySelectedDept } from '@/lib/filterUtils';

export const PostalEntryForm = () => {
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { departments, personnel, positions, representatives } = useMasterDataStore();
  
  const {
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
  } = usePostalEntry();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleOCR(base64String);
    };
    reader.readAsDataURL(file);
  };

  const recipientOptions = [
    ...(positions || [])
      .filter(pos => filterBySelectedDept(pos, selectedDept))
      .map(pos => ({ 
        id: `pos-${pos.name || pos.PositionName || pos.id}`, 
        label: pos.name || pos.PositionName,
        cleanLabel: pos.name || pos.PositionName,
        icon: Briefcase,
        group: 'ตำแหน่งในหน่วยงาน'
      })),
    ...(personnel || [])
      .filter(p => filterBySelectedDept(p, selectedDept))
      .map(p => ({ 
        id: `person-${p.email || p.Email || p.fullName || p.FullName}`, 
        label: p.fullName || p.FullName,
        cleanLabel: p.fullName || p.FullName,
        icon: User,
        group: 'บุคลากร'
      })),
    ...(representatives || [])
      .filter(r => filterBySelectedDept(r, selectedDept))
      .map(r => ({ 
        id: `rep-${r.id || r.name || r.RepName}`, 
        label: r.name || r.RepName,
        cleanLabel: r.name || r.RepName,
        icon: UserCog,
        group: 'ตัวแทนรับพัสดุ'
      }))
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in font-body pb-20">
      {/* Glassmorphism Header */}
      <section className="clay-card-deep p-8 lg:p-12 shadow-2xl relative z-[100] !rounded-[3rem] overflow-visible">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Send className="w-48 h-48 text-zinc-500 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest border border-primary/20">
                 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> มาตรฐานการบันทึกข้อมูล
              </div>
              <h1 className="text-4xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter uppercase">บันทึกรับไปรษณีย์ภัณฑ์</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-md font-medium">ระบุหน่วยงานปลายทางและบันทึกรายการไปรษณีย์ภัณฑ์ทั้งหมด</p>
           </div>
           
            <div className="w-full md:w-96 space-y-3 relative z-[200]">
              <label htmlFor="dept-select" className="text-zinc-400 text-xs font-heading font-black uppercase tracking-widest">หน่วยงานปลายทาง</label>
              <SearchableSelect
                  id="dept-select"
                  options={departments.map(d => ({ 
                    id: d.id, 
                    label: d.name,
                    subLabel: `${d.building}${d.floor ? ` ชั้น ${d.floor}` : ''}`,
                    icon: Building2
                  }))}
                  value={batchData.departmentId}
                  onChange={(val) => setBatchData({ ...batchData, departmentId: String(val) })}
                  placeholder="ค้นหาชื่อหน่วยงาน..."
               />
              {selectedDept && (
                 <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase">
                       <Building2 className="w-4 h-4" /> {selectedDept.building}
                    </div>
                    {selectedDept.floor && (
                       <div className="flex items-center gap-1.5 text-blue-400 text-xs font-black uppercase">
                          <MapPin className="w-4 h-4" /> ชั้น {selectedDept.floor}
                       </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      </section>

      {/* Main Grid: EMS/Regular/Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column: EMS/Registered Batch */}
        <div className="lg:col-span-2 space-y-6">
           <div className="clay-card p-8 shadow-xl">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white flex items-center gap-3">
                     <ClipboardCheck className="w-7 h-7 text-primary" /> 
                     <span className="whitespace-nowrap">ไปรษณีย์ภัณฑ์ (ลงทะเบียน/EMS)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-full sm:w-auto">
                     <button 
                       onClick={() => {
                        const newPersonal = !isGlobalPersonal;
                        setIsGlobalPersonal(newPersonal);
                        setCurrentEms(prev => ({ ...prev, isPersonal: newPersonal }));
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase transition-all whitespace-nowrap text-center",
                        isGlobalPersonal ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400"
                      )}
                    >ไปรษณีย์ภัณฑ์ส่วนบุคคล</button>
                    <button 
                      onClick={() => {
                        const newPersonal = false;
                        setIsGlobalPersonal(newPersonal);
                        setCurrentEms(prev => ({ ...prev, isPersonal: newPersonal }));
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase transition-all whitespace-nowrap text-center",
                        !isGlobalPersonal ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400"
                      )}
                    >งานมหาวิทยาลัย</button>
                 </div>
              </div>

              {/* Add EMS Form */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 mb-8 space-y-8">
                  {/* AI Scanner Button */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      aria-busy={isScanning}
                      className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isScanning ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Sparkles className="w-5 h-5 animate-pulse" aria-hidden="true" />}
                      <span>{isScanning ? 'AI กำลังประมวลผล...' : 'สแกนหน้าพัสดุ (AI)'}</span>
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={onFileChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Tracking Number */}
                      <div className="space-y-3">
                        <label htmlFor="tracking-input" className="text-sm font-heading font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                           <History className="w-3.5 h-3.5" aria-hidden="true" /> เลขไปรษณีย์ภัณฑ์
                        </label>
                        <div className="relative group">
                           <input 
                             id="tracking-input"
                             type="text"
                             placeholder="สแกนหรือพิมพ์เลข..."
                             className="w-full pl-12 pr-12 py-4 text-base font-heading font-medium bg-white dark:bg-zinc-900 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl border-zinc-100 shadow-sm"
                             value={currentEms.trackingNumber}
                             onChange={(e) => setCurrentEms({ ...currentEms, trackingNumber: e.target.value.toUpperCase() })}
                             onKeyDown={(e) => e.key === 'Enter' && addEmsItem()}
                           />
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" aria-hidden="true" />
                           <button 
                             onClick={() => setShowScanner(true)}
                             aria-label="เปิดกล้องสแกนบาร์โค้ด"
                             className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-primary transition-colors"
                           >
                              <Camera className="w-6 h-6" aria-hidden="true" />
                           </button>
                        </div>
                        {isCheckingDuplicate && <div role="status" className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase text-primary animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> กำลังตรวจสอบเลขซ้ำ...</div>}
                        {duplicateWarning && (
                          <div role="alert" className="flex items-start gap-2 mt-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-[11px] font-bold animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {duplicateWarning}
                          </div>
                        )}
                      </div>

                      {/* Type Selection */}
                      <div className="space-y-3">
                         <label className="text-sm font-heading font-black text-zinc-500 uppercase tracking-widest">ประเภท</label>
                         <div className="grid grid-cols-2 gap-2">
                            {['EMS', 'ลงทะเบียน'].map(type => (
                              <button
                                key={type}
                                onClick={() => setCurrentEms({ ...currentEms, itemType: type })}
                                className={cn(
                                  "px-2 py-4 rounded-xl text-[11px] font-heading font-black border transition-all truncate",
                                  currentEms.itemType === type 
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-md" 
                                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-white dark:hover:bg-zinc-800"
                                )}
                              >{type}</button>
                            ))}
                         </div>
                      </div>
                  </div>

                  {/* Recipient Name - Grouped Dropdown */}
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <label htmlFor="recipient-select" className="flex flex-col mb-1 relative z-20 cursor-pointer">
                           <span className="text-sm font-heading font-black text-zinc-500 uppercase tracking-widest">ชื่อผู้รับไปรษณีย์ภัณฑ์</span>
                           <span className="text-[10px] font-heading font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                              (ตำแหน่ง / บุคลากร / ตัวแทน / พิมพ์เอง)
                           </span>
                        </label>
                        <SearchableSelect
                          id="recipient-select"
                          allowCustom
                          onCustomChange={(val) => setCurrentEms(p => ({ ...p, recipientName: val }))}
                          groupOrder={['ตำแหน่งในหน่วยงาน', 'บุคลากร', 'ตัวแทนรับพัสดุ']}
                          groupIcons={{
                            'ตำแหน่งในหน่วยงาน': Briefcase,
                            'บุคลากร': User,
                            'ตัวแทนรับพัสดุ': UserCog
                          }}
                          options={recipientOptions}
                          value={currentEms.recipientName}
                          onChange={(val) => {
                            const found = recipientOptions.find(o => String(o.id) === String(val));
                            setCurrentEms({ ...currentEms, recipientName: found ? found.cleanLabel : String(val) });
                          }}
                          placeholder={!selectedDept ? "กรุณาเลือกหน่วยงานก่อน..." : recipientOptions.length > 0 ? "ค้นหาชื่อในหน่วยงาน..." : "ไม่พบข้อมูลในระบบ กรุณาพิมพ์เอง..."}
                          disabled={!selectedDept}
                        />
                      </div>

                      {/* Add Button - Directly Under Recipient */}
                      <button 
                        onClick={addEmsItem}
                        className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-primary text-white py-5 rounded-2xl font-heading font-black text-sm sm:text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 text-center"
                      >
                         <Plus className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> <span className="leading-tight">เพิ่มลงในตะกร้ารายการบันทึก</span>
                      </button>
                  </div>
              </div>

              {/* Queue List */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-4 text-xs font-black text-zinc-400 uppercase tracking-widest">
                    <span>รายการรอนำจ่าย ({batchData.emsList.length})</span>
                    <span>จัดการ</span>
                 </div>
                 <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                    {batchData.emsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
                         <Package className="w-16 h-16 mb-4 opacity-10" />
                         <p className="text-base font-bold uppercase tracking-widest opacity-40">ยังไม่มีรายการด่วนในคิว</p>
                      </div>
                    ) : (
                      batchData.emsList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 group animate-in slide-in-from-right-4 duration-300 hover:shadow-lg transition-all">
                           <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs",
                                item.itemType === 'EMS' ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                              )}>
                                 {item.itemType}
                              </div>
                              <div>
                                 <div className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-3">
                                    {item.trackingNumber}
                                    {item.isPersonal && <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black italic">ไปรษณีย์ภัณฑ์ส่วนบุคคล</span>}
                                 </div>
                                 <div className="text-sm font-bold text-zinc-500 mt-0.5">
                                    ผู้รับ: {item.recipientName || '-'}
                                 </div>
                              </div>
                           </div>
                           <button 
                             onClick={() => removeEmsItem(idx)} 
                             aria-label={`ลบรายการ ${item.trackingNumber}`}
                             className="p-3 text-zinc-300 hover:text-rose-500 focus:text-rose-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 bg-zinc-50 dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                           >
                              <Trash2 className="w-5 h-5" aria-hidden="true" />
                           </button>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Regular Mail + Summary */}
        <div className="space-y-6">
           <div className="clay-card p-8 shadow-xl">
              <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white flex items-center gap-3 mb-8">
                 <Package className="w-7 h-7 text-amber-500" /> ไปรษณีย์ธรรมดา
              </h3>
              
              <div className="space-y-6">
                 {/* Regular - Work */}
                 <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                       <Laptop className="w-16 h-16" />
                    </div>
                    <label id="work-qty-label" className="text-xs font-black text-zinc-400 uppercase mb-4 block tracking-widest">จำนวนงานมหาวิทยาลัย</label>
                     <div className="flex items-center justify-center gap-8 relative z-10">
                        <button 
                          onClick={() => setBatchData(p => ({ ...p, workQty: Math.max(0, p.workQty - 1) }))} 
                          aria-label="ลดจำนวนงานมหาวิทยาลัย"
                          aria-controls="work-qty-value"
                          className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-2xl font-black shadow-sm hover:bg-zinc-50 transition-colors active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary"
                        >-</button>
                        <span id="work-qty-value" aria-labelledby="work-qty-label" className="text-5xl font-heading font-black w-20 text-center">{batchData.workQty}</span>
                        <button 
                          onClick={() => setBatchData(p => ({ ...p, workQty: p.workQty + 1 }))} 
                          aria-label="เพิ่มจำนวนงานมหาวิทยาลัย"
                          aria-controls="work-qty-value"
                          className="w-14 h-14 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-2xl font-black shadow-xl hover:scale-105 transition-colors active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary"
                        >+</button>
                     </div>
                 </div>

                 {/* Regular - Personal */}
                 <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                       <User className="w-16 h-16" />
                    </div>
                    <label id="personal-qty-label" className="text-xs font-black text-zinc-400 uppercase mb-4 block tracking-widest">จำนวนส่วนบุคคล (ธรรมดา)</label>
                    <div className="flex items-center justify-center gap-8 relative z-10">
                       <button 
                         onClick={() => setBatchData(p => ({ ...p, personalQty: Math.max(0, p.personalQty - 1) }))} 
                         aria-label="ลดจำนวนจดหมายส่วนบุคคล"
                         aria-controls="personal-qty-value"
                         className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-2xl font-black shadow-sm hover:bg-zinc-50 transition-colors active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary"
                       >-</button>
                       <span id="personal-qty-value" aria-labelledby="personal-qty-label" className="text-5xl font-heading font-black w-20 text-center">{batchData.personalQty}</span>
                       <button 
                         onClick={() => setBatchData(p => ({ ...p, personalQty: p.personalQty + 1 }))} 
                         aria-label="เพิ่มจำนวนจดหมายส่วนบุคคล"
                         aria-controls="personal-qty-value"
                         className="w-14 h-14 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-2xl font-black shadow-xl hover:scale-105 transition-colors active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary"
                       >+</button>
                    </div>
                 </div>
              </div>
           </div>


           {/* Final Summary Card */}
           <div className="clay-card-deep p-8 !bg-primary text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                 <CheckCircle2 className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-6">
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">สรุปการบันทึกรายการ</h4>
                    <div className="text-4xl font-heading font-black tracking-tighter">
                       {batchData.emsList.length + batchData.workQty + batchData.personalQty} <span className="text-base font-medium opacity-80">รายการทั้งหมด</span>
                    </div>
                 </div>
                 
                 <div className="space-y-3 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs font-bold">
                       <span className="opacity-70">งานมหาวิทยาลัย (EMS / ลงทะเบียน)</span>
                       <span className="font-black text-sm">{batchData.emsList.filter(i => !i.isPersonal).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                       <span className="opacity-70">ส่วนบุคคล (EMS / ลงทะเบียน)</span>
                       <span className="font-black text-sm">{batchData.emsList.filter(i => i.isPersonal).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                       <span className="opacity-70">งานมหาวิทยาลัย (ธรรมดา)</span>
                       <span className="font-black text-sm">{batchData.workQty}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                       <span className="opacity-70">ส่วนบุคคล (ธรรมดา)</span>
                       <span className="font-black text-sm">{batchData.personalQty}</span>
                    </div>
                 </div>

                 <button 
                   onClick={handleSubmit}
                   disabled={loading || !!duplicateWarning}
                   className="w-full bg-white text-primary py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 mt-4"
                 >
                    {loading ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-7 h-7" /> ยืนยันบันทึกเข้าระบบ
                      </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            setCurrentEms(prev => ({ ...prev, trackingNumber: code }));
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
