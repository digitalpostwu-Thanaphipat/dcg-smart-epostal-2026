# รายงานความพร้อมใช้งานจริง ePostal

วันที่อัปเดต: 3 กรกฎาคม 2026
Production deployment ปัจจุบัน: **@275**
Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## สถานะสรุป

สถานะปัจจุบัน: **Full Production Ready (95/100)**

ระบบผ่าน 6 Gates สุดท้ายก่อน Go-Live แล้ว:

| Gate | สถานะ | รายละเอียด |
| --- | --- | --- |
| 1. Security audit | ผ่านแบบมีเงื่อนไข | root audit = 0 vulnerabilities, frontend เหลือ `xlsx` high vulnerability ที่ไม่มี fix |
| 2. xlsx decision | ผ่าน | ยอมรับความเสี่ยง + isolate เพราะใช้เฉพาะ client-side Excel export ผ่าน dynamic import |
| 3. Live readiness | ผ่าน | production health check เป็น `healthy`, checks ทั้ง 7 จุดผ่าน |
| 4. Authenticated admin read | ผ่าน | adminGetUsers อ่านข้อมูลผู้ใช้ได้สำเร็จ |
| 5. Write lifecycle smoke | ผ่าน | create -> search -> confirm -> verify บน production สำเร็จ |
| 6. Android Chrome PWA | ผ่าน | install + online + offline ยืนยันแล้ว |

ระบบพร้อมใช้งานจริงสำหรับงานหลัก:

- บันทึกรับไปรษณียภัณฑ์
- ค้นหารายการ
- นำจ่ายและบันทึกลายเซ็น
- ตรวจสอบรายการผ่านลิงก์ติดตาม
- จัดการสิทธิ์ผู้ใช้ตาม role
- สำรองข้อมูลและตรวจสุขภาพระบบ
- ติดตั้งเป็น PWA บน Android

## Deployment ล่าสุด

| รายการ | สถานะ | รายละเอียด |
| --- | --- | --- |
| Apps Script deployment | ผ่าน | redeploy production เป็น `@275` โดย URL เดิมไม่เปลี่ยน |
| GitHub Actions deployment | ผ่าน | CI ใช้ `CLASP_RC_JSON`, สร้าง version และ `clasp redeploy` ไปยัง deployment เดิม |
| OAuth scope | ผ่าน | เพิ่ม/ยืนยัน `https://www.googleapis.com/auth/script.scriptapp` |
| Script Properties | ผ่าน | ตั้ง `ROOT_ADMIN_EMAIL` และ `BACKUP_FOLDER_ID` แล้ว |
| ชีทบันทึกการใช้งาน | ผ่าน | ซ่อมหัวคอลัมน์เป็นภาษาไทย 100% แล้ว |
| Backup | ผ่าน | สร้าง backup `BACKUP_ePostal_2026-07-02_1639` แล้ว |
| Triggers | ผ่าน | มี `createDailyBackup` และ `checkSystemUptime` |
| Health check | ผ่าน | `integrity`, `access`, `config`, `backup`, `trigger`, `monitor`, `sharding` ผ่านทั้งหมด |

## ผลตรวจล่าสุด

| การตรวจสอบ | ผล |
| --- | --- |
| `npm audit` ที่ root | ผ่าน, 0 vulnerabilities |
| `npm audit` ที่ frontend | เหลือ 1 high vulnerability จาก `xlsx`, ไม่มี fix available |
| Lint | ผ่าน, 0 warnings, 0 errors |
| Unit tests | ผ่าน, 22/22 |
| Playwright E2E | ผ่าน, 11 passed, 5 skipped |
| Live health check | ผ่าน, `healthy` |
| Security gate | ผ่าน, ปฏิเสธ token ว่างและ token ปลอม |
| Authenticated admin read smoke | ผ่าน |
| Write lifecycle smoke | ผ่าน |
| GitHub Actions deploy | ผ่าน, deploy ผ่าน `clasp redeploy` โดย Production URL เดิมไม่เปลี่ยน |

## Commits ล่าสุด

| Commit | รายละเอียด |
| --- | --- |
| `d253e07` | ci: use clasp credentials secret and redeploy production |
| `6ef406d` | docs: complete documentation updates for Full Production Ready |
| `b783848` | chore: clear lint warnings and fix live readiness gate (15 files) |
| `c69475c` | fix: add GAS redirect handler to Vite dev proxy |

## ความเสี่ยงที่ยอมรับ

### `xlsx`

- Package: `xlsx` v0.18.5
- Advisory: Prototype Pollution และ ReDoS
- สถานะ: ไม่มี fix available จาก `npm audit fix`
- การตัดสินใจ: **Accept risk + isolate**
- เหตุผล: ใช้เฉพาะ client-side Excel export ใน `frontend/src/components/PostalSearchPage.tsx` ผ่าน `await import('xlsx')` และไม่ได้ parse ไฟล์ Excel จากผู้ใช้

เงื่อนไข:

- ห้ามใช้ `xlsx` สำหรับ import/parse ไฟล์จากผู้ใช้โดยไม่มี security review ใหม่
- ต้องคง dynamic import ไว้
- ถ้าต้องเพิ่ม Excel import ในอนาคต ให้เปลี่ยน library หรือออกแบบ sandbox/validation ก่อน

## งานคงเหลือ

- ติดตาม advisory ของ `xlsx` เป็นรายไตรมาส
- หลัง Go-Live ให้ตรวจ backup และ uptime monitor เป็นรอบประจำ
- ทำ write smoke test เป็นรอบเมื่อมีการเปลี่ยนแปลง workflow หลัก

## เอกสารที่เกี่ยวข้อง

- `CHANGELOG.md`
- `QUALITY_GATES.md`
- `CONTEXT.md`
- `docs/production-readiness-live-gate.md`
- `docs/admin-operations.md`
- `DECISION_LOG.md`
