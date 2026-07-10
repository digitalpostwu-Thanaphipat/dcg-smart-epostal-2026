import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';

export function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
        <NavLink
          to={ROUTES.ADMIN_USERS}
          className={({ isActive }) => cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase transition-all",
            isActive ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-zinc-500"
          )}
        >
          จัดการผู้ใช้งาน
        </NavLink>
        <NavLink
          to={ROUTES.ADMIN_SETTINGS}
          className={({ isActive }) => cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase transition-all",
            isActive ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-zinc-500"
          )}
        >
          ตั้งค่าระบบ
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
