import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Download, RefreshCcw, History, AlertTriangle, FileJson, Loader2, Zap, Cpu, Sparkles, CheckCircle2, Link2, Copy } from 'lucide-react';
import { ApiClient } from '@/api/client';
import { toast } from 'react-hot-toast';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

export const SystemSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [restoreFileId, setRestoreFileId] = useState('');
  const [trackingLinks, setTrackingLinks] = useState<any[]>([]);

  const [activeAiModel, setActiveAiModel] = useState('gemini-1.5-flash');
  const [configs, setConfigs] = useState<any>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res: any = await ApiClient.admin.getSystemConfigs();
      if (res.success) {
        setConfigs(res.data);
        if (res.data.active_ai_model) {
          setActiveAiModel(res.data.active_ai_model);
        }
      }
    } catch (e) {
      console.error('Failed to load configs', e);
    }
  };

  const handleUpdateModel = async (modelId: string) => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading(`กำลังเปลี่ยนเป็น ${modelId}...`);
    try {
      const res: any = await ApiClient.admin.updateSystemConfig('active_ai_model', modelId);
      if (res.success) {
        setActiveAiModel(modelId);
        haptics.success();
        toast.success(`เปลี่ยนโมเดลเป็น ${modelId} เรียบร้อยแล้ว`, { id: t });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'ไม่สามารถเปลี่ยนโมเดลได้', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const aiModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'เน้นความเร็วสูง ประหยัดพลังงาน เหมาะสำหรับงาน OCR ทั่วไป', type: 'High Speed' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'เน้นความแม่นยำสูงสุดและตรรกะที่ซับซ้อน เหมาะสำหรับงานเอกสารที่มีลายมือ', type: 'High Intelligence' }
  ];

  const handleMaintenance = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังจัดระเบียบฐานข้อมูลปีงบประมาณ...');
    try {
      const res: any = await ApiClient.admin.runMaintenance();
      if (res.success || (res.data && !res.error) || typeof res === 'string') {
        haptics.success();
        toast.success(res.message || res.data || 'จัดระเบียบฐานข้อมูลสำเร็จ', { id: t });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'เกิดข้อผิดพลาดในการจัดระเบียบข้อมูล', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังสำรองข้อมูลเข้าสู่ Google Drive...');
    try {
      const res: any = await ApiClient.admin.createManualBackup();
      if (res.success) {
        haptics.success();
        toast.success('สำรองข้อมูลสำเร็จเรียบร้อย', { id: t });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'การสำรองข้อมูลล้มเหลว', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFileId) {
      toast.error('กรุณาระบุรหัสไฟล์ (File ID) เพื่อกู้คืน');
      return;
    }
    if (!confirm('คำเตือน: การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด คุณต้องการดำเนินการต่อใช่หรือไม่?')) return;

    setLoading(true);
    haptics.error();
    const t = toast.loading('กำลังกู้คืนข้อมูลระบบ... กรุณารอสักครู่');
    try {
      const res: any = await ApiClient.admin.restoreFromBackup({ fileId: restoreFileId });
      if (res.success) {
        haptics.success();
        toast.success('กู้คืนข้อมูลสำเร็จ ระบบจะรีเฟรชใหม่', { id: t });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'การกู้คืนข้อมูลล้มเหลว', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMonitor = async () => {
    if (!configs.LINE_NOTIFY_TOKEN) {
      toast.error('กรุณาระบุ LINE Notify Token ก่อนเปิดใช้งานระบบติดตาม');
      return;
    }
    
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังติดตั้งระบบติดตาม Uptime...');
    try {
      const res: any = await ApiClient.admin.setupUptimeMonitor();
      if (res.success) {
        haptics.success();
        toast.success(res.message || 'ติดตั้งระบบติดตามสำเร็จ (ตรวจสอบทุก 10 นาที)', { id: t });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'ไม่สามารถติดตั้งระบบติดตามได้', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTrackingLinks = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังสร้างลิงก์กลางสำหรับติดตามพัสดุ...');
    try {
      const res: any = await ApiClient.admin.getPublicTrackingLinks();
      if (!res.success) throw new Error(res.error);
      setTrackingLinks(Array.isArray(res.data) ? res.data : []);
      haptics.success();
      toast.success('พร้อมคัดลอกลิงก์กลางไปแปะบนเว็บแล้ว', { id: t });
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'สร้างลิงก์ไม่สำเร็จ', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = async (url: string) => {
    if (!url) {
      toast.error('ยังไม่มี URL จาก Web App หลัง deploy');
      return;
    }
    await navigator.clipboard.writeText(url);
    haptics.success();
    toast.success('คัดลอกลิงก์แล้ว');
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      const res: any = await ApiClient.admin.updateSystemConfig(key, value);
      if (res.success) {
        setConfigs((prev: any) => ({ ...prev, [key]: value }));
      }
    } catch (e) {
      console.error(`Failed to update config ${key}`, e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in font-body pb-20">
      {/* Hero Header Pattern (Strict Section 2) */}
      <section className="bg-zinc-900 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Database className="w-48 h-48 text-white rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> การจัดการระบบส่วนกลาง
           </div>
           <h1 className="text-4xl lg:text-5xl font-heading font-black text-white tracking-tighter uppercase leading-none">
              การตั้งค่าฐานข้อมูล<br/>และระบบสำรองข้อมูล
           </h1>
           <p className="text-zinc-400 text-sm md:text-base max-w-md font-body font-bold leading-relaxed">
              ดูแลรักษาความปลอดภัยของข้อมูลและจัดการฐานข้อมูลแยกตามปีงบประมาณเพื่อให้ระบบทำงานได้อย่างรวดเร็ว
           </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left: Maintenance & AI Config */}
        <div className="lg:col-span-2 space-y-8">
           {/* Section: AI Engine Selection (Loki Mode) */}
            <div className="clay-card p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Cpu className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white uppercase">เลือกขุมพลัง AI ประมวลผล</h3>
                      <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-tighter">ขุมพลังการประมวลผลอัจฉริยะ (Loki Mode)</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleUpdateModel(model.id)}
                    disabled={loading || activeAiModel === model.id}
                    aria-label={`เลือกโมเดล ${model.name}`}
                    className={cn(
                      "group p-6 rounded-3xl border transition-all text-left space-y-4 relative overflow-hidden active:scale-[0.98]",
                      activeAiModel === model.id 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20" 
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/50 text-zinc-900 dark:text-white"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        activeAiModel === model.id ? "bg-white/20 text-white" : "bg-white dark:bg-zinc-900 shadow-sm text-indigo-500"
                      )}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {activeAiModel === model.id && (
                        <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in duration-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-black text-sm uppercase">{model.name}</h4>
                      </div>
                      <p className={cn(
                        "text-[10px] leading-relaxed mt-1 font-medium line-clamp-2",
                        activeAiModel === model.id ? "text-indigo-100" : "text-zinc-500"
                      )}>
                        {model.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
           </div>
            <div className="clay-card p-8 shadow-xl space-y-8">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Zap className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white uppercase">ระบบจัดเก็บข้อมูลอัตโนมัติ</h3>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-tighter">การบำรุงรักษาฐานข้อมูลและสำรองข้อมูลอัตโนมัติ</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                   onClick={handleMaintenance}
                   disabled={loading}
                   aria-label="จัดระเบียบข้อมูลปีงบประมาณ"
                   className="group p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/50 transition-all text-left space-y-4 active:scale-[0.98]"
                 >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                       <RefreshCcw className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="font-heading font-black text-zinc-900 dark:text-white text-sm uppercase">จัดระเบียบข้อมูลปีงบประมาณ</h4>
                       <p className="text-zinc-500 text-[10px] leading-relaxed mt-1">ย้ายข้อมูลเก่าไปยัง Archive แยกตามปีงบประมาณอัตโนมัติ</p>
                    </div>
                 </button>

                 <button 
                   onClick={handleBackup}
                   disabled={loading}
                   aria-label="สำรองข้อมูลทันที"
                   className="group p-6 rounded-3xl bg-emerald-600 hover:bg-emerald-500 transition-all text-left space-y-4 active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                 >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                       <Download className="w-5 h-5" />
                    </div>
                     <div>
                        <h4 className="font-heading font-black text-white text-sm uppercase">สำรองข้อมูลทันที</h4>
                        <p className="text-white/80 text-[10px] font-bold leading-relaxed mt-1">สร้างไฟล์สำรองปัจจุบันลงใน Google Drive เพื่อความปลอดภัย</p>
                     </div>
                 </button>
              </div>

              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                 <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                 <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">ข้อควรระวัง</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">การจัดระเบียบข้อมูลจะทำการย้ายแถวข้อมูลที่ไม่ได้อยู่ในปีงบประมาณปัจจุบันออกจากชีตหลัก เพื่อรักษาประสิทธิภาพความเร็วของระบบ</p>
                 </div>
              </div>
           </div>

           {/* Section: Uptime Monitor (T-020) */}
           <div className="clay-card p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-heading font-black text-zinc-900 dark:text-white uppercase">ระบบติดตามสถานะเว็บไซต์ (Uptime Monitor)</h3>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-tighter">รับการแจ้งเตือนทันทีผ่าน LINE เมื่อระบบมีปัญหา</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">LINE Notify Token (สำหรับการแจ้งเตือน)</label>
                    <div className="relative">
                       <input 
                         type="password" 
                         placeholder="วาง Token ที่ได้จาก LINE Notify..."
                         className="w-full pl-4 pr-10 py-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all font-medium"
                         value={configs.LINE_NOTIFY_TOKEN || ''}
                         onChange={(e) => setConfigs((prev: any) => ({ ...prev, LINE_NOTIFY_TOKEN: e.target.value }))}
                         onBlur={(e) => updateConfig('LINE_NOTIFY_TOKEN', e.target.value)}
                       />
                    </div>
                 </div>

                 <button 
                   onClick={handleSetupMonitor}
                   disabled={loading || !configs.LINE_NOTIFY_TOKEN}
                   aria-label="เปิดใช้งาน / อัปเดตระบบติดตาม"
                   className="group w-full p-6 rounded-3xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 transition-all text-left flex items-center justify-between active:scale-[0.98]"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <ShieldCheck className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-heading font-black text-white text-sm uppercase">เปิดใช้งาน / อัปเดตระบบติดตาม</h4>
                          <p className="text-zinc-500 text-[10px] font-bold">ตรวจสอบสุขภาพระบบทุก 10 นาที และแจ้งเตือนเมื่อล่ม</p>
                       </div>
                    </div>
                    <Zap className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform" />
                 </button>
              </div>
           </div>

           <div className="clay-card p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Link2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-sm">ลิงก์กลางติดตามพัสดุ</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ใช้ลิงก์เดียว แปะบนเว็บหลักหรือเว็บหน่วยงานได้</p>
                   </div>
                </div>
                <button
                  onClick={handleLoadTrackingLinks}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-heading font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {loading ? 'กำลังโหลด' : 'โหลดลิงก์'}
                </button>
              </div>

              {trackingLinks.length > 0 && (
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {trackingLinks.map((item) => (
                    <div key={item.deptId || item.department} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{item.department}</p>
                        <p className="text-[10px] font-mono font-bold text-zinc-400 truncate">{item.url || 'ต้อง deploy Web App ก่อนจึงจะมี URL'}</p>
                      </div>
                      <button
                        onClick={() => copyTrackingLink(item.url)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-600 transition-colors"
                        aria-label="คัดลอกลิงก์กลางติดตามพัสดุ"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Right: Restoration Control */}
        <div className="space-y-6">
           <div className="clay-card p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <History className="w-5 h-5" />
                 </div>
                 <h3 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-sm">การกู้คืนข้อมูล</h3>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">รหัสไฟล์จาก Google Drive (File ID)</label>
                    <div className="relative group">
                       <input 
                         type="text" 
                         placeholder="ระบุรหัสไฟล์ ID..."
                         className="w-full pl-4 pr-10 py-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-medium"
                         value={restoreFileId}
                         onChange={(e) => setRestoreFileId(e.target.value)}
                       />
                       <FileJson className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-rose-500 transition-colors" />
                    </div>
                 </div>

                 <button 
                   onClick={handleRestore}
                   disabled={loading || !restoreFileId}
                   aria-label="ดำเนินการกู้คืนระบบ"
                   className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black font-heading uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 shadow-2xl shadow-zinc-950/20"
                 >
                    ดำเนินการกู้คืนระบบ
                 </button>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                 <p className="text-[9px] text-zinc-400 leading-relaxed text-center font-bold uppercase tracking-tighter">
                    Restoration is a destructive operation.<br/>Use with extreme caution.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
