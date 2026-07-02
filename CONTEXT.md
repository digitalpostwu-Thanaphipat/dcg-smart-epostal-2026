# ePostal Context

## Current Production Deployment

- Production deployment: `@274`
- Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`
- Last deploy description: `Production - Sentry DSN updated to dcg-smart-epostal-2026 project`
- Readiness report: `PRODUCTION_READINESS_REPORT.md`
- Core workflows are production ready after local gates and deploy.

## Error Monitoring (Sentry)

- Sentry Organization: `dcg-smart-2026` (https://dcg-smart-2026.sentry.io)
- Sentry Project: `dcg-smart-epostal-2026` (Platform: React)
- DSN: Stored in `frontend/.env.local` as `VITE_SENTRY_DSN`
- Integration: `frontend/src/instrument.ts` (auto-init with ErrorBoundary in App.tsx)
- Features: Error Monitoring, Browser Tracing, Session Replay

## System Health Check (Backend)

- File: `backend/Service_Health.gs`
- Checks 7 points: integrity, access, config, backup, trigger, monitor, sharding
- Called from Admin UI: ตั้งค่าระบบ → ตรวจสุขภาพระบบ

## Package Log Glossary

- `ชื่อผู้รับไปรษณีย์ภัณฑ์`: ชื่อผู้รับที่บันทึกจากหน้าซองหรือหน้าพัสดุ ใช้แทนคำเดิม `ชื่อผู้รับ`
- `ผู้รับตามจ่าหน้า`: ชื่อที่บันทึกตอนยืนยันส่งมอบ/ลงนาม ใช้แทนคำเดิม `ผู้รับจริง`
- `วิธีการส่งมอบ`: ใช้ค่า `ส่งมอบที่หน่วยงาน`
- `ประเภทการใช้`: ใช้ค่า `ส่วนบุคคล` หรือ `งานมหาวิทยาลัย` เท่านั้น
- `จนท.ผู้นำจ่าย`, `ผู้บันทึก`, `ผู้อัปเดตล่าสุด`: แสดงชื่อบุคลากร ไม่แสดงอีเมลเมื่อพบข้อมูลผู้ใช้ในฐานข้อมูล
- `ลายเซ็น`: บันทึกเป็นรูปที่แสดงใน Google Sheets ผ่าน `IMAGE()` เมื่อระบบได้รับ data URL หรือ URL
- `ประเภท`: ใช้ค่า `ไปรษณีย์ธรรมดา`, `ไปรษณีย์ด่วนพิเศษ (EMS)`, หรือ `ไปรษณีย์ลงทะเบียน`
- `OCR`: ยกเลิกการใช้งานในขั้นตอนบันทึกรับไปรษณีย์ภัณฑ์ เพื่อเลี่ยงความเสี่ยงจากการอ่านเลขพัสดุผิด

## Build And Deploy Notes

- Apps Script project files live in `backend/`; run `clasp.cmd` commands from that directory.
- `npm.cmd run build:gas --prefix frontend` builds the frontend bundle and copies `frontend/dist/index.html` into `backend/index.html`.
- After frontend changes, run `build:gas` before `clasp.cmd push`; otherwise production can keep serving an old `backend/index.html`.
- OCR is retired end-to-end. Do not re-add `performOCR` to `Code.gs` route or role permission maps without a new reviewed workflow.

## Access Control Glossary

- `Postal`: เจ้าหน้าที่งานไปรษณีย์ที่ทำงานกับรายการไปรษณีย์ภัณฑ์ได้ รวมถึงการย้อนสถานะการนำจ่ายเมื่อจำเป็น
- `Staff`: เจ้าหน้าที่ปฏิบัติงานที่บันทึกและนำจ่ายไปรษณีย์ภัณฑ์ได้ แต่ไม่ใช่สิทธิ์สำหรับย้อนสถานะการนำจ่าย
- `DeptRep`: ตัวแทนหน่วยงาน ผู้มีรายชื่อในชีทผู้ใช้งานระบบและผูกกับหน่วยงาน ใช้สำหรับค้นหาไปรษณีย์ภัณฑ์ของหน่วยงานตนเองเท่านั้น
- `User`: ผู้ใช้งานทั่วไปที่มีรายชื่อในชีทผู้ใช้งานระบบ ใช้สำหรับค้นหาไปรษณีย์ภัณฑ์ของหน่วยงานตนเองเท่านั้น

## Migration Notes

- Runtime code ยังอ่านหัวคอลัมน์เก่า `ชื่อผู้รับ` และ `ผู้รับจริง` เพื่อรองรับชีทที่ยังไม่ได้ซ่อมหัวตาราง
- `ส่วนตัว` และ `ธุระส่วนตัว (ส่วนบุคคล)` เป็นค่า legacy สำหรับอ่านข้อมูลเก่าเท่านั้น รายการใหม่ต้องบันทึกเป็น `ส่วนบุคคล`
- `EMS`, `ไปรษณีย์ภัณฑ์ธรรมดา`, `นำจ่ายที่หน่วยงาน`, `เซ็นรับที่เคาน์เตอร์` เป็นค่า legacy ที่ต้อง normalize ก่อน full rollout
- หลัง deploy ให้รันฟังก์ชันซ่อมหัวตารางของโปรเจคเพื่อให้ชีทจริงใช้ schema ใหม่ครบ 18 คอลัมน์

## Installed Skills

- Installed from `google/agents-cli`: `google-agents-cli-workflow`, `google-agents-cli-scaffold`, `google-agents-cli-adk-code`, `google-agents-cli-eval`, `google-agents-cli-deploy`, `google-agents-cli-publish`, `google-agents-cli-observability`
- Current ePostal project is a React + Google Apps Script app, not an ADK agent project, so the agents-cli skills are used as workflow/code-preservation guidance only. Do not run scaffold/enhance unless the project is intentionally converted to an ADK agent project.
