import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ApiClient } from '@/api/client';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { toast } from 'react-hot-toast';
import { Mail, Megaphone, Terminal, Bell, Info, Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';
import { haptics } from '@/utils/haptics';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
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
      const response: any = otpRequested
        ? await ApiClient.auth.verifyOtp({ email, otp })
        : await ApiClient.auth.requestOtp({ email });
      if (!otpRequested && response?.success && response?.requiresOtp) {
        setOtpRequested(true);
        haptics.success();
        toast.success(response.message || 'ส่งรหัสยืนยันไปที่อีเมลแล้ว');
        return;
      }
      if (response?.success && response?.data) {
        const userData = response.data;
        login({
          email: userData.Email || userData.email || email,
          fullName: userData.FullName || userData.fullName || email,
          role: userData.Role || userData.role || 'User',
          department: userData.Department || userData.department || userData['หน่วยงาน'] || 'มหาลัย',
          picture: userData.Picture || userData.picture || '',
          sessionToken: userData.sessionToken || userData.authToken || '',
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
      
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-emerald-500 text-zinc-950 px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all"
      >
        ข้ามไปที่เนื้อหาหลัก
      </a>
      
      {/* ปุ่มสลับธีม */}
      <button 
        onClick={toggleTheme}
        aria-label="สลับธีมมืด/สว่าง"
        className={`absolute top-8 right-8 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-50 border ${isDark ? 'bg-zinc-900/50 border-white/10 hover:bg-zinc-800' : 'bg-white border-zinc-200 shadow-xl hover:bg-zinc-50'}`}
      >
        {isDark ? <Sun className="w-6 h-6 text-amber-400" aria-hidden="true" /> : <Moon className="w-6 h-6 text-indigo-600" aria-hidden="true" />}
      </button>

      {/* เอฟเฟกต์พื้นหลัง */}
      <div className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] animate-pulse pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] animate-pulse pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`} />
      
      {/* กล่องหลัก */}
      <main id="main-content" className="w-full max-w-[480px] relative z-10 space-y-8">
        
        {/* ส่วนหัว: โลโก้ */}
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-12 duration-1000">
           <div className="relative group">
              <div className={`absolute inset-0 blur-3xl transition-colors duration-700 ${isDark ? 'bg-emerald-500/20 group-hover:bg-emerald-500/40' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`} />
              <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center shadow-2xl border mb-10 relative z-10 overflow-hidden group-hover:scale-105 transition-all duration-500 ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
                 <Mail className={`w-14 h-14 ${isDark ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-emerald-600'}`} aria-hidden="true" />
                 <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent" />
              </div>
           </div>
           
           <div className="text-center space-y-4">
              <h1 className={`text-6xl font-heading font-black tracking-tighter uppercase leading-[0.8] drop-shadow-sm transition-colors duration-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                DCG Smart <br />
                <span className="text-emerald-500 inline-block mt-3">ePostal</span>
              </h1>
              <p className={`text-sm font-bold uppercase tracking-widest px-4 transition-colors duration-500 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                ระบบคัดแยก-นำจ่ายไปรษณีย์ภัณฑ์ภายใน
              </p>
           </div>
        </div>

        {/* บัตรเข้าสู่ระบบ */}
        <div className={`clay-card-deep p-12 relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100 transition-all ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
           <div className={`absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-opacity ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <Terminal className="w-32 h-32" aria-hidden="true" />
           </div>

           <form onSubmit={handleLogin} aria-label="แบบฟอร์มเข้าสู่ระบบ" className="space-y-12 relative z-10">
              <div className="space-y-4">
                 <label htmlFor="email-input" className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 px-2 transition-colors ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <Mail className="w-4 h-4 text-emerald-500" /> ข้อมูลผู้ใช้งานในระบบส่วนกลาง (DCG Central DB)
                 </label>
                  <div className="relative">
                    <input
                      id="email-input"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="ระบุอีเมลผู้ใช้งานของคุณ..."
                      className={`w-full pl-16 pr-8 py-6 border rounded-[2.5rem] transition-all font-heading font-bold text-lg outline-none focus:ring-4 ${isDark ? 'bg-zinc-950 border-white/5 text-white placeholder:text-zinc-700 focus:ring-emerald-500/40 focus:border-emerald-500/60' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-emerald-500/20 focus:border-emerald-400'}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} aria-hidden="true" />
                  </div>
              </div>

              {otpRequested && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <label htmlFor="otp-input" className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 px-2 transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    รหัสยืนยัน 6 หลัก
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="กรอกรหัสจากอีเมล..."
                    className={`w-full px-8 py-6 border rounded-[2.5rem] transition-all font-heading font-black text-3xl tracking-[0.35em] text-center ${isDark ? 'bg-zinc-950 border-white/5 text-white placeholder:text-zinc-700 focus:ring-emerald-500/10 focus:border-emerald-500/50' : 'bg-slate-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-emerald-500/5 focus:border-emerald-400'}`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setOtp('');
                    }}
                    className={`w-full text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-400 hover:text-emerald-400' : 'text-zinc-500 hover:text-emerald-600'}`}
                  >
                    เปลี่ยนอีเมล / ขอรหัสใหม่
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-24 font-black text-xl uppercase tracking-widest rounded-[2.5rem] flex items-center justify-center gap-4 transition-all active:scale-[0.97] group ${isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl'}`}
              >
                 {loading ? (
                   <Loader2 className="w-8 h-8 animate-spin" />
                 ) : (
                   <>
                     {otpRequested ? 'ยืนยันรหัสและเข้าสู่ระบบ' : 'ส่งรหัสยืนยันเข้าใช้งาน'} 
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
                        <ArrowRight className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-zinc-900'}`} aria-hidden="true" /> 
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
                      <Bell className={`w-14 h-14 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} aria-hidden="true" />
                   </div>
                   <div className="flex items-start gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white border-amber-200'}`}>
                         <Megaphone className={`w-6 h-6 animate-bounce ${isDark ? 'text-amber-500' : 'text-amber-600'}`} aria-hidden="true" />
                      </div>
                      <div className="space-y-2 flex-1">
                         <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>
                           <Info className="w-4 h-4" aria-hidden="true" /> ประกาศสำคัญ
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
      </main>

      {/* ส่วนท้าย */}
      <footer aria-label="ข้อมูลส่วนท้าย" className="w-full max-w-[480px] relative z-10 flex items-center justify-between px-8 animate-in fade-in duration-1000 delay-500 border-t border-white/5 pt-6 mt-8">
         <div className="flex flex-col">
            <p className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-700'}`}>เวอร์ชันระบบ</p>
            <p className={`text-base font-black transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>4.0.2</p>
         </div>
         
         <div className="text-right">
            <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 block transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-700'}`}>พัฒนาโดย</p>
            <p className={`text-sm font-black tracking-widest uppercase transition-colors ${isDark ? 'text-emerald-500' : 'text-emerald-800'}`}>ส่วนอำนวยการและสารบรรณ</p>
         </div>
      </footer>
    </div>
  );
};