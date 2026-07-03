import React, { useState, useEffect } from 'react';

export const ReloadPrompt: React.FC = () => {
  const [needUpdate, setNeedUpdate] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNeedUpdate(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const onReload = () => {
    // Send message to SW to skipWaiting if needed (though our GAS SW skips waiting automatically)
    // Then reload the page
    window.location.reload();
  };

  if (!needUpdate) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[9999] animate-bounce-in md:bottom-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-900/30 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl shadow-inner">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">อัปเดตเวอร์ชันใหม่</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              พบการอัปเดตระบบใหม่ (v4.0.2) เพื่อเพิ่มประสิทธิภาพและความเสถียร
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={onReload}
                aria-label="อัปเดตระบบและโหลดหน้าเว็บใหม่"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95"
              >
                อัปเดตเลย
              </button>
              <button
                onClick={() => setNeedUpdate(false)}
                aria-label="ปิดกล่องแจ้งเตือนอัปเดต"
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 px-4 rounded-xl transition-colors active:scale-95"
              >
                ไว้ก่อน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
