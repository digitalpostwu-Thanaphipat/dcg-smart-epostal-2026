# Quality Gates: ePostal

เอกสารนี้เป็นเกณฑ์ตรวจความพร้อมของ ePostal ก่อนนำขึ้นใช้งานจริง และเป็นบันทึกสถานะหลังตรวจ production ล่าสุด

วันที่อัปเดต: 10 กรกฎาคม 2026
Production deployment ปัจจุบัน: **@276** (Security & Conflict Control Release)
Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## สถานะ Go-Live

| Gate | สถานะ | หมายเหตุ |
| --- | --- | --- |
| Root security audit | ผ่าน | `npm audit` ที่ root = 0 vulnerabilities |
| Frontend security audit | ผ่านแบบมีเงื่อนไข | เหลือ `xlsx` high vulnerability ไม่มี fix available |
| xlsx decision | ผ่าน | Accept risk + isolate |
| Live readiness | ผ่าน | health check 7/7 ผ่าน |
| Authenticated admin read | ผ่าน | adminGetUsers อ่านข้อมูลผู้ใช้ได้ |
| Write lifecycle smoke | ผ่าน | create -> search -> confirm -> verify ผ่านบน production |
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

ผลล่าสุด:

- root: 0 vulnerabilities
- frontend: 1 high vulnerability จาก `xlsx`
- `npm audit fix` ไม่สามารถแก้ `xlsx` ได้ เพราะไม่มี fixed version

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

- [x] Security gate ผ่านแบบมี documented accepted risk
- [x] Live readiness ผ่าน
- [x] Authenticated admin read smoke ผ่าน
- [x] Write lifecycle smoke ผ่าน
- [x] Android Chrome PWA validation ผ่าน
- [x] Deployment ปัจจุบันเป็น `@275`
- [x] GitHub Actions deploy ผ่านและใช้ `clasp redeploy`
- [x] **Full Production Ready (95/100)**
