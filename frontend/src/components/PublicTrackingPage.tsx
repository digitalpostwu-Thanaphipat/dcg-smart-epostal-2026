import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Calendar, CheckCircle2, Clock, Loader2, Package, Search } from 'lucide-react';
import { ApiClient, type PostalPackage } from '@/api/client';
import { cn, getThaiFiscalYear } from '@/lib/utils';

const statusOptions = [
  { id: '', label: 'ทั้งหมด' },
  { id: 'Pending', label: 'รอนำจ่าย' },
  { id: 'Delivered', label: 'ส่งมอบแล้ว' },
  { id: 'มีปัญหา/ตีกลับ', label: 'มีปัญหา/ตีกลับ' },
];

function displayStatus(status: string) {
  if (status === 'Pending' || status === 'รอจ่าย') return 'รอนำจ่าย';
  if (status === 'Delivered' || status === 'จ่ายแล้ว' || status === 'จ่ายสำเร็จ') return 'ส่งมอบแล้ว';
  return status || '-';
}

export function PublicTrackingPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const deptId = params.get('dept') || '';
  const token = params.get('token') || '';
  const isDeptLink = Boolean(deptId && token);
  const currentFY = String(getThaiFiscalYear());

  const [keyword, setKeyword] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(deptId);
  const [departments, setDepartments] = useState<{ deptId: string; department: string }[]>([]);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fiscalYear, setFiscalYear] = useState(currentFY);
  const [department, setDepartment] = useState('');
  const [results, setResults] = useState<PostalPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!isDeptLink && keyword.trim().length < 4) {
      setError('กรุณาค้นด้วยเลขพัสดุหรือชื่อผู้รับอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await ApiClient.tracking.publicSearch({
        deptId: isDeptLink ? deptId : selectedDeptId,
        token,
        keyword: keyword.trim(),
        status,
        dateFrom,
        dateTo,
        fiscalYear,
      });

      if (!res?.success) throw new Error(res?.error || 'ค้นหาไม่สำเร็จ');
      setDepartment(res.department || department);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      if (isDeptLink) {
        search();
        return;
      }
      try {
        const res = await ApiClient.tracking.getDepartments();
        if (res?.success && Array.isArray(res.data)) setDepartments(res.data);
      } catch (err) {
        console.warn('Failed to load public departments', err);
      }
    };
    loadDepartments();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-4 w-4" />
                {department || 'ระบบติดตามพัสดุประจำหน่วยงาน'}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">ติดตามไปรษณีย์ภัณฑ์</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {isDeptLink
                    ? 'ค้นหาพัสดุที่ส่งถึงบุคลากรในหน่วยงานของคุณ ข้อมูลนี้เป็นข้อมูลจากระบบ ePostal ภายในหน่วยงาน'
                    : 'ค้นหาพัสดุจากระบบ ePostal ด้วยเลขพัสดุหรือชื่อผู้รับ และเลือกหน่วยงานเพื่อช่วยจำกัดผลลัพธ์'}
                </p>
              </div>
            </div>
            <div className="text-sm font-bold text-zinc-500">
              พบ <span className="text-zinc-900 dark:text-white">{results.length}</span> รายการ
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <form onSubmit={search} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[1fr_auto]">
          <div className="flex min-h-12 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
            <Search className="h-5 w-5 text-zinc-400" />
            <label htmlFor="public-search-keyword" className="sr-only">ค้นด้วยเลขพัสดุหรือชื่อผู้รับ</label>
            <input
              id="public-search-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-transparent py-3 text-sm font-semibold outline-none text-zinc-900 dark:text-zinc-100"
              placeholder="ค้นด้วยเลขพัสดุหรือชื่อผู้รับ"
            />
          </div>
          <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            ค้นหา
          </button>
        </form>

        <div className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-5">
          {!isDeptLink && (
            <label className="space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">หน่วยงาน</span>
              <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950">
                <option value="">ทุกหน่วยงาน</option>
                {departments.map((dept) => <option key={dept.deptId} value={dept.deptId}>{dept.department}</option>)}
              </select>
            </label>
          )}
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
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-black",
                    delivered ? "bg-emerald-500/10 text-emerald-600" : issue ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"
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

        {!loading && results.length === 0 && !error && (
          <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <Package className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm font-bold text-zinc-500">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
          </div>
        )}
      </div>
    </main>
  );
}
