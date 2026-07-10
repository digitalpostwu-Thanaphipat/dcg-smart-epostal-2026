import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { PostalEntryForm } from './components/PostalEntryForm'
import { PostalPendingList } from './components/PostalPendingList'
import { PostalSearchPage } from './components/PostalSearchPage'
import { PublicTrackingPage } from './components/PublicTrackingPage'
import { useMasterDataStore } from './store/useMasterDataStore'
import { useAuthStore } from './store/useAuthStore'
import { ApiClient } from './api/client'
import { Login } from './pages/Login'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminSettingsPage } from './pages/AdminSettingsPage'
import { Toaster } from 'react-hot-toast'
import { haptics } from './utils/haptics'
import { AlertCircle, Loader2 } from 'lucide-react'
import * as Sentry from "@sentry/react"
import { ReloadPrompt } from './components/common/ReloadPrompt'
import { ROUTES } from './routes'

interface VersionMismatchBannerProps {
  isVersionMismatch: boolean;
  backendVersion?: string;
  frontendVersion: string;
}

const VersionMismatchBanner: React.FC<VersionMismatchBannerProps> = ({ 
  isVersionMismatch, 
  backendVersion, 
  frontendVersion 
}) => {
  if (!isVersionMismatch) return null;
  return (
    <div className="bg-rose-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse">
      <AlertCircle className="w-4 h-4" />
      เวอร์ชัน Backend ไม่ตรงกัน: พบ {backendVersion} (ต้องการ {frontendVersion}) กรุณาติดต่อผู้ดูแลระบบเพื่อทำการ Deploy
    </div>
  );
};

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true)
  
  const APP_VERSION = __APP_VERSION__
  const { fetchMasterData, systemInfo } = useMasterDataStore()
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
            const updatedDept = userData.Department || userData.department || userData['หน่วยงาน'] || 'มหาลัย';

            if (user.role !== updatedRole || user.department !== updatedDept) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email]);

  // Version Handshake Alert
  const isVersionMismatch = Boolean(systemInfo && systemInfo.version !== APP_VERSION);

  useEffect(() => {
    if (isVersionMismatch) {
      console.warn(`[Handshake] Version Mismatch: Frontend(${APP_VERSION}) vs Backend(${systemInfo?.version})`);
      haptics.notification('warning');
    }
  }, [isVersionMismatch, systemInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-[9999]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">กำลังโหลดส่วนประกอบของระบบ...</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.TRACKING} element={<PublicTrackingPage />} />

      {/* Protected routes — auth required */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Layout>
              <VersionMismatchBanner 
                isVersionMismatch={isVersionMismatch} 
                backendVersion={systemInfo?.version} 
                frontendVersion={APP_VERSION} 
              />
              <Routes>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.ENTRY} element={<PostalEntryForm />} />
                <Route path={ROUTES.DELIVERY} element={<PostalPendingList />} />
                <Route path={ROUTES.SEARCH} element={<PostalSearchPage />} />
                <Route path={ROUTES.ADMIN} element={<AdminPage />}>
                  <Route index element={<Navigate to={ROUTES.ADMIN_USERS} replace />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
              <ReloadPrompt />
            </Layout>
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div className="p-10 flex flex-col items-center justify-center min-h-screen text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">เกิดข้อผิดพลาดบางอย่าง</h2>
        <p className="text-zinc-500 max-w-md mb-6">{(error as any)?.message || "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}</p>
        <button onClick={() => window.location.reload()} aria-label="โหลดระบบใหม่" className="btn-primary">โหลดระบบใหม่</button>
      </div>
    )}>
      <HashRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </HashRouter>
      <ConnectionDiagnostic />
    </Sentry.ErrorBoundary>
  );
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
