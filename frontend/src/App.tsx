import React, { useState, useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { PostalEntryForm } from './components/PostalEntryForm'
import { PostalPendingList } from './components/PostalPendingList'
import { PostalSearchPage } from './components/PostalSearchPage'
import { PublicTrackingPage } from './components/PublicTrackingPage'
import { UserManagementPage } from './components/admin/UserManagementPage'
import { SystemSettingsPage } from './components/admin/SystemSettingsPage'
import { useMasterDataStore } from './store/useMasterDataStore'
import { useAuthStore } from './store/useAuthStore'
import { ApiClient } from './api/client'
import { Login } from './pages/Login'
import { BentoStats } from './components/dashboard/BentoStats'
import { Toaster } from 'react-hot-toast'
import { haptics } from './utils/haptics'
import { AlertCircle, Megaphone, Loader2 } from 'lucide-react'
import * as Sentry from "@sentry/react"
import { ReloadPrompt } from './components/common/ReloadPrompt'

function App() {
  const isPublicTracking = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('publicTrack') === '1'
  const [activeTab, setActiveTab] = useState('home')
  const [adminSubTab, setAdminSubTab] = useState('users')
  const [isLoading, setIsLoading] = useState(true)
  
  const APP_VERSION = "4.0.2"
  const { fetchMasterData, announcements, systemInfo } = useMasterDataStore()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) {
        await fetchMasterData()
      }
      setIsLoading(false)
    }
    init()
  }, [fetchMasterData, isAuthenticated])

  // Background Role Sync
  useEffect(() => {
    const syncUserRole = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const response: any = await ApiClient.auth.verifySession();
          if (response?.success && response?.data) {
            const userData = response.data;
            const updatedRole = userData.Role || userData.role || 'User';
            const updatedDept = userData.Department || userData.department || userData.หน่วยงาน || 'มหาลัย';
            
            if (user.role !== updatedRole || user.department !== updatedDept) {
              console.log(`[Auth Sync] Updating user session: Role(${updatedRole}), Dept(${updatedDept})`);
              useAuthStore.getState().login({
                ...user,
                role: updatedRole,
                department: updatedDept,
                sessionToken: user.sessionToken
              });
            }
          }
        } catch(e) {
          console.warn('[Auth Sync] Failed to sync session', e);
        }
      }
    };
    syncUserRole();
  }, [isAuthenticated, user?.email]);


  // Version Handshake Alert
  const isVersionMismatch = systemInfo && systemInfo.version !== APP_VERSION;

  useEffect(() => {
    if (isVersionMismatch) {
      console.warn(`[Handshake] Version Mismatch: Frontend(${APP_VERSION}) vs Backend(${systemInfo.version})`);
      haptics.notification('warning');
    }
  }, [isVersionMismatch, systemInfo])

  const VersionMismatchBanner = () => {
    if (!isVersionMismatch) return null;
    return (
      <div className="bg-rose-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse">
        <AlertCircle className="w-4 h-4" />
        เวอร์ชัน Backend ไม่ตรงกัน: พบ {systemInfo?.version} (ต้องการ {APP_VERSION}) กรุณาติดต่อผู้ดูแลระบบเพื่อทำการ Deploy
      </div>
    );
  };

  if (isPublicTracking) {
    return (
      <>
        <Toaster position="top-right" />
        <PublicTrackingPage />
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-[9999]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">กำลังโหลดส่วนประกอบของระบบ...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Login />
      </>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-10 animate-fade-in">
            <header className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/10 mb-2">
                DCG Smart ePostal Gateway
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-[0.9]">ระบบบริหารจัดการ<br/>ไปรษณีย์ภัณฑ์ภายใน</h1>
              <p className="text-xs font-medium text-zinc-500 max-w-md leading-relaxed">แพลตฟอร์มจัดการไปรษณีย์ภัณฑ์ มาตรฐานหน่วยงานดิจิทัล</p>
            </header>

            {/* Announcement Section */}
            {announcements && announcements.length > 0 && announcements.some(a => a['สถานะ (แสดง/ซ่อน)'] === 'แสดง') && (
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
                            {announcements.find(a => a['สถานะ (แสดง/ซ่อน)'] === 'แสดง')?.['หัวข้อประกาศ']}
                         </p>
                      </div>
                   </div>
                   
                   <div className="p-5 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/50 dark:border-zinc-800">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                         {announcements.find(a => a['สถานะ (แสดง/ซ่อน)'] === 'แสดง')?.['เนื้อหา']}
                      </p>
                   </div>
                </div>
              </div>
            )}

            <BentoStats />
          </div>
        )
      case 'entry':
        return <PostalEntryForm />
      case 'delivery':
        return <PostalPendingList />
      case 'search':
        return <PostalSearchPage />
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
              <button 
                onClick={() => setAdminSubTab('users')}
                aria-label="จัดการผู้ใช้งาน"
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${adminSubTab === 'users' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-zinc-500'}`}
              >
                จัดการผู้ใช้งาน
              </button>
              <button 
                onClick={() => setAdminSubTab('settings')}
                aria-label="ตั้งค่าระบบ"
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${adminSubTab === 'settings' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-zinc-500'}`}
              >
                ตั้งค่าระบบ
              </button>
            </div>
            {adminSubTab === 'users' ? <UserManagementPage /> : <SystemSettingsPage />}
          </div>
        )
      default:
        return <BentoStats />
    }
  }

  return (
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div className="p-10 flex flex-col items-center justify-center min-h-screen text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">เกิดข้อผิดพลาดบางอย่าง</h2>
        <p className="text-zinc-500 max-w-md mb-6">{(error as any)?.message || "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}</p>
        <button onClick={() => window.location.reload()} aria-label="โหลดระบบใหม่" className="btn-primary">โหลดระบบใหม่</button>
      </div>
    )}>
      <Layout activeTab={activeTab} onTabChange={(tab) => {
        haptics.light();
        setActiveTab(tab);
      }}>
        <VersionMismatchBanner />
        <Toaster position="top-right" />
        <div className="animate-slide-fade-in" key={activeTab}>
          {renderContent()}
        </div>
        <ConnectionDiagnostic />
        <ReloadPrompt />
      </Layout>
    </Sentry.ErrorBoundary>
  )
}

/**
 * ConnectionDiagnostic
 * เฉพาะโหมด Development: ตรวจสอบสถานะการเชื่อมต่อ Backend
 */
function ConnectionDiagnostic() {
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { ApiClient } = await import('./api/client');
        const res: any = await ApiClient.admin.getSystemInfo();
        if (res.success) {
          setInfo(res.data);
        } else {
          setError(res.error || 'การเชื่อมต่อล้มเหลว');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    checkConnection();
  }, []);

  if (import.meta.env.PROD && !window.location.hostname.includes('localhost')) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 dark:border-zinc-200 shadow-2xl">
      <div className={`w-2 h-2 rounded-full ${info ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 animate-pulse'}`} />
      <span>{info ? `Backend: ${info.version}` : (error ? `ข้อผิดพลาด: การเชื่อมต่อล้มเหลว` : 'กำลังเชื่อมต่อ...')}</span>
      {info && <span className="opacity-40 text-[8px] border-l border-white/20 pl-2 ml-1 truncate max-w-[60px]">{info.activeDbId}</span>}
    </div>
  );
}

export default App
