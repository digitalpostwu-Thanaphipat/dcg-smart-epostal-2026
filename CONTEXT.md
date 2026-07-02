# ePostal Context

## Current Production Deployment

- Production deployment: `@275`
- Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`
- Last deploy description: `Production - Gate 3 Thai audit health schema and scriptapp scope`
- Readiness report: `PRODUCTION_READINESS_REPORT.md`
- Current status: พร้อม Go-Live สำหรับ workflow หลัก หลังผ่าน live readiness และ write lifecycle smoke

## Production Readiness Status

ผ่าน 4 Gates สุดท้ายแล้ว:

1. Root audit = 0 vulnerabilities; frontend เหลือ `xlsx` high vulnerability ที่ไม่มี fix available
2. ตัดสินใจ `xlsx` เป็น accepted risk + isolate
3. Live health check ผ่าน 7/7 checks
4. Production write lifecycle smoke ผ่าน create -> search -> confirm -> verify

ยังรอ manual Android Chrome PWA install/offline validation ก่อนประกาศ full PWA readiness

## Error Monitoring

- Sentry Organization: `dcg-smart-2026`
- Sentry Project: `dcg-smart-epostal-2026`
- DSN: เก็บใน `frontend/.env.local` เป็น `VITE_SENTRY_DSN`
- Integration: `frontend/src/instrument.ts` และ ErrorBoundary ใน `App.tsx`

## System Health Check

- File: `backend/Service_Health.gs`
- Endpoint: `?get=health`
- Checks 7 จุด: integrity, access, config, backup, trigger, monitor, sharding
- Audit sheet schema ใช้หัวคอลัมน์ภาษาไทยของชีท `บันทึกการใช้งาน`
- Required Script Properties: `ROOT_ADMIN_EMAIL`, `BACKUP_FOLDER_ID`
- Required OAuth scope: `https://www.googleapis.com/auth/script.scriptapp`

## Operations

- Backup trigger: `createDailyBackup`
- Uptime trigger: `checkSystemUptime`
- Latest verified backup: `BACKUP_ePostal_2026-07-02_1639`
- Public tracking link: production URL + `?publicTrack=1`

## Security Notes

- ห้าม commit secrets, session token, OTP, Google Drive folder ID ที่เป็นความลับ หรือ Apps Script properties ลง repo
- ถ้า session token ถูกส่งในแชตหรือ log ให้ logout/re-login เพื่อออก token ใหม่
- `xlsx` ใช้ได้เฉพาะ export ฝั่ง client ห้ามใช้ parse/import ไฟล์จากผู้ใช้โดยไม่มี security review ใหม่

## CI/CD Pipeline

- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main` หรือ manual dispatch
- Secrets required: `CLASP_SCRIPT_ID`, `CLASP_TOKEN`
- Process: test -> build frontend -> deploy to GAS

## Build And Deploy Notes

- Apps Script project files live in `backend/`; run `clasp.cmd` commands from that directory when needed
- `npm.cmd run build:gas --prefix frontend` builds frontend and copies `frontend/dist/index.html` into `backend/index.html`
- After frontend changes, run `build:gas` before `clasp.cmd push`
- After backend changes, use `clasp.cmd push`, create version, then redeploy the production deployment ID

## Production Verification

Read-only:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
npm.cmd run test:live-readiness
```

Authenticated read/write checks require a fresh admin session token and explicit write opt-in. See `docs/production-readiness-live-gate.md`

## Retired OCR Flow

- OCR ถูกยกเลิกจาก workflow บันทึกรับไปรษณียภัณฑ์แล้ว
- Frontend ไม่แสดงปุ่ม AI/OCR
- Backend ไม่ expose `performOCR` ใน route/RBAC
- `backend/Service_AI.gs` เป็น compatibility stub เท่านั้น

## Installed Skills

- Installed from `google/agents-cli`: `google-agents-cli-workflow`, `google-agents-cli-scaffold`, `google-agents-cli-adk-code`, `google-agents-cli-eval`, `google-agents-cli-deploy`, `google-agents-cli-publish`, `google-agents-cli-observability`
- Current ePostal project is React + Google Apps Script, not an ADK agent project
