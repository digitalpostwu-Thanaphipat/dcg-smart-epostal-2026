import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ApiClient } from '@/api/client';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { toast } from 'react-hot-toast';
import { ArrowRight, Loader2, Mail, Megaphone, Terminal, Bell, Info, Sun, Moon } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const { theme, setTheme, initTheme } = useThemeStore();
  const { announcements, fetchMasterData } = useMasterDataStore();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    fetchMasterData();
    initTheme();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('กรุณาระบุอีเมลผู้ใช้งาน');
      return;
    }
    setLoading(true);
    try {
      const response: any = await ApiClient.auth.login({ email });
      if (response?.success && response?.data) {
        const userData = response.data;
        login({
          email: userData.email || email,
          fullName: userData.fullName || userData.FullName || email,
          role: userData.role || 'User',
          department: userData.department || userData.Department || userData.หน่วยงาน || 'มหาลัย',
          picture: userData.picture || '',
        });
        haptics.success();
        toast.success('เข้าสู่ระบบสำเร็จ');
      } else {
        haptics.error();
        toast.error(response?.error || 'ไม่พบข้อมูลผู้ใช้งานในระบบส่วนกลาง (DCG Central DB)');
      }
    } catch (error: any) {
      haptics.error();
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบส่วนกลาง');
    } finally {
      setLoading(false);
    }
  };

  // ใช้ชื่อคอลัมน์ที่ตรงกับ Backend Sheet: "สถานะ (แสดง/ซ่อน)" = "แสดง"
  const activeAnnounce = announcements?.find(a => a['สถานะ (แสดง/ซ่อน)'] === 'แสดง');

  const toggleTheme = () => {
    haptics.light();
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-body selection:bg-emerald-500/30 transition-all duration-700 ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>
      
      {/* ปุ่มสลับธีม */}
      <button 
        onClick={toggleTheme}
        aria-label="สลับธีมมืด/สว่าง"
        className={`absolute top-8 right-8 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-50 border ${isDark ? 'bg-zinc-900/50 border-white/10 hover:bg-zinc-800' : 'bg-white border-zinc-200 shadow-xl hover:bg-zinc-50'}`}
      >
        {isDark ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-600" />}
      </button>

      {/* เอฟเฟกต์พื้นหลัง */}
      <div className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] animate-pulse pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] animate-pulse pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`} />
      
      {/* กล่องหลัก */}
      <div className="w-full max-w-[480px] relative z-10 space-y-8">
        
        {/* ส่วนหัว: โลโก้ */}
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-12 duration-1000">
           <div className="relative group">
              <div className={`absolute inset-0 blur-3xl transition-colors duration-700 ${isDark ? 'bg-emerald-500/20 group-hover:bg-emerald-500/40' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`} />
              <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center shadow-2xl border mb-10 relative z-10 overflow-hidden group-hover:scale-105 transition-all duration-500 ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
                 <Mail className={`w-14 h-14 ${isDark ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-emerald-600'}`} />
                 <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent" />
              </div>
           </div>
           
           <div className="text-center space-y-4">
              <h1 className={`text-6xl font-heading font-black tracking-tighter uppercase leading-[0.8] drop-shadow-sm transition-colors duration-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                DCG Smart <br />
                <span className="text-emerald-500 inline-block mt-3">ePostal</span>
              </h1>
              <p className={`text-sm font-bold uppercase tracking-widest px-4 transition-colors duration-500 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                ระบบคัดแยก-นำจ่ายไปรษณีย์ภัณฑ์ภายใน
              </p>
           </div>
        </div>

        {/* บัตรเข้าสู่ระบบ */}
        <div className={`clay-card-deep p-12 relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100 transition-all ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
           <div className={`absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-opacity ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <Terminal className="w-32 h-32" />
           </div>

           <form onSubmit={handleLogin} className="space-y-12 relative z-10">
              <div className="space-y-4">
                 <label className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 px-2 transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <Mail className="w-4 h-4 text-emerald-500" /> ข้อมูลผู้ใช้งานในระบบส่วนกลาง (DCG Central DB)
                 </label>
                 <div className="relative group">
                    <input
                      type="email"
                      required
                      placeholder="ระบุอีเมลผู้ใช้งานของคุณ..."
                      className={`w-full pl-16 pr-8 py-6 border rounded-[2.5rem] transition-all font-heading font-bold text-lg ${isDark ? 'bg-zinc-950 border-white/5 text-white placeholder:text-zinc-800 focus:ring-emerald-500/10 focus:border-emerald-500/50' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-300 focus:ring-emerald-500/5 focus:border-emerald-400'}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${isDark ? 'text-zinc-700 group-focus-within:text-emerald-500' : 'text-zinc-300 group-focus-within:text-emerald-500'}`} />
                 </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-24 font-black text-xl uppercase tracking-widest rounded-[2.5rem] flex items-center justify-center gap-4 transition-all active:scale-[0.97] group ${isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl'}`}
              >
                 {loading ? (
                   <Loader2 className="w-8 h-8 animate-spin" />
                 ) : (
                   <>
                     เข้าสู่ระบบใช้งาน 
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
                        <ArrowRight className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-zinc-900'}`} /> 
                     </div>
                   </>
                 )}
              </button>
           </form>

           {/* แผงประกาศ */}
           {activeAnnounce && (
             <div className="mt-12 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-700 delay-500">
                <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden group transition-all ${isDark ? 'bg-zinc-950/50 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'}`}>
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                      <Bell className={`w-14 h-14 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                   </div>
                   <div className="flex items-start gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white border-amber-200'}`}>
                         <Megaphone className={`w-6 h-6 animate-bounce ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                      </div>
                      <div className="space-y-2 flex-1">
                         <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                           <Info className="w-4 h-4" /> ประกาศสำคัญ
                         </h4>
                         <p className={`text-sm font-bold leading-relaxed transition-colors ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                            {activeAnnounce['หัวข้อประกาศ']}
                         </p>
                         {activeAnnounce['เนื้อหา'] && (
                           <p className={`text-xs leading-relaxed mt-1 transition-colors ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {activeAnnounce['เนื้อหา']}
                           </p>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* ส่วนท้าย */}
        <div className="flex items-center justify-between px-8 animate-in fade-in duration-1000 delay-500">
           <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>เวอร์ชันระบบ</span>
              <span className={`text-base font-black transition-colors ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>4.0.2</span>
           </div>
           
           <div className="text-right">
              <span className={`text-[10px] font-black uppercase tracking-tighter mb-1 block transition-colors ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>พัฒนาโดย</span>
              <span className={`text-sm font-black tracking-widest uppercase transition-colors ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>ส่วนอำนวยการและสารบรรณ</span>
           </div>
        </div>
      </div>
    </div>
  );
};
