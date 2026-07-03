# Changelog

All notable changes to ePostal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
