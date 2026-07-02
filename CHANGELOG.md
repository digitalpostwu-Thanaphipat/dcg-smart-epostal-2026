# Changelog

All notable changes to ePostal will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

### Added
- CI/CD pipeline: `.github/workflows/deploy.yml` (auto deploy on push to main)
- GitHub Secrets configured: `CLASP_SCRIPT_ID`, `CLASP_TOKEN`

### Documentation
- `CONTEXT.md` updated with CI/CD, Rate Limiting, Backup info
- `QUALITY_GATES.md` updated with new checkpoints
- `CHANGELOG.md` created

---

## [4.0.2] - 2026-07-01 to 2026-07-02

### @272 - Accessibility Compliance

#### Fixed
- Added missing `aria-label` to all buttons in `SystemSettingsPage.tsx`
- Advanced tools drawer buttons: Uptime Monitor, Maintenance, Repair Schema, Restore

### @271 - Cleanup & Optimization

#### Removed
- Unused dependencies: `@tailwindcss/forms`, `prop-types`, `@types/prop-types`, `idb`
- AI Model selection UI from `SystemSettingsPage.tsx`
- 8 debug scripts moved from `backend/` to `scratch/`

#### Changed
- Backend files reduced from 25 to 17 files

### @268 - Security & Monitoring

#### Added
- Health Check Endpoint: `?get=health` -> `Service_Health.gs`
- Rate Limiting: 15 requests/minute for public tracking search
- Automated Backup: Time-driven trigger `createDailyBackup`
- Sheet Protection: `repairProjectSheetHeaders` locks header rows

#### Fixed
- Removed PII leaks: user email/role no longer logged in plaintext
- Fixed empty `catch(e) {}` blocks -> added `console.warn` logging
- Cleaned `console.log` from frontend production code

#### Security
- `.env.local` verified not tracked in git

### @266 - Quality Gates Hardening

#### Fixed
- ESLint errors resolved (0 errors; 44 warnings remain as technical debt)
- React 19 compliance: component declarations moved outside main functions
- Unused imports cleaned: `Sentry`, `configs`, catch block parameters

#### Changed
- `SignaturePad.tsx`: Fixed setState cascade with setTimeout
- `useOfflineSync.ts`: Wrapped callbacks with `useCallback`
- `App.tsx`: `VersionMismatchBanner` moved outside component
- `Layout.tsx`: `SyncBadge` moved outside component

### @264 - OCR Retirement & Production Hardening

#### Removed
- OCR functionality from postal entry workflow
- `performOCR` from `ROLE_PERMISSIONS` and `ROUTE_MAP`
- AI/OCR parcel scan control from frontend
- AI model selection from system settings

#### Changed
- `Service_AI.performOCR()` now returns `OCR_RETIRED` (compatibility stub)
- Delivery confirmation optimized with grouped batch writes

#### Fixed
- Production write error resolved
- Full write test passed

#### Security
- Removed hardcoded secrets
- Fixed audit issues
- Updated documentation

---

## Summary

| Deployment | Date | Key Changes |
|-----------|------|-------------|
| @272 | 2026-07-02 | Accessibility (WCAG 2.1 AA) |
| @271 | 2026-07-02 | Dependency cleanup, Debug scripts removed |
| @268 | 2026-07-02 | Health Check, Rate Limiting, Backup, Security |
| @266 | 2026-07-01 | ESLint fixes, React 19 compliance |
| @264 | 2026-07-01 | OCR retired, Production hardening |

---

## Links

- Production URL: https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec
- GitHub: https://github.com/digitalpostwu-Thanaphipat/dcg-smart-epostal-2026
- Sentry: https://dcg-smart-2026.sentry.io
