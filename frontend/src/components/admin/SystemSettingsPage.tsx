import React, { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, Download, RefreshCcw, History, AlertTriangle, 
  FileJson, Loader2, Zap, Link2, Copy, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { ApiClient } from '@/api/client';
import { toast } from 'react-hot-toast';
import { haptics } from '@/utils/haptics';

export const SystemSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [restoreFileId, setRestoreFileId] = useState('');
  const [trackingLinks, setTrackingLinks] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>({});
  
  // Advanced Tools & Health States
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<any>(null);



  useEffect(() => {
    loadConfigs();
    // Auto run health check on mount quietly
    runQuietHealthCheck();
  }, []);

  const loadConfigs = async () => {
    try {
      const res: any = await ApiClient.admin.getSystemConfigs();
      if (res.success) {
        setConfigs(res.data);
      }
    } catch (e) {
      console.error('Failed to load configs', e);
    }
  };

  const runQuietHealthCheck = async () => {
    try {
      const res: any = await ApiClient.health.check();
      if (res.status) {
        setHealthResults(res);
      }
    } catch (e) {
      console.warn('Quiet health check failed', e);
    }
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    haptics.medium();
    const t = toast.loading('กำลังตรวจเช็คสุขภาพระบบและฐานข้อมูล...');
    try {
      const res: any = await ApiClient.health.check();
      setHealthResults(res);
      if (res.status === 'healthy') {
        haptics.success();
        toast.success('ระบบทำงานปกติ 100% สุขภาพดีเยี่ยม', { id: t });
      } else if (res.status === 'warn') {
        haptics.notification('warning');
        toast.error('พบจุดที่ต้องปรับปรุง (มีข้อเตือนภัย)', { id: t });
      } else {
        haptics.error();
        toast.error('ระบบฐานข้อมูลขัดข้อง กรุณาตรวจสอบรายละเอียด', { id: t });
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'การตรวจสอบสุขภาพระบบล้มเหลว', { id: t });
    } finally {
      setCheckingHealth(false);
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
        runQuietHealthCheck(); // Refresh backup status
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

  const handleLoadTrackingLinks = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังสร้างลิงก์กลางสำหรับติดตามพัสดุ...');
    try {
      const res: any = await ApiClient.admin.getPublicTrackingLinks();
      if (!res.success) throw new Error(res.error);
      setTrackingLinks(Array.isArray(res.data) ? res.data : []);
      haptics.success();
      toast.success('พร้อมคัดลอกลิงก์กลางไปใช้งานแล้ว', { id: t });
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
    const t = toast.loading('กำลังบันทึกการตั้งค่า...');
    try {
      const res: any = await ApiClient.admin.updateSystemConfig(key, value);
      if (res.success) {
        setConfigs((prev: any) => ({ ...prev, [key]: value }));
        haptics.success();
        toast.success('บันทึกการตั้งค่าเรียบร้อย', { id: t });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      haptics.error();
      toast.error(`บันทึกข้อมูลล้มเหลว: ${e.message}`, { id: t });
    }
  };

  // Advanced Tool Actions
  const handleMaintenance = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังจัดระเบียบฐานข้อมูลปีงบประมาณ...');
    try {
      const res: any = await ApiClient.admin.runMaintenance();
      if (res.success || (res.data && !res.error) || typeof res === 'string') {
        haptics.success();
        toast.success(res.message || res.data || 'จัดระเบียบฐานข้อมูลสำเร็จ', { id: t });
        runQuietHealthCheck();
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
        runQuietHealthCheck();
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

  const handleRepairDatabase = async () => {
    setLoading(true);
    haptics.medium();
    const t = toast.loading('กำลังปรับปรุง Schema และซ่อมแซมหัวตาราง...');
    try {
      const res: any = await ApiClient.admin.repairDatabase();
      haptics.success();
      toast.success('ซ่อมแซมโครงสร้างตารางและ Normalization ข้อมูลเรียบร้อย', { id: t });
      runQuietHealthCheck();
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'การซ่อมแซมล้มเหลว', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-body pb-20">
      {/* Hero Header Pattern */}
      <section className="bg-zinc-900 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Database className="w-48 h-48 text-white rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> การจัดการระบบส่วนกลาง
           </div>
           <h1 className="text-4xl lg:text-5xl font-heading font-black text-white tracking-tighter uppercase leading-none">
              การตั้งค่าระบบหลัก<br/>ePostal Control Panel
           </h1>
           <p className="text-zinc-400 text-sm md:text-base max-w-lg font-body font-bold leading-relaxed">
              จัดการลิงก์ติดตามสาธารณะ สำรองข้อมูลพัสดุ ตรวจเช็คสุขภาพฐานข้อมูล และควบคุมตัวแปรระดับสูงผ่านเครื่องมือที่เสถียร
           </p>
        </div>
      </section>

      {/* 3 Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Card 1: ลิงก์ติดตามพัสดุ */}
        <div className="clay-card p-6 shadow-xl flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-base">ลิงก์ติดตามพัสดุ</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">แชร์ลิงก์ให้แผนกย่อยภายนอกเข้าค้นหา</p>
              </div>
            </div>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-bold">
              สร้างพอร์ทัลลิงก์สาธารณะแบบเฉพาะตัวสำหรับแต่คณะหรือฝ่าย เพื่อนำไปผูกหน้าเว็บหลักให้สมาชิกภายนอกติดตามสถานะพัสดุของตนเอง
            </p>

            {trackingLinks.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                {trackingLinks.map((item) => (
                  <div key={item.deptId || item.department} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-2.5 flex items-center justify-between gap-2">
                    <span className="font-black text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">{item.department}</span>
                    <button
                      onClick={() => copyTrackingLink(item.url)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-emerald-500 transition-colors"
                      title="คัดลอกลิงก์"
                      aria-label={`คัดลอกลิงก์สำหรับ ${item.department}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLoadTrackingLinks}
            disabled={loading}
            aria-label="โหลดลิงก์สาธารณะ"
            className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            โหลด / สร้างลิงก์กลาง
          </button>
        </div>

        {/* Card 2: สำรองข้อมูล */}
        <div className="clay-card p-6 shadow-xl flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-base">สำรองข้อมูลระบบ</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">เซฟตี้ฐานข้อมูลลง Google Drive</p>
              </div>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-bold">
              แม้จะมีการสำรองข้อมูลอัตโนมัติรายวัน ท่านสามารถสั่งคัดลอกชีตพัสดุและฐานข้อมูลผู้ใช้ปัจจุบันเก็บแยกไว้ในโฟลเดอร์สำรองแบบแมนนวลได้ทันที
            </p>

            {healthResults?.checks?.find((c: any) => c.name === 'backup') && (
              <div className="p-3.5 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <div className="font-black uppercase tracking-wider text-[10px]">สถานะสำรองข้อมูลล่าสุด:</div>
                <div className="font-bold">{healthResults.checks.find((c: any) => c.name === 'backup').detail}</div>
              </div>
            )}
          </div>

          <button
            onClick={handleBackup}
            disabled={loading}
            aria-label="สำรองข้อมูลทันที"
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            สำรองข้อมูลทันที
          </button>
        </div>

        {/* Card 3: ตรวจสุขภาพระบบ */}
        <div className="clay-card p-6 shadow-xl flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-base">ตรวจสุขภาพระบบ</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">เช็คโครงสร้างและสิทธิ์เชื่อมต่อ</p>
              </div>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-bold">
              เรียกตรวจสอบความสมบูรณ์ของฐานข้อมูลกลาง สิทธิ์การเข้าถึงโฟลเดอร์ Google Drive และตัวแปรระบบหลักแบบเรียลไทม์
            </p>

            {healthResults && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-black uppercase text-[10px] border-b border-zinc-100 dark:border-zinc-800 pb-1">
                  <span>ผลตรวจล่าสุด:</span>
                  <span className={healthResults.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}>
                    {healthResults.status === 'healthy' ? 'ปกติ 100%' : 'ควรปรับปรุง'}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {healthResults.checks.slice(0, 3).map((check: any) => (
                    <div key={check.name} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                      {check.status === 'pass' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="truncate">{check.detail}</span>
                    </div>
                  ))}
                  {healthResults.checks.length > 3 && (
                    <div className="text-[9px] text-zinc-400 font-bold italic">และระบบย่อยอีก {healthResults.checks.length - 3} รายการ...</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleHealthCheck}
            disabled={checkingHealth}
            aria-label="เริ่มการตรวจสอบสุขภาพระบบ"
            className="w-full mt-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checkingHealth ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังตรวจสอบ...
              </>
            ) : 'สแกนสุขภาพระบบ'}
          </button>
        </div>

      </div>

      {/* Advanced Tools Section */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="เครื่องมือขั้นสูง"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-heading font-black text-[10px] uppercase tracking-[0.15em] transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800/80 shadow-sm mx-auto"
        >
          เครื่องมือขั้นสูง (Advanced Tools)
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-6 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 space-y-8 animate-slide-fade-in relative z-20">
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-heading font-black text-zinc-900 dark:text-white uppercase text-sm">แผงควบคุมระดับสูง (Super Admin Sandbox)</h4>
                <p className="text-[10px] font-bold text-zinc-500">การดำเนินการด้านล่างส่งผลโดยตรงต่อพารามิเตอร์และสิทธิ์การทำงานของสคริปต์บนคลาวด์</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: AI Model & Uptime configs */}
              <div className="space-y-6">


                {/* Uptime Monitor config */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">LINE Notify Token (Uptime Alerting)</label>
                    <input 
                      type="password" 
                      placeholder="วาง Token LINE Notify..."
                      className="w-full px-4 py-3.5 bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all font-mono font-medium"
                      value={configs.LINE_NOTIFY_TOKEN || ''}
                      onChange={(e) => setConfigs((prev: any) => ({ ...prev, LINE_NOTIFY_TOKEN: e.target.value }))}
                      onBlur={(e) => updateConfig('LINE_NOTIFY_TOKEN', e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSetupMonitor}
                    disabled={loading || !configs.LINE_NOTIFY_TOKEN}
                    aria-label="ติดตั้งหรืออัปเดตระบบติดตาม Uptime ด้วย LINE Notify"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white border border-zinc-800 text-xs font-black font-heading uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    ติดตั้ง / อัปเดต Uptime Monitor
                  </button>
                </div>
              </div>

              {/* Right Column: Maintenance, Repair, and Restore operations */}
              <div className="space-y-6">
                
                {/* DB operations row */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleMaintenance}
                    disabled={loading}
                    aria-label="เริ่มการจัดเก็บข้อมูลเก่าและทำความสะอาดปีงบประมาณ"
                    className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 text-left space-y-3 transition-all active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <RefreshCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-heading font-black text-zinc-900 dark:text-white text-xs uppercase">Maintenance ปีงบ</h5>
                      <p className="text-zinc-500 text-[9px] leading-relaxed mt-0.5">จัดเก็บแถวข้อมูลเก่าแยกปีงบ</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleRepairDatabase}
                    disabled={loading}
                    aria-label="ซ่อมแซมโครงสร้างและหัวตารางฐานข้อมูล"
                    className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 text-left space-y-3 transition-all active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-heading font-black text-zinc-900 dark:text-white text-xs uppercase">Repair Schema</h5>
                      <p className="text-zinc-500 text-[9px] leading-relaxed mt-0.5">ซ่อมแซมหัวตาราง & Normalization</p>
                    </div>
                  </button>
                </div>

                {/* Restore block */}
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest px-1">กู้คืนระบบจากประวัติ (Database Restore)</label>
                    <input 
                      type="text" 
                      placeholder="ป้อนรหัสไฟล์จาก Drive (File ID)..."
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-mono font-medium"
                      value={restoreFileId}
                      onChange={(e) => setRestoreFileId(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleRestore}
                    disabled={loading || !restoreFileId}
                    aria-label="กู้คืนฐานข้อมูลจาก Google Drive File ID"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black font-heading uppercase text-[10px] tracking-wider transition-colors disabled:opacity-50"
                  >
                    ดำเนินการกู้คืนข้อมูล
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
