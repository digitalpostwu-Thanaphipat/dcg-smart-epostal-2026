import React from 'react';
import { Megaphone } from 'lucide-react';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { BentoStats } from '@/components/dashboard/BentoStats';

export function HomePage() {
  const { announcements } = useMasterDataStore();
  const activeAnnounce = announcements?.find(a => a['สถานะ (แสดง/ซ่อน)'] === 'แสดง');

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/10 mb-2">
          DCG Smart ePostal Gateway
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-[0.9]">ระบบบริหารจัดการ<br/>ไปรษณีย์ภัณฑ์ภายใน</h1>
        <p className="text-xs font-medium text-zinc-500 max-w-md leading-relaxed">แพลตฟอร์มจัดการไปรษณีย์ภัณฑ์ มาตรฐานหน่วยงานดิจิทัล</p>
      </header>

      {activeAnnounce && (
        <div className="clay-card p-8 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
             <Megaphone className="w-24 h-24 text-amber-500 -rotate-12" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 animate-bounce">
                   <Megaphone className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">ข่าวสารและประกาศสำคัญ</h3>
                   <p className="text-lg font-black text-zinc-900 dark:text-white leading-tight">
                      {activeAnnounce['หัวข้อประกาศ']}
                   </p>
                </div>
             </div>
             
             <div className="p-5 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/50 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                   {activeAnnounce['เนื้อหา']}
                </p>
             </div>
          </div>
        </div>
      )}

      <BentoStats />
    </div>
  );
}
