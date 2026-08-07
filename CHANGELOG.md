# Changelog

All notable changes to ePostal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [7 สิงหาคม 2026] - Test Data Cleanup & Live Gate Verification

### Added
- **`adminDeletePackages` (Admin-only)**: action ลบ package หลายรายการพร้อมกันใน `Service_Package.gs` + register ใน `Code.gs` (ROLE_PERMISSIONS.Admin, ROUTE_MAP, SCHEMA validation)
  - Safety: ต้อง `confirmation: "ล้างข้อมูลทดสอบ"`, จำกัด ≤50 ids, `LockService.waitLock(30000)`, `deleteRow` จากล่างขึ้นบน, idempotent (ids ไม่เจอ → `missing` เป็น error พร้อม `deleted`)
  - Audit trail ผ่าน `logAction(actor, "adminDeletePackages", {requested, deletedCount, deleted, missing})`
- **`scripts/run-live-testdata-cleanup.cjs`**: runner ล้าง test data live — env gates 3 ตัว (`EPOSTAL_LIVE_BASE_URL`, `EPOSTAL_LIVE_AUTH_TOKEN`, `CONFIRM_CLEANUP="ล้างข้อมูลทดสอบ"`), retry 6×8s, verify `checkDuplicate` = false; npm script `cleanup:testdata`

### Fixed
- **Duplicate test records ล้างแล้ว**: `AS123456789TH` ค้าง 2 แถวใน EMS shard (`EMS-20260501-0005`, `EMS-20260505-0001`) โดนลบ → `searchPackages` 0 rows, `checkDuplicate` = `isDuplicate=false`
- **Runner idempotency**: อ่าน `isDuplicate` top-level + ถ้าไม่มี record ให้ลบถือว่า clean (exit 0)

### Deployment
- Production redeploy **@285** (Auto-Deploy adminDeletePackages, 7 ส.ค. 2026 15:26) — ใช้ `clasp push -f` → version 285 → `clasp redeploy` กับ deployment `AKfycby1...` ให้ URL เดิมไม่เปลี่ยน

### Verified
- Live readiness gate rerun หลัง redeploy: **6/6 passed (2.0m)** EXIT 0 (live_production_readiness + live_full_cycle)
- RBAC unit tests + security gate (จาก release ก่อนหน้า): ผ่าน 78/78 + 3/3

---

## [10 กรกฎาคม 2026] - Security & Conflict Control Release

### Security (P0)
- **Configs leak**: ลบ `configs` ออกจาก `getInitialData()` — ป้องกัน API key/token รั่วถึง User role
- **Signature privacy**: ไฟล์ลายเซ็นบน Drive เปลี่ยนเป็น Private; `getSignatureImage` endpoint ตรวจ token + department
- **RBAC hardening**: `getSystemConfigs` / `updateSystemConfig` / `migrateSignaturePrivacy` — Admin-only
- **Role cache clearing**: `adminDeleteUser` / `adminUpdateUser` ล้าง cache ก่อนและหลัง operation สำเร็จ
- **Nested locks**: `Service_Feedback` / `Service_Batch` ใช้ `lock.hasLock()` ป้องกัน lock ซ้ำจาก doPost

### Conflict Control (P1)
- **Version column**: เพิ่มคอลัมน์ `version` (index 18) ใน `Package_Log`
- **Optimistic locking**: `confirmDelivery` ตรวจ `expectedVersions` ก่อนเขียน — ไม่ตรง → return `CONFLICT` ไม่ partial write
- **Version lifecycle**: สร้างใหม่ `version=1`, นำจ่ายสำเร็จ `version+1`
- **Conflict response**: normalize เป็น `{ packageId, currentData, conflicts[] }` ตรงกับ ConflictDialog

### Batch Dead-Letter (P1)
- **create-batch handling**: `SyncService._handleRetryOrFail()` รองรับ `create-batch` — mark `receiveRecords` เป็น `failed` พร้อม `lastError` ก่อนลบ queue

### Error Classification (P1)
- **Server response = show immediately**: ข้อผิดพลาดจาก server (duplicate, permission, validation) แสดง toast ทันที ไม่เข้าคิว offline
- **Network failure only = offline queue**: เฉพาะ genuine network failure เท่านั้นที่เข้าคิว

### User Management (P1)
- **Department dropdown**: เพิ่ม `<select>` จาก master departments (ไม่ใช่ free text)
- **Postal role**: เพิ่ม role "Postal (เจ้าหน้าที่นำจ่าย)" ใน user management

### Other Fixes
- **reportIssue field**: Frontend ส่ง `issueType` ตรงกับ backend validation
- **Master data cache**: ลบ debug `localStorage.removeItem` ที่ล้าง cache ก่อนอ่านทุกครั้ง
- **Migration setValue**: `Service_DB.gs` ใช้ `setValue()` แทน `setFormula()` สำหรับ file ID

### Verified
- Unit tests: 117/117 ผ่าน
- RBAC tests: 78/78 ผ่าน (source-of-truth from actual backend code)
- Build: ผ่าน
- ESLint: 0 errors

---

## [3 กรกฎาคม 2026] - Full Production Ready

### Fixed
- **Lint warnings**: แก้ไข 47 warnings เหลือ 0 warnings (12 ไฟล์)
- **React hooks/purity**: แก้ `Date.now()`, `Math.random()` impure calls, setState-in-effect patterns, exhaustive-deps
- **Unused imports/vars**: ลบ unused imports ใน 10 ไฟล์, เปลี่ยน catch vars เป็น `_e` prefix
- **Live readiness test**: แก้ test ให้ตรงกับ GAS iframe architecture (check raw HTML แทน rendered body)
- **Dev proxy**: เพิ่ม GAS redirect handler ให้ follow 302 redirect server-side ป้องกัน CORS
- **GitHub Actions deploy**: แก้ clasp credentials ให้ใช้ `CLASP_RC_JSON` และเปลี่ยน production deploy เป็น `clasp redeploy`

### Verified
- Build frontend: ผ่าน (7.92s)
- Build GAS: ผ่าน (10.35s)
- Unit tests: 22/22 ผ่าน
- Playwright E2E: 11/11 ผ่าน
- Live readiness gate: 4/4 ผ่าน (public page, health check, security gate, authenticated read)
- PWA install (Android Chrome): ผ่าน
- PWA online mode: ผ่าน
- PWA offline mode: ผ่าน
- GitHub Actions deploy: ผ่าน โดยรักษา Production URL เดิม

### Security
- ESLint config: เพิ่ม `caughtErrorsIgnorePattern: '^_'` สำหรับ catch variables
- Required deploy secrets: `CLASP_RC_JSON`, `CLASP_SCRIPT_ID`, `CLASP_DEPLOYMENT_ID`

---

## [@275] - 2026-07-02

### Fixed
- **Live readiness health check**: Updated `Service_Health.gs` to validate the Thai audit log schema for sheet `บันทึกการใช้งาน`
- **Production blockers cleared**: OAuth scope, Script Properties, audit sheet headers, backup freshness, and uptime trigger are now verified

### Verified
- Production deployment redeployed to `@275`
- Health check status is `healthy` with 7/7 checks passing
- Write lifecycle smoke passed on production: create -> search -> confirm -> verify
- Smoke record: `LIVE-READINESS-20260702100910`, package ID `EMS-20260702-0001`, final status `ส่งมอบแล้ว`

### Security
- Documented `xlsx` as accepted risk + isolate: client-side export only, no user-uploaded Excel parsing
- Root audit: 0 vulnerabilities
- Frontend audit: 1 known high vulnerability from `xlsx`, no fix available

---

## [@274] - 2026-07-02

### Added
- **CI/CD Pipeline**: `.github/workflows/deploy.yml` for automated build + deploy on push to main
- **Initial GitHub Secrets documented**: `CLASP_SCRIPT_ID`, `CLASP_TOKEN` (later replaced by `CLASP_RC_JSON` deployment flow)

### Changed
- Updated `CONTEXT.md` with CI/CD, rate limiting, and backup documentation
- Updated `QUALITY_GATES.md` with new production checkpoints

---

## [@272] - 2026-07-02

### Added
- **Sheet Protection**: `repairProjectSheetHeaders` locks header rows automatically
- **Accessibility**: Added `aria-label` to all buttons in SystemSettingsPage advanced tools

### Fixed
- All 16 buttons without `aria-label` now comply with WCAG 2.1 AA

---

## [@271] - 2026-07-02

### Removed
- **Unused dependencies**: `@tailwindcss/forms`, `prop-types`, `@types/prop-types`, `idb`
- **AI Model Selection UI**: Removed from SystemSettingsPage (OCR retired)

### Changed
- Cleaned up `package.json` files (root + frontend)
- Reduced backend files from 25 to 17 by removing debug scripts

---

## [@268] - 2026-07-02

### Added
- **Health Check Endpoint**: `?get=health` returns JSON status with 7 system checks
- **Rate Limiting**: `checkRateLimit()` limits public search to 15 requests/min per department
- **Automated Backup**: Time-driven trigger `createDailyBackup` configured

### Changed
- `Service_Health.gs`: New health check service with integrity, access, config, backup, trigger, monitor, sharding checks
- `Service_Utils.gs`: Added `checkRateLimit()` function using CacheService
- `Service_Package.gs`: Applied rate limiting to `publicSearchPackages()`

---

## [@266] - 2026-07-02

### Fixed
- **Security - PII Leak**: Removed email + role logging from `Code.gs` (lines 478, 480)
- **Security - Debug Objects**: `window.ApiClient` and `window.db` removed via tree-shaking in production
- **Silent Failures**: 10 empty `catch(e) {}` blocks replaced with `console.warn()` logging
- **Console.log Cleanup**: Removed debug logs from `main.tsx` (4 locations)

### Changed
- `Service_DB.gs`: Empty catch blocks now log warnings
- `Service_Package.gs`: Empty catch blocks now log warnings
- `AdminService.gs`: Empty catch block now logs warning
- `Tests_Backend.gs`: Empty catch block now logs warning

---

## [@264] - 2026-07-01

### Added
- **Release**: Initial production deployment
- **Readiness Report**: `PRODUCTION_READINESS_REPORT.md` created

### Notes
- Core workflows production ready
- Full PWA readiness requires Android Chrome install/offline verification

---

## Summary Table

| Version | Date | Key Changes |
|---------|------|-------------|
| @276 | 2026-07-03 | Lint Cleanup (47→0), Proxy CORS Fix, Full Production Ready (95/100) |
| @275 | 2026-07-02 | Live Readiness Passed, Thai Audit Health Schema, Write Lifecycle Smoke |
| @274 | 2026-07-02 | CI/CD Pipeline, Documentation Update |
| @272 | 2026-07-02 | Sheet Protection, Accessibility Fixes |
| @271 | 2026-07-02 | Unused Modules Cleanup, AI Model Removal |
| @268 | 2026-07-02 | Health Check, Rate Limiting, Automated Backup |
| @266 | 2026-07-02 | Security Fixes (PII, Catch Blocks, Console.log) |
| @264 | 2026-07-01 | Initial Production Deployment |
