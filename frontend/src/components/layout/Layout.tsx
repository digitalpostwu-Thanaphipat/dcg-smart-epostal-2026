import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Search, User, Moon, Sun, Clock, Shield, LogOut, Mail } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '@/lib/utils';
import { FeedbackWidget } from '../ui/FeedbackWidget';
import { haptics } from '../../utils/haptics';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { ROUTES } from '@/routes';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface SyncBadgeProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  processQueue: () => void;
}

const SyncBadge: React.FC<SyncBadgeProps> = ({ pendingCount, isOnline, isSyncing, processQueue }) => {
  if (pendingCount === 0 && isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
        <Wifi className="w-3 h-3" /> Online
      </div>
    );
  }

  return (
    <button 
      onClick={() => isOnline && processQueue()}
      disabled={isSyncing || !isOnline}
      aria-label={!isOnline ? 'ออฟไลน์' : `กำลังซิงค์ ${pendingCount} รายการ`}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
        !isOnline 
          ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
          : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
      )}
    >
      {isSyncing ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : !isOnline ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <RefreshCw className="w-3 h-3" />
      )}
      {!isOnline ? 'Offline' : `Syncing ${pendingCount}...`}
    </button>
  );
};

const MENU_ITEMS: Array<{ path: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean }> = [
  { path: ROUTES.HOME, label: 'แดชบอร์ดหลัก', icon: LayoutDashboard, end: true },
  { path: ROUTES.ENTRY, label: 'บันทึกไปรษณีย์ภัณฑ์', icon: Package },
  { path: ROUTES.DELIVERY, label: 'การนำจ่ายไปรษณีย์ภัณฑ์', icon: Clock },
  { path: ROUTES.SEARCH, label: 'ค้นหาไปรษณีย์ภัณฑ์', icon: Search },
]

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    haptics.medium();
    logout();
  };

  const menuItems = useMemo(() => {
    const role = user?.role || 'User';
    const items = [...MENU_ITEMS];
    if (role === 'Admin') {
      items.push({ path: ROUTES.ADMIN, label: 'จัดการสิทธิ์เข้าถึง', icon: Shield, end: false });
    }
    return items;
  }, [user]);

  const { isOnline, isSyncing, pendingCount, processQueue } = useOfflineSync();

  const activeLabel = menuItems.find(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )?.label || 'หน้าแรก';

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 overflow-hidden relative selection:bg-primary/20",
      theme === 'dark' ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* ─── Subtle Academic Background Blobs ─── */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-zinc-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar - Desktop */}
      <aside className="fixed left-4 top-4 bottom-4 z-50 hidden w-64 clay-card border-zinc-200/50 lg:flex flex-col shadow-xl shadow-zinc-900/5 transition-all duration-500 overflow-hidden">
        <div className="flex flex-col justify-center border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <span className="text-xl font-black tracking-tighter text-primary font-heading flex items-center gap-2">
            <Mail className="w-6 h-6" />
            DCG Smart <span className="text-zinc-400 font-normal">ePostal</span>
          </span>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-8">ส่วนอำนวยการและสารบรรณ</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => haptics.light()}
              className={({ isActive }) => cn(
                "flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 font-heading",
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile in Sidebar */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                     {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-xs font-black truncate">{user?.fullName}</p>
                     <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight truncate">{user?.role}</p>
                  </div>
              </div>
              <button 
                onClick={handleLogout}
                aria-label="ออกจากระบบ"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                 <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 relative z-10 transition-all duration-500">
        {/* Topbar */}
        <header className="sticky top-4 mx-4 z-40 flex h-16 items-center justify-between rounded-2xl border border-zinc-200/50 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/40 shadow-sm">
          <h2 className="text-sm font-black text-zinc-400 dark:text-zinc-500 font-heading uppercase tracking-widest">
            {activeLabel}
          </h2>
          <div className="flex items-center gap-2 lg:gap-4">
            <SyncBadge 
              pendingCount={pendingCount} 
              isOnline={isOnline} 
              isSyncing={isSyncing} 
              processQueue={processQueue} 
            />
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors tooltip-trigger relative group"
              title="สลับโหมดสี"
              aria-label="สลับโหมดสว่าง/มืด"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <FeedbackWidget />
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <button 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:ring-2 hover:ring-primary/20 transition-all"
              aria-label="โปรไฟล์ผู้ใช้งาน"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 flex items-center justify-around rounded-[2rem] border border-zinc-200/50 bg-white/90 p-2 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/90 lg:hidden shadow-2xl">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => haptics.light()}
            className={({ isActive }) => cn(
               "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-all duration-300",
               isActive ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className={cn(
               "text-[10px] font-black uppercase tracking-tight text-center leading-none"
            )}>
              {item.label.replace('ไปรษณีย์ภัณฑ์', 'ปณ.')}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
