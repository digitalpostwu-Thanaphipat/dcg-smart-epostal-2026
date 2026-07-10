import React, { useMemo, useState } from 'react';
import { AlertCircle, Building2, Calendar, CheckCircle2, Clock, LogOut, Loader2, Mail, Package, Search } from 'lucide-react';
import { ApiClient, type PostalPackage } from '@/api/client';
import { cn, getThaiFiscalYear } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const statusOptions = [
  { id: '', label: 'ทั้งหมด' },
  { id: 'Pending', label: 'รอนำจ่าย' },
  { id: 'Delivered', label: 'ส่งมอบแล้ว' },
  { id: 'มีปัญหา/ตีกลับ', label: 'มีปัญหา/ตีกลับ' },
];

function displayStatus(status: string) {
  if (status === 'Pending' || status === 'รอจ่าย' || status === 'รอนำจ่าย') return 'รอนำจ่าย';
  if (status === 'Delivered' || status === 'จ่ายแล้ว' || status === 'จ่ายสำเร็จ' || status === 'ส่งมอบแล้ว') return 'ส่งมอบแล้ว';
  return status || '-';
}

export function PublicTrackingPage() {
  const currentFY = String(getThaiFiscalYear());
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fiscalYear, setFiscalYear] = useState(currentFY);
  const [department, setDepartment] = useState(user?.department || '');
  const [results, setResults] = useState<PostalPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sessionToken = user?.sessionToken || '';
  const canSearch = Boolean(sessionToken);
  const displayDepartment = useMemo(() => department || user?.department || 'หน่วยงานของคุณ', [department, user?.department]);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('กรุณากรอกอีเมลที่มีอยู่ในฐานข้อมูลผู้ใช้');
      return;
    }

    setAuthLoading(true);
    setError('');
    try {
      const res: any = otpRequested
        ? await ApiClient.auth.verifyTrackingOtp({ email: email.trim(), otp })
        : await ApiClient.auth.requestTrackingOtp({ email: email.trim() });

      if (!otpRequested && res?.success && res?.requiresOtp) {
        setOtpRequested(true);
        return;
      }

      if (!res?.success || !res?.data) throw new Error(res?.error || 'เข้าสู่ระบบไม่สำเร็จ');
      const data = res.data;
      const nextUser = {
        email: data.Email || data.email || email.trim(),
        fullName: data.FullName || data.fullName || email.trim(),
        role: data.Role || data.role || 'User',
        department: data.Department || data.department || data['หน่วยงาน'] || '',
        picture: data.Picture || data.picture || '',
        sessionToken: data.sessionToken || data.authToken || '',
      };
      login(nextUser);
      setDepartment(nextUser.department);
      setOtp('');
      setOtpRequested(false);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถยืนยันตัวตนได้');
    } finally {
      setAuthLoading(false);
    }
  };

  const search = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSearch) {
      setError('กรุณาเข้าสู่ระบบด้วยอีเมลและ OTP ก่อนค้นหา');
      return;
    }
    if (keyword.trim().length < 4) {
      setError('กรุณาค้นด้วยเลขพัสดุหรือชื่อผู้รับไปรษณีย์ภัณฑ์อย่างน้อย 4 ตัวอักษร');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await ApiClient.tracking.publicSearch({
        authToken: sessionToken,
        keyword: keyword.trim(),
        status,
        dateFrom,
        dateTo,
        fiscalYear,
      });

      if (!res?.success) throw new Error(res?.error || 'ค้นหาไม่สำเร็จ');
      setDepartment(res.department || displayDepartment);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setResults([]);
    setDepartment('');
    setKeyword('');
    setOtp('');
    setOtpRequested(false);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-4 w-4" />
                {canSearch ? displayDepartment : 'ระบบติดตามพัสดุประจำหน่วยงาน'}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">ติดตามไปรษณีย์ภัณฑ์</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  เข้าสู่ระบบด้วยอีเมลที่ลงทะเบียนไว้ ระบบจะส่ง OTP ไปยังอีเมล และแสดงเฉพาะพัสดุของหน่วยงานคุณ
                </p>
              </div>
            </div>
            {canSearch && (
              <button onClick={handleLogout} aria-label="ออกจากระบบ" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 px-4 text-xs font-black text-zinc-600 transition hover:text-rose-600 dark:border-zinc-800 dark:text-zinc-300">
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!canSearch && (
          <form onSubmit={handleAuth} className="mx-auto max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">อีเมลหน่วยงาน</span>
              <div className="flex min-h-12 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
                <Mail className="h-5 w-5 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-100"
                  placeholder="กรอกอีเมลที่อยู่ในฐานข้อมูล"
                />
              </div>
            </label>

            {otpRequested && (
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">OTP 6 หลัก</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 w-full rounded-md border border-zinc-200 bg-zinc-50 px-4 text-center text-2xl font-black tracking-[0.3em] outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="000000"
                />
              </label>
            )}

            <button type="submit" disabled={authLoading} aria-label={otpRequested ? 'ยืนยัน OTP และเข้าใช้งาน' : 'ส่ง OTP ไปยังอีเมล'} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {otpRequested ? 'ยืนยัน OTP และเข้าใช้งาน' : 'ส่ง OTP ไปยังอีเมล'}
            </button>
          </form>
        )}

        {canSearch && (
          <>
            <form onSubmit={search} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[1fr_auto]">
              <div className="flex min-h-12 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
                <Search className="h-5 w-5 text-zinc-400" />
                <label htmlFor="public-search-keyword" className="sr-only">ค้นด้วยเลขพัสดุหรือชื่อผู้รับไปรษณีย์ภัณฑ์</label>
                <input
                  id="public-search-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-100"
                  placeholder="ค้นด้วยเลขพัสดุหรือชื่อผู้รับไปรษณีย์ภัณฑ์"
                />
              </div>
              <button type="submit" disabled={loading} aria-label="ค้นหาพัสดุ" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                ค้นหา
              </button>
            </form>

            <div className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">สถานะ</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950">
                  {statusOptions.map((option) => <option key={option.id || 'all'} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">วันที่เริ่มต้น</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">วันที่สิ้นสุด</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">ปีงบประมาณ</span>
                <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950">
                  <option value={currentFY}>ปี {currentFY}</option>
                  <option value={String(Number(currentFY) - 1)}>ปี {Number(currentFY) - 1}</option>
                  <option value={String(Number(currentFY) - 2)}>ปี {Number(currentFY) - 2}</option>
                  <option value="all">ทุกปี</option>
                </select>
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((pkg, index) => {
            const statusText = displayStatus(pkg.status);
            const delivered = statusText === 'ส่งมอบแล้ว';
            const issue = statusText === 'มีปัญหา/ตีกลับ';
            return (
              <article key={`${pkg.id}-${index}`} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">เลขพัสดุ</div>
                    <div className="truncate font-mono text-base font-black">{pkg.trackingNumber || pkg.trackingNo || pkg.id}</div>
                  </div>
                  <span className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black',
                    delivered ? 'bg-emerald-500/10 text-emerald-600' : issue ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                  )}>
                    {delivered ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {statusText}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <Package className="mt-0.5 h-4 w-4 text-zinc-400" />
                    <div>
                      <div className="font-black">{pkg.recipientName || pkg.receiverName || '-'}</div>
                      <div className="text-xs font-bold text-zinc-500">{pkg.type || pkg.itemType || 'พัสดุ'}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-zinc-400" />
                    <div className="text-xs font-bold text-zinc-500">
                      รับเข้า: {pkg.date || pkg.receivedAt || '-'}
                      <br />
                      ส่งมอบ: {pkg.deliveredAt || '-'}
                    </div>
                  </div>
                  {pkg.note && pkg.note !== '-' && (
                    <div className="rounded-md bg-zinc-50 p-3 text-xs font-bold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                      {pkg.note}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {canSearch && !loading && results.length === 0 && !error && (
          <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <Package className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm font-bold text-zinc-500">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
          </div>
        )}
      </div>
    </main>
  );
}
