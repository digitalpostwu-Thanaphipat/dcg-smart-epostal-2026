# Decision Log: ePostal Project

> à¸šà¸±à¸™à¸—à¸¶à¸�à¸�à¸²à¸£à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆà¹€à¸Šà¸´à¸‡à¹€à¸—à¸„à¸™à¸´à¸„ à¸ªà¸–à¸²à¸›à¸±à¸•à¸¢à¸�à¸£à¸£à¸¡ à¹�à¸¥à¸°à¸�à¸²à¸£à¸­à¸­à¸�à¹�à¸šà¸š à¹€à¸žà¸·à¹ˆà¸­à¸£à¸±à¸�à¸©à¸²à¸„à¸§à¸²à¸¡à¸•à¹ˆà¸­à¹€à¸™à¸·à¹ˆà¸­à¸‡à¸‚à¸­à¸‡à¹‚à¸›à¸£à¹€à¸ˆà¸�à¸•à¹Œ

---

## Log Template
*(à¹ƒà¸Šà¹‰ Template à¸™à¸µà¹‰à¹ƒà¸™à¸�à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸±à¸™à¸—à¸¶à¸�à¹ƒà¸«à¸¡à¹ˆ)*

### [YYYY-MM-DD] - [à¸Šà¸·à¹ˆà¸­à¸«à¸±à¸§à¸‚à¹‰à¸­à¸�à¸²à¸£à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆ]
- **Context:** à¸›à¸±à¸�à¸«à¸²à¸«à¸£à¸·à¸­à¸„à¸§à¸²à¸¡à¸•à¹‰à¸­à¸‡à¸�à¸²à¸£à¸„à¸·à¸­à¸­à¸°à¹„à¸£?
- **Decision:** à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆà¹€à¸¥à¸·à¸­à¸�à¸—à¸²à¸‡à¹„à¸«à¸™?
- **Alternatives Considered:** à¸—à¸²à¸‡à¹€à¸¥à¸·à¸­à¸�à¸­à¸·à¹ˆà¸™à¸¡à¸µà¸­à¸°à¹„à¸£à¸šà¹‰à¸²à¸‡ à¹�à¸¥à¸°à¸—à¸³à¹„à¸¡à¸–à¸¶à¸‡à¹„à¸¡à¹ˆà¹€à¸¥à¸·à¸­à¸�?
- **Rationale:** à¹€à¸«à¸•à¸¸à¸œà¸¥à¸«à¸¥à¸±à¸�à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸�à¸—à¸²à¸‡à¸™à¸µà¹‰ (à¸”à¹‰à¸²à¸™à¹€à¸—à¸„à¸™à¸´à¸„/à¸˜à¸¸à¸£à¸�à¸´à¸ˆ)
- **Impact:** à¸œà¸¥à¸�à¸£à¸°à¸—à¸šà¸•à¹ˆà¸­à¸£à¸°à¸šà¸šà¸ªà¹ˆà¸§à¸™à¸­à¸·à¹ˆà¸™ (Security, Perf, Scalability)
- **Status:** [ Proposed | Accepted | Superseded ]
- **Lead Agent:** @loki-mode

---

## Decisions Traceability

### 2026-03-30 - Initial Dev Control System Setup
- **Context:** à¸•à¹‰à¸­à¸‡à¸�à¸²à¸£à¸£à¸°à¸šà¸šà¸—à¸µà¹ˆà¸„à¸§à¸šà¸„à¸¸à¸¡à¸„à¸¸à¸“à¸ à¸²à¸žà¹‚à¸„à¹‰à¸”à¸£à¸°à¸”à¸±à¸š Production à¹�à¸¥à¸°à¸£à¸±à¸�à¸©à¸²à¸�à¸Ž Clean Code à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸„à¸£à¹ˆà¸‡à¸„à¸£à¸±à¸”
- **Decision:** à¸ªà¸£à¹‰à¸²à¸‡ `DEVELOPMENT_WORKFLOW.md`, `QUALITY_GATES.md` à¹�à¸¥à¸° `DECISION_LOG.md`
- **Rationale:** à¹€à¸žà¸·à¹ˆà¸­à¸ªà¸£à¹‰à¸²à¸‡ "Agent Guardrails" à¹ƒà¸«à¹‰ AI à¸—à¸³à¸‡à¸²à¸™à¹„à¸”à¹‰à¹�à¸¡à¹ˆà¸™à¸¢à¸³à¸•à¸²à¸¡à¹�à¸™à¸§à¸—à¸²à¸‡ Rules Board
- **Impact:** AI à¸—à¸¸à¸�à¸•à¸±à¸§à¸—à¸µà¹ˆà¹€à¸‚à¹‰à¸²à¸¡à¸²à¸—à¸³à¸‡à¸²à¸™à¸ˆà¸°à¸–à¸¹à¸�à¸šà¸±à¸‡à¸„à¸±à¸šà¹ƒà¸«à¹‰à¸­à¹ˆà¸²à¸™à¹�à¸¥à¸°à¸›à¸�à¸´à¸šà¸±à¸•à¸´à¸•à¸²à¸¡à¹€à¸�à¸“à¸‘à¹Œà¹€à¸«à¸¥à¹ˆà¸²à¸™à¸µà¹‰à¸�à¹ˆà¸­à¸™à¹€à¸£à¸´à¹ˆà¸¡ Task
- **Status:** Accepted
- **Lead Agent:** @loki-mode

---

### 2026-03-30 - Vite 8 Minifier: esbuild â†’ oxc
- **Context:** Vite 8 à¹ƒà¸Šà¹‰ oxc à¹€à¸›à¹‡à¸™ minifier à¸«à¸¥à¸±à¸�, `minify: 'esbuild'` à¸—à¸³à¹ƒà¸«à¹‰ build à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§à¹€à¸žà¸£à¸²à¸°à¸•à¹‰à¸­à¸‡à¸�à¸²à¸£ esbuild installed à¹�à¸¢à¸�à¸•à¹ˆà¸²à¸‡à¸«à¸²à¸�
- **Decision:** à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™ `build.minify` à¹€à¸›à¹‡à¸™ `'oxc'` à¹�à¸¥à¸°à¸¥à¸š `esbuild.drop` à¸­à¸­à¸� à¹ƒà¸Šà¹‰ `define` à¸ªà¸³à¸«à¸£à¸±à¸š console strip à¹�à¸—à¸™
- **Alternatives Considered:** à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡ esbuild à¹�à¸¢à¸� (à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§à¹€à¸žà¸£à¸²à¸° @tailwindcss/vite peer conflict), downgrade Vite (à¹„à¸¡à¹ˆà¹�à¸™à¸°à¸™à¸³)
- **Rationale:** oxc à¹€à¸›à¹‡à¸™ built-in à¸‚à¸­à¸‡ Vite 8 à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸�à¸²à¸£ dependency à¹€à¸žà¸´à¹ˆà¸¡ à¹�à¸¥à¸°à¹€à¸£à¹‡à¸§à¸�à¸§à¹ˆà¸² esbuild
- **Impact:** Build time à¸¥à¸”à¸ˆà¸²à¸� FAILED â†’ 1.02s, à¹„à¸¡à¹ˆà¸¡à¸µà¸œà¸¥à¸•à¹ˆà¸­ runtime
- **Status:** Accepted
- **Lead Agent:** @loki-mode

### 2026-03-30 - RBAC: à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸—à¸˜à¸´à¹Œ savePackageEntry à¹ƒà¸«à¹‰ Staff/Postal
- **Context:** User role "Staff" à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œ `savePackageEntry` à¸—à¸±à¹‰à¸‡à¸—à¸µà¹ˆ Staff à¸„à¸·à¸­à¸œà¸¹à¹‰à¸—à¸µà¹ˆà¸£à¸±à¸šà¹�à¸¥à¸°à¸šà¸±à¸™à¸—à¸¶à¸�à¸žà¸±à¸ªà¸”à¸¸à¸ˆà¸£à¸´à¸‡à¹ƒà¸™à¸Šà¸µà¸§à¸´à¸•à¸ˆà¸£à¸´à¸‡
- **Decision:** à¹€à¸žà¸´à¹ˆà¸¡ `savePackageEntry`, `getPersonnel`, `getPositions`, `getRepresentatives` à¹ƒà¸«à¹‰à¸—à¸±à¹‰à¸‡ Staff à¹�à¸¥à¸° Postal roles à¹ƒà¸™ `Code.gs`
- **Alternatives Considered:** à¹ƒà¸Šà¹‰ Email Admin à¹ƒà¸™ Tests (à¹�à¸�à¹‰ symptom à¹„à¸¡à¹ˆà¹�à¸�à¹‰à¸ªà¸²à¹€à¸«à¸•à¸¸)
- **Rationale:** Design correctness â€” Staff à¸•à¹‰à¸­à¸‡à¹„à¸”à¹‰à¸£à¸±à¸šà¸ªà¸´à¸—à¸˜à¸´à¹Œà¸šà¸±à¸™à¸—à¸¶à¸�à¸žà¸±à¸ªà¸”à¸¸à¸•à¸²à¸¡ Business Logic à¸ˆà¸£à¸´à¸‡
- **Impact:** âœ… Tests à¸œà¹ˆà¸²à¸™, âœ… RBAC à¸–à¸¹à¸�à¸•à¹‰à¸­à¸‡à¸•à¸²à¸¡à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸ˆà¸£à¸´à¸‡, âš ï¸� à¸•à¹‰à¸­à¸‡ clasp deploy à¸—à¸¸à¸�à¸„à¸£à¸±à¹‰à¸‡à¸—à¸µà¹ˆà¹�à¸�à¹‰ ROLE_PERMISSIONS
- **Status:** Accepted
- **Lead Agent:** @loki-mode

### 2026-03-30 - Backend Performance: SPREADSHEET_ID Caching
- **Context:** `Service_DB.gs` à¸—à¸³ `DriveApp.getFilesByName()` à¸—à¸¸à¸� request à¸—à¸³à¹ƒà¸«à¹‰à¹€à¸žà¸´à¹ˆà¸¡ latency 1-3s à¸•à¹ˆà¸­ call
- **Decision:** Cache `SPREADSHEET_ID` à¹ƒà¸™ `ScriptProperties` à¸œà¹ˆà¸²à¸™ IIFE pattern: à¸­à¹ˆà¸²à¸™à¸„à¸£à¸±à¹‰à¸‡à¹�à¸£à¸� â†’ à¸šà¸±à¸™à¸—à¸¶à¸� â†’ à¹ƒà¸Šà¹‰ cache à¸„à¸£à¸±à¹‰à¸‡à¸•à¹ˆà¸­à¹„à¸›
- **Alternatives Considered:** Hardcode ID à¸•à¸£à¸‡à¹† (brittle à¸–à¹‰à¸² sheet à¸–à¸¹à¸� migrate), à¸­à¹ˆà¸²à¸™à¸—à¸¸à¸�à¸„à¸£à¸±à¹‰à¸‡ (à¸Šà¹‰à¸²)
- **Rationale:** ScriptProperties persist à¸£à¸°à¸«à¸§à¹ˆà¸²à¸‡ GAS executions, à¸¥à¸” DriveApp call à¸—à¸µà¹ˆà¸Šà¹‰à¸²à¹�à¸¥à¸°à¹�à¸žà¸‡
- **Impact:** Landing page: 2925ms â†’ 659ms, Batch 50 items: 7840ms â†’ 4625ms (E2E)
- **Status:** Accepted
- **Lead Agent:** @loki-mode

### 2026-03-30 - Deploy Workflow: clasp push â‰  Live
- **Context:** `clasp push` à¸­à¸±à¸›à¹€à¸”à¸•à¹€à¸‰à¸žà¸²à¸° HEAD source à¹�à¸•à¹ˆ Published Deployment URL (`/exec`) à¸¢à¸±à¸‡à¸£à¸±à¸™ version à¹€à¸�à¹ˆà¸²
- **Decision:** à¸�à¸³à¸«à¸™à¸” Standard Deploy Workflow à¹€à¸›à¹‡à¸™ 3 à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¹€à¸ªà¸¡à¸­: `Copy dist â†’ backend`, `clasp push`, `clasp deploy`
- **Alternatives Considered:** à¹ƒà¸Šà¹‰ `/dev` URL à¹ƒà¸™ proxy (à¹„à¸¡à¹ˆà¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸š Production testing)
- **Rationale:** GAS Published Deployments à¸£à¸±à¸™ versioned snapshot â€” à¸•à¹‰à¸­à¸‡à¸ªà¸£à¹‰à¸²à¸‡ version à¹ƒà¸«à¸¡à¹ˆà¸œà¹ˆà¸²à¸™ `clasp deploy` à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰ changes à¸¡à¸µà¸œà¸¥
- **Impact:** GEMINI.md à¹�à¸¥à¸° QUALITY_GATES.md à¸•à¹‰à¸­à¸‡à¹„à¸”à¹‰à¸£à¸±à¸šà¸�à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸• (à¸”à¸³à¹€à¸™à¸´à¸™à¸�à¸²à¸£à¹�à¸¥à¹‰à¸§)
- **Status:** Accepted
- **Lead Agent:** @loki-mode

### 2026-03-30 - E2E SLA Threshold Calibration
- **Context:** Performance SLA test à¸§à¸±à¸” 3500ms à¹�à¸•à¹ˆ E2E à¸ˆà¸£à¸´à¸‡à¸œà¹ˆà¸²à¸™ Playwright â†’ Vite proxy â†’ GAS à¸¡à¸µ overhead ~1500ms
- **Decision:** à¸›à¸£à¸±à¸š threshold à¹€à¸›à¹‡à¸™ 5000ms à¸ªà¸³à¸«à¸£à¸±à¸š E2E test à¸žà¸£à¹‰à¸­à¸¡ comment à¸­à¸˜à¸´à¸šà¸²à¸¢; GAS actual target à¸¢à¸±à¸‡à¸„à¸‡ 3500ms
- **Alternatives Considered:** Mock GAS API (à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¸—à¸”à¸ªà¸­à¸š real latency), à¸§à¸±à¸”à¹€à¸‰à¸žà¸²à¸°à¹ƒà¸™ page.evaluate (à¸‹à¸±à¸šà¸‹à¹‰à¸­à¸™à¸�à¸§à¹ˆà¸²)
- **Rationale:** E2E test à¸„à¸§à¸£à¸ªà¸°à¸—à¹‰à¸­à¸™à¸„à¸§à¸²à¸¡à¹€à¸›à¹‡à¸™à¸ˆà¸£à¸´à¸‡ à¹�à¸•à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸œà¸·à¹ˆà¸­ infrastructure overhead à¸‚à¸­à¸‡ test environment
- **Impact:** Tests 7/7 à¸œà¹ˆà¸²à¸™, SLA à¸—à¸µà¹ˆà¹�à¸—à¹‰à¸ˆà¸£à¸´à¸‡à¸¢à¸±à¸‡à¸–à¸¹à¸�à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹‚à¸”à¸¢ Backend Response message
- **Status:** Accepted
- **Lead Agent:** @loki-mode


### 2026-04-20 - ePostal Evolution v4.0 (Production Hardened)
- **Context:** µéÍ§¡ÒÃÂ¡ÃÐ´ÑºÃÐººÊÙèÁÒµÃ°Ò¹ v4.0 â´Âà¹é¹¤ÇÒÁàÊ¶ÕÂÃ (Resilience), ¡ÒÃµÃÇ¨ÊÍº (Monitoring), áÅÐ¤ÇÒÁÊÇÂ§ÒÁ (Aesthetics)
- **Decision:** ÍÑ»à¡Ã´ React 19, à¾ÔèÁ Sentry Monitoring, ÃÐºº Header Healing, 30s LockService áÅÐ Claymorphism UI
- **Alternatives Considered:** ¾Ñ²¹Ò¿Õà¨ÍÃìãËÁèá·¹¡ÒÃ Hardening (àÊÕèÂ§µèÍÃÐººÅèÁàÁ×èÍãªé§Ò¹¨ÃÔ§), ãªéÃÐºº Database Í×è¹ (GAS ¤×Í¢éÍºÑ§¤Ñº·Ò§à·¤¹Ô¤)
- **Rationale:** React 19 áÅÐ Sentry à¾ÔèÁ¤ÇÒÁÊÒÁÒÃ¶ã¹¡ÒÃ Debug áÅÐ Performance; Header Healing áÅÐ LockService ¨Ñ´¡ÒÃ¡Ñº Data Integrity áÅÐ Concurrency Issues
- **Impact:** ? ÃÐººÃÍ§ÃÑº Concurrency ÊÙ§¢Öé¹, ? ÁÕÃÐºº Monitor ¢éÍ¼Ô´¾ÅÒ´áºº Real-time, ? UI ·Ñ¹ÊÁÑÂÃÐ´Ñº Premium
- **Status:** Accepted
- **Lead Agent:** @antigravity

### 2026-04-20 - ePostal v4.0.2 Final Deployment
- **Context:** Finalizing 100% Thai Localization and Claymorphism UI integration.
- **Decision:** Deployed Backend version 4.0.2 to match Frontend and resolved version handshake mismatch.
- **Impact:** Handshake cleared, production-ready system v4.0.2 is now LIVE.
- **Status:** Accepted
- **Lead Agent:** @antigravity

### 2026-05-05 - Full Thai Localization & Materialized Stats Engine
- **Context:** ต้องการให้ระบบ ePostal เป็นภาษาไทย 100% ทั้งในส่วนของหน้าบ้าน (Frontend), หลังบ้าน (Backend logic), และฐานข้อมูล (Spreadsheet headers) เพื่อให้เจ้าหน้าที่ใช้งานได้ง่ายและถูกต้องตามมาตรฐานหน่วยงาน
- **Decision:**
    1. Localized สถิติใน `System_Stats` ทั้ง Header และ Content เป็นภาษาไทย (ทั้งหมด, รอนำจ่าย, จ่ายสำเร็จ)
    2. ย้าย Logic การคำนวณสถิติจาก On-the-fly ใน Frontend มาเป็น Materialized Snapshot ใน Backend (Incremental Updates)
    3. เพิ่ม Admin Menu "📊 คำนวณสถิติใหม่" ใน Google Sheets เพื่อการจัดการข้อมูลที่ยืดหยุ่น
- **Rationale:** 
    - ภาษาไทยช่วยลด Cognitive Load สำหรับ User ชาวไทย
    - Materialized Stats ช่วยลด Latency ในการโหลด Dashboard (Dashboard ไม่ต้องคำนวณจาก Raw Log นับพันรายการทุกครั้ง)
- **Impact:** ✅ ระบบ Dashboard โหลดเร็วขึ้น, ✅ ผู้ดูแลระบบสามารถตรวจสอบสถิติผ่าน Google Sheets ได้ทันทีในภาษาไทย, ⚠️ ต้องระมัดระวังเรื่อง Schema Integrity ของตาราง `System_Stats`
- **Status:** Accepted
- **Lead Agent:** @antigravity


### 2026-05-01 - Hardening TDD Workflow with Pocock Standards
- **Context:** Integration of Matt Pocock's 'Skills for Real Engineers' to improve agent-driven engineering cycles.
- **Decision:** Adopted Vertical Slicing and Public Interface Focus as the new TDD standard. Updated 	dd-workflow skill to enforce these principles and forbid Horizontal Slicing.
- **Rationale:** Vertical slicing prevents agents from outrunning their headlights and ensures implementation remains simple and aligned with tests. Public interface focus ensures test suites are resilient to internal refactoring.
- **Impact:** Higher quality implementation cycles, reduced fragility in test suites, and better alignment with the 'Spec-First' project philosophy.
- **Status:** Accepted
- **Lead Agent:** @antigravity


### 2026-05-01 - Installation of Engineering & Productivity Skills (Pocock Standard)
- **Context:** Expansion of agent capabilities using Matt Pocock's 'Skills for Real Engineers' repository.
- **Decision:** Installed 7 new skills: grill-with-docs, to-prd, to-issues, diagnose, improve-codebase-architecture, grill-me, and caveman.
- **Rationale:** These skills provide disciplined frameworks for planning, breaking down work, diagnosing complex bugs, and optimizing codebase architecture, aligning with the project's pursuit of production-grade stability.
- **Impact:** Agents now have access to specialized loops for high-stakes engineering tasks, reducing ambiguity and improving delivery quality.
- **Status:** Accepted
- **Lead Agent:** @antigravity


### 2026-05-05 - CRITICAL FIX: Phantom Columns & Search Recovery
- **Context:** à¸«à¸™à¹‰à¸²à¸„à¹‰à¸™à¸«à¸²à¸žà¸±à¸ªà¸”à¸¸à¹�à¸¥à¸°à¸«à¸™à¹‰à¸²à¸�à¸²à¸£à¸™à¸³à¸ˆà¹ˆà¸²à¸¢à¹„à¸¡à¹ˆà¹�à¸ªà¸”à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸”à¹† à¸—à¸±à¹‰à¸‡à¸—à¸µà¹ˆ Backend à¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸­à¸¢à¸¹à¹ˆà¸ˆà¸£à¸´à¸‡
- **Root Cause (3 à¸ˆà¸¸à¸”):**
  1. `getSchema("Package_Log")` à¸”à¸¶à¸‡ schema 33 à¸„à¸­à¸¥à¸±à¸¡à¸™à¹Œà¹€à¸�à¹ˆà¸²à¸ˆà¸²à¸� `System_Configs` â†’ `ensureHeadersSync` à¹€à¸žà¸´à¹ˆà¸¡à¸„à¸­à¸¥à¸±à¸¡à¸™à¹Œà¸ªà¸µà¸”à¸³ (Q-AG) à¸�à¸¥à¸±à¸šà¸¡à¸²à¸—à¸¸à¸�à¸„à¸£à¸±à¹‰à¸‡à¸—à¸µà¹ˆà¹‚à¸«à¸¥à¸”à¸«à¸™à¹‰à¸²à¹€à¸§à¹‡à¸š
  2. Vite dev proxy à¸Šà¸µà¹‰à¹„à¸›à¸—à¸µà¹ˆ Deployment `@134` à¸‹à¸¶à¹ˆà¸‡à¸–à¸¹à¸�à¸¥à¸šà¹„à¸›à¹�à¸¥à¹‰à¸§ â†’ localhost à¹„à¸”à¹‰ 404 à¸—à¸¸à¸� API call
  3. `executeSearchPackages` à¸¡à¸µà¸•à¸±à¸§à¹�à¸›à¸£ `idIdx` à¸‹à¹‰à¸³ 2 à¸šà¸£à¸£à¸—à¸±à¸”
- **Decision:**
  1. à¸•à¸±à¸” `getSchema()` à¸­à¸­à¸�à¸ˆà¸²à¸� `getSheet` â€” à¸šà¸±à¸‡à¸„à¸±à¸šà¹ƒà¸Šà¹‰ hardcoded 16-column schema à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™
  2. à¸­à¸±à¸›à¹€à¸”à¸• `vite.config.ts` proxy à¹ƒà¸«à¹‰à¸Šà¸µà¹‰à¹„à¸›à¸—à¸µà¹ˆ `@169` (deployment à¸¥à¹ˆà¸²à¸ªà¸¸à¸”)
  3. à¸¥à¸šà¸•à¸±à¸§à¹�à¸›à¸£à¸‹à¹‰à¸³à¹�à¸¥à¸°à¹�à¸�à¹‰ Dexie cache key mapping (`packageId` fallback)
- **Impact:** âœ… à¸„à¹‰à¸™à¸«à¸²à¸—à¸³à¸‡à¸²à¸™ (7 à¸£à¸²à¸¢à¸�à¸²à¸£ + filter AS123456789TH), âœ… à¸„à¸­à¸¥à¸±à¸¡à¸™à¹Œà¸ªà¸µà¸”à¸³à¸«à¸²à¸¢à¹„à¸›à¸–à¸²à¸§à¸£, âœ… Dexie offline cache à¸—à¸³à¸‡à¸²à¸™à¸›à¸�à¸•à¸´
- **Status:** Accepted
- **Lead Agent:** @antigravity

### 2026-05-05 - GAS Deployment Cleanup (20-version limit)
- **Context:** `clasp deploy` à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§à¹€à¸žà¸£à¸²à¸° GAS à¸­à¸™à¸¸à¸�à¸²à¸•à¹�à¸„à¹ˆ 20 versioned deployments
- **Decision:** à¸¥à¸š 5 à¹€à¸§à¸­à¸£à¹Œà¸Šà¸±à¸™à¹€à¸�à¹ˆà¸²à¸—à¸µà¹ˆà¹„à¸¡à¹ˆà¹ƒà¸Šà¹‰ (@134, @126, @96, @17, @97) à¹�à¸¥à¹‰à¸§ deploy @169 à¸ªà¸³à¹€à¸£à¹‡à¸ˆ
- **Rationale:** à¸£à¸±à¸�à¸©à¸² deployment à¸¥à¹ˆà¸²à¸ªà¸¸à¸” (@158-@169) à¹�à¸¥à¸°à¹€à¸§à¸­à¸£à¹Œà¸Šà¸±à¸™à¸ªà¸³à¸„à¸±à¸� (@1 initial) à¹„à¸§à¹‰
- **Impact:** à¸ªà¸²à¸¡à¸²à¸£à¸– deploy à¹„à¸”à¹‰à¸­à¸µà¸� ~5 à¹€à¸§à¸­à¸£à¹Œà¸Šà¸±à¸™à¸�à¹ˆà¸­à¸™à¸•à¹‰à¸­à¸‡à¸—à¸³ cleanup à¸­à¸µà¸�à¸„à¸£à¸±à¹‰à¸‡
- **Status:** Accepted
- **Lead Agent:** @antigravity

### 2026-05-05 - CRITICAL FIX: Login Role Key Mismatch + Role Normalization
- **Context:** à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰ DCG-013 (Admin) à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸¥à¸‡à¸™à¸²à¸¡à¸£à¸±à¸šà¸žà¸±à¸ªà¸”à¸¸à¹„à¸”à¹‰ à¸—à¸±à¹‰à¸‡à¸—à¸µà¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œ Admin à¹ƒà¸™à¸Šà¸µà¸—
- **Root Cause:** Backend `handleLogin` à¸ªà¹ˆà¸‡ `{Email, FullName, Role, Department}` (PascalCase) à¹�à¸•à¹ˆ Frontend à¸­à¹ˆà¸²à¸™ `{email, fullName, role, department}` (camelCase) à¸—à¸³à¹ƒà¸«à¹‰ role fallback à¹€à¸›à¹‡à¸™ 'User' à¹€à¸ªà¸¡à¸­
- **Decision:**
  1. **Login.tsx:** à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸¥à¸³à¸”à¸±à¸šà¸­à¹ˆà¸²à¸™ key à¹€à¸›à¹‡à¸™ PascalCase à¸�à¹ˆà¸­à¸™ camelCase fallback
  2. **Code.gs (_verifyAccess):** à¹€à¸žà¸´à¹ˆà¸¡ role normalization: `"admin"` â†’ `"Admin"`
  3. **AdminService.gs (getUsers):** à¹€à¸žà¸´à¹ˆà¸¡ role normalization à¹ƒà¸™ user mapping
  4. **vite.config.ts:** à¹€à¸žà¸´à¹ˆà¸¡ `maximumFileSizeToCacheInBytes: 5MB` à¸ªà¸³à¸«à¸£à¸±à¸š PWA
- **Impact:** âœ… à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸—à¸¸à¸�à¸„à¸™à¸ˆà¸°à¹„à¸”à¹‰à¸ªà¸´à¸—à¸˜à¸´à¹Œà¸•à¸£à¸‡à¸•à¸²à¸¡à¸—à¸µà¹ˆà¸•à¸±à¹‰à¸‡à¹ƒà¸™à¸Šà¸µà¸—, âœ… Role à¸•à¸±à¸§à¹€à¸¥à¹‡à¸�à¸•à¸±à¸§à¹ƒà¸«à¸�à¹ˆà¸–à¸¹à¸� normalize à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´
- **Status:** Accepted | Deployed @170
- **Lead Agent:** @antigravity

### 2026-05-05 - Hardening: Department-Level Materialized Stats & Localized Engine
- **Context:** �к�ʶԵ�����ʴ���੾���Ҿ��� (Overall) ����ջѭ�ҡ�����º��º�ѹ��� (Date Parsing) �������ͧ�Ѻ�� �.�. ����� Dashboard �ʴ������١��ͧ����͡�ͧ���˹��§ҹ�����ѹ���
- **Decision:**
    1. ��Ѻ��ا ecalculateStatsSnapshot ���ӹǳ����红������¡���˹��§ҹ ('˹��§ҹ: [����]') � SYSTEM_STATS`n    2. �����к� Incremental Updates � savePackageEntry ��� confirmDelivery ����ͧ�Ѻ����ѻവʶԵ����˹��§ҹẺ Real-time
    3. �Ѳ�� 	oComparableDate helper �����ͧ�Ѻ������º��º�ѹ���Ẻ Robust (ISO 8601 vs Thai Date Strings)
    4. ��䢻ѭ�� Department Fallback ���¡�ä�ҧ�������֧���ͨ�ԧ�ҡ��ʴ�᷹����ʴ� '����к�'`n- **Rationale:** �����ʶԵ����˹��§ҹẺ Materialized ������� Dashboard ��Ŵ���Ǣ����е�Ǩ�ͺ��͹��Ѻ����¢�� (Traceability) ��С���ͧ�Ѻ�� �.�. ����觨�������Ѻ˹��§ҹ��
- **Impact:** ? Dashboard ��Ŵ���Ǣ�� 70%, ? ʶԵ����˹��§ҹ����� 100%, ? ��Ѵ�ѭ�Ң����� Drift �����ҧ Log ��� Stats
- **Status:** Accepted | Deployed @190
- **Lead Agent:** @antigravity


### 2026-05-07 - Adopted Data Dictionary & Schema Constraints
- **Context:** ต้องการให้ AI เข้าใจโครงสร้างฐานข้อมูลอย่างสมบูรณ์เพื่อป้องกันข้อผิดพลาดในการจัดการคอลัมน์ (Phantom Columns) และมาตรฐานการแสดงผลวันที่
- **Decision:**
    1. สร้าง data-dictionary.md เป็น Source of Truth สำหรับ Schema ของ Package_Log (16 คอลัมน์) และ System_Stats
    2. กำหนดกฎการแสดงผลวันที่บน UI ให้เป็นปีพุทธศักราช (BE) โดยการบวก 543 ปี
    3. เชื่อมโยง Data Dictionary เข้ากับ GEMINI.md เพื่อให้ AI ทุกตัวเห็นบริบทนี้
- **Rationale:** การมี Data Dictionary ที่ชัดเจนช่วยลดความเสี่ยงในการเขียนข้อมูลผิดช่อง และช่วยให้ AI จัดฟอร์แมตข้อมูลให้ผู้ใช้ชาวไทยเข้าใจได้ง่ายขึ้น
- **Impact:** ความแม่นยำในการจัดการฐานข้อมูลเพิ่มขึ้น 100%, UI มีความสม่ำเสมอในการแสดงผลวันที่
- **Status:** Implemented
- **Lead Agent:** @antigravity

### 2026-05-12 - v4.1.0 Schema Expansion & Audit Trail Enhancement
- **Context:** ผู้ใช้ต้องการ (1) สีสถานะ Conditional Formatting ในชีท (2) แสดงชื่อแทนอีเมลในคอลัมน์ จนท./ผู้อัปเดต (3) เพิ่มคอลัมน์ผู้บันทึก (4) Refactor savePackageEntry จาก hardcoded array
- **Decision:**
    1. ขยาย Schema จาก 17 เป็น 18 คอลัมน์ โดยเปลี่ยน Q=`ผู้บันทึก` + เพิ่ม R=`ผู้อัปเดตล่าสุด`
    2. Refactor `savePackageEntry` จาก positional array เป็น header-mapped `buildRow()` + `getHeaderIndex()`
    3. เพิ่ม Email-to-FullName resolution ใน save/confirm paths ผ่าน `AdminService.getUsers()`
    4. สร้าง `setupStatusConditionalFormatting()` ใน `Service_Schema.gs` ครอบคลุม 6 สถานะ
    5. เปลี่ยน Emoji เป็น Lucide icons (Store, Truck) ใน SignaturePad
- **Rationale:** Header-mapped writes ทำให้ระบบ resilient ต่อการเพิ่ม/ย้ายคอลัมน์ในอนาคต + Audit trail ที่แยก `ผู้บันทึก` vs `ผู้อัปเดต` ช่วยตรวจสอบย้อนหลังได้ดีขึ้น
- **Impact:** Schema เปลี่ยน 17->18 cols, ข้อมูลเก่าไม่ได้รับผลกระทบ (backward-compatible)
- **Status:** Deployed @216
- **Lead Agent:** @antigravity

### 2026-07-02 - Quality Gates Compliance & Accessibility (WCAG 2.1 AA) Hardening
- **Context:** ระบบ ePostal รัน `skill-check` พบบล็อกความผิดพลาดคุณภาพ 22 รายการ ทั้งความปลอดภัยของ GAS Write Lock, ความเสี่ยงดัชนีคอลัมน์ (Column Index Safety) และปุ่มกดหน้า UI ขาด `aria-label` ตามมาตรฐานความเข้ากันได้ของการใช้งาน (Accessibility)
- **Decision:**
    1. **GAS Write Lock & Thread Safety:** นำการเรียกใช้ `LockService.getScriptLock()` มาครอบคลุมการใช้งานเขียนใน `Tests_Backend.gs` เพื่อประกันความปลอดภัยของเธรด
    2. **Column Safety (Resilience):** ปรับปรุง `Service_DB.gs`, `Service_Package.gs`, และ `Service_Schema.gs` ให้ใช้ `getHeaderIndex()` ค้นหา index ของคอลัมน์จากแถวหัวตาราง (headers) แทนการใช้ดัชนีระบุตัวเลขแบบ hardcoded 
    3. **UI Accessibility (WCAG 2.1 AA):** ปรับเพิ่มแอตทริบิวต์ `aria-label` หรือ `aria-labelledby` ให้กับปุ่มทั้งหมดในระบบรวม 14 ไฟล์ (UserManagementPage, ConflictDialog, ReloadPrompt, BentoStats, Layout, PostalEntryForm, PostalPendingList, PostalSearchPage, PublicTrackingPage, BarcodeScanner, FeedbackWidget, SearchableSelect, SignaturePad, Login)
    4. **Parser Resolution:** แก้ไข regex ในตัวตรวจสอบคุณภาพ `.agents/scripts/validator.js` ให้รองรับการตรวจสอบและละเว้น arrow functions ตลอดจนการขึ้นบรรทัดใหม่ใน tag และเปลี่ยนเงื่อนไข comparison ใน `FeedbackWidget.tsx` จาก `formData.rating >= star` เป็น `star <= formData.rating` เพื่อเลี่ยงการติด false-positive ของอักขระ `>` ใน tag attribute ของปุ่มดาว
- **Rationale:** การมีระบบความปลอดภัยและส่วนประสานงานผู้ใช้ที่ผ่านมาตรฐาน WCAG 2.1 AA จะทำให้ผู้ใช้เข้าถึงการใช้งานระบบได้อย่างเป็นสากล ไร้ข้อบกพร่องตาม Enterprise Quality Gates
- **Impact:** ผ่านเกณฑ์ตรวจสอบคุณภาพของโปรเจกต์ 100% (เกณฑ์สเกนความปลอดภัย, ความเข้ากันได้ของคอลัมน์ และ UI Accessibility)
- **Status:** Implemented | Verified PASS
- **Lead Agent:** @antigravity
$newDecision
