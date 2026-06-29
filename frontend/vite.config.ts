import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  const DEPLOY_ID = env.VITE_GAS_DEPLOY_ID
  const proxy = mode !== 'test' && DEPLOY_ID
    ? {
        '/api': {
          target: 'https://script.google.com',
          changeOrigin: true,
          rewrite: (requestPath: string) => requestPath.replace(/^\/api/, `/macros/s/${DEPLOY_ID}/exec`),
        }
      }
    : undefined

  return {
    cacheDir: path.resolve(__dirname, '../.vite-cache/frontend'),
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile({
        removeViteModuleLoader: true,
        useRecommendedBuildConfig: true,
      }),
      VitePWA({
        registerType: 'prompt', // Changed to prompt for HITL update experience
        injectRegister: null, // Manually registered in main.tsx for GAS compatibility
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB for single-file build
        },
        manifest: {
          name: 'DCG Smart ePostal',
          short_name: 'ePostal',
          description: 'ระบบคัดแยก-นำจ่ายไปรษณียภัณฑ์ภายใน',
          theme_color: '#059669',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      proxy,
    },
    build: {
      target: 'esnext',
      minify: 'oxc',
      cssMinify: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },
  }
})
