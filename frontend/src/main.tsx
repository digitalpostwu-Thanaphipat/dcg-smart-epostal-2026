import './instrument';
import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App'

// PWA Service Worker Registration - Production Only
// ป้องกัน Error บน localhost:5173
const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

if (isProd && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = window.location.href.split(/[?#]/)[0] + '?get=sw';
    navigator.serviceWorker.register(swUrl)
      .then(reg => console.log('PWA Service Worker Registered', reg))
      .catch(err => console.warn('PWA Registration Failed', err));
  });
} else if (!isProd) {
  console.log('Running in Development mode: PWA Service Worker disabled.');
}

// Safe Debug Exposure (Non-blocking)
// [Loki] ลด delay ให้ Playwright tests เข้าถึง window.ApiClient ได้เร็วขึ้น
setTimeout(() => {
  if (import.meta.env.DEV) {
    import('./api/client').then(({ ApiClient }) => {
      (window as any).ApiClient = ApiClient;
      console.log("🛠️ Loki Debug: ApiClient exposed to window.ApiClient");
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
