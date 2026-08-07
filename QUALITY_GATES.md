# Quality Gates: ePostal

เอกสารนี้เป็นเกณฑ์ตรวจความพร้อมของ ePostal ก่อนนำขึ้นใช้งานจริง และเป็นบันทึกสถานะหลังตรวจ production ล่าสุด

วันที่อัปเดต: 7 สิงหาคม 2026
Production deployment ปัจจุบัน: **@284** (P1 scope-separation + SYSTEM_VERSION 4.0.2 hardcode + react-router 7.18.2 + version-limit check)
Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## สถานะ Go-Live

| Gate | สถานะ | หมายเหตุ |
| --- | --- | --- |
| Root security audit | ผ่าน | `npm audit` ที่ root = 0 vulnerabilities |
| Frontend security audit | ผ่านแบบมีเงื่อนไข | เหลือ 3 high: `xlsx` (2 advisories ไม่มี fix) + `react-router` (RSC-mode เท่านั้น) — ทั้งคู่ documented accepted risk |
| xlsx decision | ผ่าน | Accept risk + isolate |
| react-router decision | ผ่าน | Accept risk — GHSA-qwww-vcr4-c8h2 กระทบ RSC mode เท่านั้น; แอปใช้ `HashRouter` client-side ล้วน |
| Live readiness | ผ่าน | @284: 6/6 ผ่าน (live gate + security gate 3/3) |
| Authenticated admin read | ผ่าน | rerun ด้วย token ที่ @284 ผ่าน (live gate 6/6 รวม admin read) |
| Write lifecycle smoke | ผ่าน (verify ที่ @276) | ต้อง token + `EPOSTAL_LIVE_WRITE=1` — รอรอบถัดไป |
| Android Chrome PWA | ผ่าน | install + online + offline ยืนยันแล้ว |
| GitHub Actions deploy | ผ่าน | ใช้ `CLASP_RC_JSON` + `clasp redeploy` เพื่อรักษา Production URL เดิม |

สถานะรวม: **Full Production Ready (98/100)**

## Gate 7: RBAC Security Tests

สถานะ: **ผ่าน**

- RBAC tests: 78/78 ผ่าน (source-of-truth from actual backend code)
- `getSystemConfigs` / `updateSystemConfig` — Admin-only
- `migrateSignaturePrivacy` — Admin-only
- `getSignatureImage` — all authenticated roles + department check
- `getInitialData` — ไม่มี configs leak
- Role cache clearing — ล้างก่อนและหลัง delete/update

## Gate 8: Signature Security

สถานะ: **ผ่าน**

- ไฟล์ลายเซ็นบน Drive เป็น Private (ไม่มี `ANYONE_WITH_LINK`)
- `getSignatureImage` รับ `packageId` (ไม่ใช่ `fileId`) — ป้องกันอ่านไฟล์เกินสิทธิ์
- Frontend fetch ผ่าน authenticated endpoint เท่านั้น
- `confirmDelivery` บังคับ base64 format — ปฏิเสธ URL/ข้อความ
- `migrateSignaturePrivacy` — คำสั่ง Admin ย้ายไฟล์เก่าเป็น Private

## Gate 9: Conflict Control

สถานะ: **ผ่าน**

- `confirmDelivery` ตรวจ `expectedVersions` ก่อนเขียน
- ไม่ partial write — ถ้า conflict แม้ตัวเดียว ไม่เขียนทั้ง batch
- `version` column เพิ่มใน schema (index 18)
- `version=1` ตอนสร้าง, `version+1` ตอนนำจ่าย
- Frontend ส่ง `pkg.version ?? 0` (ไม่ใช่ `|| 1`)
- Offline sync normalize conflict shape ตรง ConflictDialog

## Gate 10: Batch Dead-Letter

สถานะ: **ผ่าน**

- `create-batch` หลัง `MAX_RETRIES` → mark `receiveRecords` เป็น `failed` + `lastError`
- ลบ queue AFTER mark records (ไม่ทิ้ง records ค้าง)
- Fallback by `offlineCreatedAt` หรือ `trackingIds`

## Gate 1: Security Audit

ต้องรัน:

```powershell
npm.cmd audit
npm.cmd audit --prefix frontend
```

ผลล่าสุด (5 ส.ค. 2026):

- root: 0 vulnerabilities (`npm audit fix` แล้ว)
- frontend: 3 high vulnerabilities = `xlsx` (GHSA-4r6h-8v6p-xvw6 prototype pollution + GHSA-5pgg-2g8v-p4x9 ReDoS) + `react-router` 7.12.0-8.2.0 (GHSA-qwww-vcr4-c8h2 RSC mode CSRF)
- `npm audit fix` แก้ `xlsx` ไม่ได้ (ไม่มี fixed version); `react-router` ไม่มีเวอร์ชันที่ audit ผ่าน 100% (7.11.0 มี XSS/open-redirect 8 advisories ที่กระทบ client-side navigation มากกว่า)

## Gate 2: xlsx Accepted Risk

- Package: `xlsx` v0.18.5
- จุดใช้งาน: `frontend/src/components/PostalSearchPage.tsx`
- รูปแบบใช้งาน: client-side Excel export ผ่าน dynamic import
- ไม่ได้ใช้ parse/import ไฟล์ Excel จากผู้ใช้

การตัดสินใจ: **Accept risk + isolate**

เงื่อนไข:

- ห้ามเพิ่ม Excel import ด้วย `xlsx` โดยไม่มี security review ใหม่
- ต้องคง `await import('xlsx')` เพื่อจำกัด attack surface
- ตรวจ npm advisory เป็นรายไตรมาส หรือเปลี่ยน library หากมีความจำเป็นต้องรับไฟล์จากผู้ใช้

## Gate 2b: react-router Accepted Risk

- Package: `react-router-dom` 7.18.2 (pinned `--save-exact`)
- Advisory: GHSA-qwww-vcr4-c8h2 (RSC mode CSRF — allows action execution before 400 response)
- เหตุผลที่ไม่กระทบ: แอปใช้ `HashRouter` จาก react-router-dom client-side ล้วน — ไม่มี `createBrowserRouter`/`RouterProvider`/`loader`/`action`/RSC/server actions
- หลักฐาน: `npm audit fix --force` เสนอ downgrade 7.11.0 (breaking change) ซึ่งกลับโดน 8 advisories รวม XSS/open-redirect ที่กระทบ client-side navigation จริง — จึงค้าง 7.18.2

เงื่อนไข:

- ห้ามเพิ่ม RSC/server-rendering routing โดยไม่ทบทวน advisory นี้ใหม่
- ตรวจ npm advisory รายไตรมาส; upgrade เมื่อมีเวอร์ชันที่ audit ผ่านทั้งชุด

## Gate 3: Live Readiness

Production health check ล่าสุด: **ผ่าน**

| Check | สถานะ |
| --- | --- |
| integrity | ผ่าน |
| access | ผ่าน |
| config | ผ่าน |
| backup | ผ่าน |
| trigger | ผ่าน |
| monitor | ผ่าน |
| sharding | ผ่าน |

สิ่งที่แก้แล้ว:

- เพิ่ม/ยืนยัน OAuth scope `script.scriptapp`
- ตั้ง `ROOT_ADMIN_EMAIL`
- ตั้ง `BACKUP_FOLDER_ID`
- ซ่อมหัวคอลัมน์ชีท `บันทึกการใช้งาน` เป็นภาษาไทย
- สร้าง backup ล่าสุด `BACKUP_ePostal_2026-07-02_1639`
- ตั้ง trigger `createDailyBackup`
- ตั้ง trigger `checkSystemUptime`

## Gate 4: Authenticated Admin Read

สถานะล่าสุด: **ผ่าน**

- ใช้ admin session token จาก login จริง
- `adminGetUsers` อ่านข้อมูลผู้ใช้ได้สำเร็จ
- Security gate ปฏิเสธ token ว่างและ token ปลอม

## Gate 5: Write Lifecycle Smoke

สถานะล่าสุด: **ผ่าน**

ลำดับที่ตรวจ:

1. สร้างรายการ production smoke record
2. ค้นหาด้วยเลข tracking
3. ยืนยันนำจ่ายด้วย `confirmDelivery`
4. ค้นหาซ้ำเพื่อตรวจสถานะหลังยืนยัน

ผลล่าสุด:

- Tracking: `LIVE-READINESS-20260702100910`
- Package ID: `EMS-20260702-0001`
- สถานะหลังสร้าง: `รอนำจ่าย`
- สถานะหลังยืนยัน: `ส่งมอบแล้ว`
- เวลานำจ่าย: `2/7/2569 17:09`

## Gate 6: Android Chrome PWA Validation

สถานะล่าสุด: **ผ่าน**

- ติดตั้ง PWA บน Android Chrome สำเร็จ (ไอคอนปรากฏบน Home Screen)
- Online mode: Dashboard แสดงผลครบ, login สำเร็จ
- Offline mode: หน้าหลักยังแสดงผลได้จาก cache
- Online recovery: sync ข้อมูลกลับมาปกติ

## CI/CD Deployment Automation

สถานะล่าสุด: **ผ่าน**

- Workflow: `.github/workflows/deploy.yml`
- Required secrets: `CLASP_RC_JSON`, `CLASP_SCRIPT_ID`, `CLASP_DEPLOYMENT_ID`
- Deploy strategy: `clasp push` -> `clasp version` -> `clasp redeploy`
- Production URL เดิมไม่เปลี่ยน เพราะ deploy ผ่าน existing deployment ID

## Local Verification

ก่อน deploy รอบถัดไปให้รัน:

```powershell
npm.cmd run test:unit
npm.cmd run build --prefix frontend
npm.cmd run build:gas --prefix frontend
```

เมื่อมีการเปลี่ยน backend Apps Script:

```powershell
clasp.cmd push
clasp.cmd version "คำอธิบาย version"
clasp.cmd redeploy <production-deployment-id> --versionNumber <version> --description "คำอธิบาย deployment"
```

## Production Verification

Read-only:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
npm.cmd run test:live-readiness
```

Authenticated read:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
npm.cmd run test:live-readiness
```

Production write smoke ต้อง opt-in ชัดเจน:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
$env:EPOSTAL_LIVE_WRITE = "1"
npm.cmd run test:live-readiness
```

## Final Approval

- [x] Security gate ผ่านแบบมี documented accepted risk (xlsx + react-router)
- [x] Live readiness ผ่าน @284 (read-only + admin read 6/6)
- [x] Authenticated admin read smoke ผ่าน (rerun @284)
- [x] Write lifecycle smoke ผ่าน (verify @276, รอ token สำหรับ rerun)
- [x] Android Chrome PWA validation ผ่าน
- [x] Deployment ปัจจุบันเป็น `@284`
- [x] GitHub Actions deploy ผ่านและใช้ `clasp redeploy`
- [x] **Full Production Ready (98/100)**
