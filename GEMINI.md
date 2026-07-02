# ePostal: Agent Master Instructions

> **Lead Agent:** @antigravity
> **Last Updated:** 2026-07-02
> **System Version:** v4.0.2 | Backend @274

---

> [!IMPORTANT]
> **📢 โปรโตคอลการเริ่มงาน (Startup Protocol)**
> เมื่อเริ่มเซสชันใหม่ หรือเปลี่ยนเอเจนต์ เอเจนต์ **ต้อง** ดำเนินการดังนี้ก่อนเริ่มงาน:
> 1. อ่าน `GEMINI.md` และ `COMMAND_CENTER.md` เพื่อรีเฟรชกฎและเครื่องมือ
> 2. อ่าน `.agents/memory/HANDOFF.md` เพื่อรับทราบสถานะล่าสุดและคำแนะนำจากคนก่อนหน้า
> 3. อ่าน `.agents/rules/KNOWN_ISSUES.md` เพื่อเลี่ยงปัญหาที่รู้อยู่แล้ว
> 4. สรุปความเข้าใจใน "บริบทปัจจุบัน" และ "เป้าหมายถัดไป" ให้ Admin ทราบก่อนลงมือ

---

## 🎯 Current Mission
พัฒนาระบบ ePostal ให้มีความเสถียรระดับ Production โดยใช้ Workflow ที่ควบคุมคุณภาพอย่างเข้มงวด

## 🛠 Project Workflow
คุณ **ต้อง** ปฏิบัติตามขั้นตอนใน [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) ทุกครั้งที่เริ่ม Task ใหม่

## 🚦 Quality Control
ห้ามถือว่างานเสร็จสิ้นหากยังไม่ผ่านเกณฑ์ใน [QUALITY_GATES.md](./QUALITY_GATES.md) และการตรวจสอบจาก **[COMMAND_CENTER.md](./.agents/COMMAND_CENTER.md)**

## 🧠 Memory & Decisions
ตรวจสอบการตัดสินใจในอดีตได้ที่ [DECISION_LOG.md](./DECISION_LOG.md), [HANDOFF.md](./.agents/memory/HANDOFF.md) หรือใช้ทักษะ **`/brain`**

---

## 📜 Key Rules & Standards
ศูนย์ควบคุมทักษะอัจฉริยะ (AI Intelligence Hub): **[.agents/COMMAND_CENTER.md](./.agents/COMMAND_CENTER.md)**
กฎการพัฒนาที่แยกตามส่วนงานจะถูกเก็บไว้ที่ `./.agents/rules/`:
- [Duplicate Prevention](./.agents/rules/duplicate-prevention.md) (In-progress)
- [Design Standards](./.agents/rules/design-standards.md) (In-progress)
- [Data Dictionary](./.agents/rules/data-dictionary.md) (v4.0.2 Schema)
- [Known Issues](./.agents/rules/KNOWN_ISSUES.md) (ทะเบียนปัญหาที่รอนะบาย)

## 🤖 Advanced Agentic Protocols
โปรเจกต์นี้ใช้โปรโตคอลขั้นสูงเพื่อควบคุมพฤติกรรม AI:
- **`@loki-mode`**: โปรโตคอลควบคุมความเสถียร (Efficiency & Stability) เน้นการจัดการ DB และ E2E Verification
- **`@multi-agent-brainstorming`**: โปรโตคอลการตรวจสอบแบบโครงสร้าง (Structured Review) ใช้สำหรับการออกแบบ Schema และรีวิว UX

## 🏗 Architecture Overview
- **Frontend:** React 19 + Vite 6 + TailwindCSS v4 (Single-File Build via `vite-plugin-singlefile`)
- **Backend:** Google Apps Script (clasp-managed, 17 files)
- **Database:** Google Sheets (`ePostal_2026`, ID: `1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ`)
- **Schema:** 18-column canonical schema (header-mapped dynamic writes via `buildRow()`)
- **PWA:** Service Worker + Offline-first via Dexie (IndexedDB)
- **Sharding:** Fiscal Year-based (Thai FY, `DB_SHARDS` in ScriptProperties)
- **Error Monitoring:** Sentry (`@sentry/react`) — Org: `dcg-smart-2026`, Project: `dcg-smart-epostal-2026`
- **Health Check:** `Service_Health.gs` (7-point system integrity check)

## 📦 Package Manager & Deploy Workflow
- **Frontend:** npm (`npm install`, `npm run dev`)
- **Backend:** clasp — **ต้องทำ 3 ขั้นตอนเสมอ:**
  ```powershell
  # 1. Sync frontend build to backend
  Copy-Item frontend\dist\index.html backend\index.html -Force
  # 2. Push source code
  cd backend && clasp push
  # 3. Create new live deployment (⚠️ push alone does NOT update /exec URL)
  clasp deploy -d "Description (YYYY-MM-DD)"
  ```
  > ⚠️ **Critical:** `clasp push` เท่านั้น ≠ Live — Published URL ยังรัน version เก่าจนกว่าจะ `clasp deploy`

## 🔧 Dev Server Proxy
- Vite proxy `/api` → `https://script.google.com/macros/s/{DEPLOY_ID}/exec`
- **Current Deploy ID:** `AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g` (@274)
- ⚠️ **ต้องอัปเดต `vite.config.ts` proxy URL ทุกครั้งที่ `clasp deploy` ใหม่**

## ⚠️ Known Gotchas
1. **~~Phantom Columns:~~** ✅ Resolved — Schema ถูกควบคุมโดย `Service_Schema.gs` (18 คอลัมน์) + `_forceSchemaAndDimensions()` ตัดคอลัมน์เกินอัตโนมัติ
2. **Deployment Limit:** GAS อนุญาตแค่ 20 versioned deployments — ต้อง `clasp undeploy` เวอร์ชันเก่าก่อน
3. **Dexie Key Path:** `pendingDeliveries` ใช้ `packageId` เป็น primary key — backend ต้องส่ง field นี้กลับมา
4. **Auth Session Sync:** Frontend caches user roles. Background sync added in App.tsx to automatically verify Role/Department silently on app load to prevent stale RBAC states.
5. **Header-Mapped Writes:** `savePackageEntry` ใช้ `buildRow()` + `getHeaderIndex()` — เพิ่ม/ย้ายคอลัมน์ได้โดยแก้แค่ header string
6. **Email→Name Resolution:** คอลัมน์ จนท.ผู้นำจ่าย, ผู้บันทึก, ผู้อัปเดตล่าสุด แสดง FullName แทนอีเมล (resolved @216)
7. **Sentry DSN:** DSN เก็บใน `frontend/.env.local` (VITE_SENTRY_DSN) — ห้าม hardcode ลงในโค้ด
8. **OCR Retired:** ระบบ OCR ถูกยกเลิกทั้งหมด (frontend + backend) ตั้งแต่ @264

---
**Co-Authored-By:** Antigravity <antigravity@epostal.ai>
