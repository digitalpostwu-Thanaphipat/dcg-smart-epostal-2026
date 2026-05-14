import './instrument';
import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App'

// PWA Service Worker Registration - Production Only
// ปรับปรุงการลงทะเบียนให้รองรับการอัปเดตและประหยัดทรัพยากร
const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

if (isProd && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = window.location.href.split(/[?#]/)[0] + '?get=sw';
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('✅ PWA: Service Worker Registered', registration.scope);
        
        // ตรวจสอบการอัปเดตแบบ Active
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ PWA: New content available, please refresh.');
                // Dispatch event for UI to show update prompt
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
      })
      .catch(err => console.warn('❌ PWA: Registration Failed', err));
  });
}

// Safe Debug Exposure (Non-blocking)
// [Loki] ลด delay ให้ Playwright tests เข้าถึง window.ApiClient และ window.db ได้เร็วขึ้น
setTimeout(() => {
  if (import.meta.env.DEV) {
    import('./api/client').then(({ ApiClient }) => {
      (window as any).ApiClient = ApiClient;
      console.log("🛠️ Loki Debug: ApiClient exposed to window.ApiClient");
    });
    import('./db/dexie').then(({ db }) => {
      (window as any).db = db;
      console.log("🛠️ Loki Debug: Dexie DB exposed to window.db");
    });
  }
}, 100);

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
