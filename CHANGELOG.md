# Changelog

All notable changes to ePostal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [@274] - 2026-07-02

### Added
- **CI/CD Pipeline**: `.github/workflows/deploy.yml` for automated build + deploy on push to main
- **Required GitHub Secrets documented**: `CLASP_SCRIPT_ID`, `CLASP_TOKEN`

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
| @274 | 2026-07-02 | CI/CD Pipeline, Documentation Update |
| @272 | 2026-07-02 | Sheet Protection, Accessibility Fixes |
| @271 | 2026-07-02 | Unused Modules Cleanup, AI Model Removal |
| @268 | 2026-07-02 | Health Check, Rate Limiting, Automated Backup |
| @266 | 2026-07-02 | Security Fixes (PII, Catch Blocks, Console.log) |
| @264 | 2026-07-01 | Initial Production Deployment |
