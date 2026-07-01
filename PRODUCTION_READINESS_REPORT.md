# รายงานความพร้อมโปรเจกต์ ePostal

วันที่ตรวจ: 1 กรกฎาคม 2026  
สถานะรวม: **Production Ready (Pending Full Write Test)**  
Deployment ปัจจุบัน: **@252** (Frontend + Backend deploy)

## สรุปสั้น

ระบบผ่านการทดสอบหลักทั้งหมด (Unit tests 22/22, Playwright E2E 11/11, Build สำเร็จ) และ deployment @252 ใช้งานได้จริง (login, admin, read, search) ผ่าน security hardening ทั้งหมดแล้ว เหลือ Gate เดียวที่ต้องทำ: Full Write Test บน production data

## Full Rollout Gates

| Gate | สถานะ | รายละเอียด |
|------|-------|-----------|
| 1. Full Write Test | **PENDING** | ต้องทำ manual test: เพิ่มพัสดุจริง → เปลี่ยนสถานะ → verify Sheets → verify audit log |
| 2. Frontend Deploy | PASS | `npm run build:gas` → copy → `clasp push` → `clasp deploy @252` |
| 3. PWA Install Test | **PENDING** | ต้อง test บน mobile Chrome/Android: manifest, sw.js MIME, install prompt |
| 4. Prod Smoke Test | **PENDING** | ต้อง test หลัง deploy: login, search, public tracking, pending list |
| 5. Git Clean + Tag | PASS | `git status` clean + tag `v4.0.2-prod` pushed |

## ผลทดสอบล่าสุด

| รายการตรวจ | ผลลัพธ์ | รายละเอียด |
| --- | --- | --- |
| `npm run test:unit` | PASS 22/22 | Vitest unit tests ผ่านทั้งหมด |
| `npx playwright test` | PASS 11/11 | Playwright E2E ผ่านทั้งหมด |
| `npm run build:gas --prefix frontend` | PASS | Single-file build 4.2MB สำเร็จ |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities (แก้ไขแล้ว 12 → 0) |
| Live deployment @252 | PASS | Frontend + Backend deploy สำเร็จ |
| OTP login | PASS | ยืนยัน OTP สำเร็จ |
| Admin permission | PASS | `digitalpost.wu@gmail.com` ได้สิทธิ์ Admin |
| Read/Search | PASS | อ่านข้อมูล 15 users, 62 departments, 17 packages |
| Service Account key cleanup | PASS | ลบ `epostal-mcp-key.json/` แล้ว |
| Mock-token bypass removal | PASS | ลบ dev-mode bypass แล้ว |
| Hardcoded Sheet IDs removal | PASS | ย้ายไป Script Properties ทั้งหมด |
| VITE_GAS_URL warning fix | PASS | แก้ไขแล้ว ไม่เตือนเมื่อรันบน GAS |
| Git status | PASS | Clean + tag `v4.0.2-prod` pushed |

## สิ่งที่แก้ไขล่าสุด (1 กรกฎาคม 2026)

1. **npm audit fix**: แก้ไข vulnerabilities ทั้งหมด 12 รายการ (1 critical, 5 high) เหลือ 0
2. **ลบ Service Account key**: ลบ `epostal-mcp-key.json/` ที่มี private key บน disk
3. **ลบ mock-token bypass**: ลบ dev-mode bypass ใน `Service_Auth.gs` + `client.ts`
4. **ลบ hardcoded Sheet IDs**: ย้ายไป Script Properties ทั้งหมดใน `Service_DB.gs`
5. **แก้ VITE_GAS_URL warning**: ไม่เตือนเมื่อรันบน GAS
6. **Frontend deploy @252**: `npm run build:gas` → copy → `clasp push` → `clasp deploy`
7. **Git tag**: `v4.0.2-prod` pushed to origin

## Deployment URL

## Canonical Package Log Terms (2026-07-01)

- `ชื่อผู้รับไปรษณีย์ภัณฑ์`: ชื่อผู้รับที่อ่าน/บันทึกจากหน้าซองหรือหน้าพัสดุ ใช้แทนคำเดิม `ชื่อผู้รับ`
- `ผู้รับตามจ่าหน้า`: ชื่อที่บันทึกตอนยืนยันส่งมอบ/ลงนาม ใช้แทนคำเดิม `ผู้รับจริง`
- `วิธีการส่งมอบ`: ใช้ค่า canonical `ส่งมอบที่หน่วยงาน`
- `ประเภทการใช้`: ใช้ได้เฉพาะ `ส่วนบุคคล` และ `งานมหาวิทยาลัย`; คำเดิม `ส่วนตัว` และ `ธุระส่วนตัว (ส่วนบุคคล)` อ่านได้เฉพาะเพื่อรองรับข้อมูลเก่า
- `ประเภท`: ใช้ได้เฉพาะ `ไปรษณีย์ธรรมดา`, `ไปรษณีย์ด่วนพิเศษ (EMS)`, `ไปรษณีย์ลงทะเบียน`; ค่า legacy เช่น `EMS` และ `ไปรษณีย์ภัณฑ์ธรรมดา` ต้อง normalize ก่อน full rollout
- `จนท.ผู้นำจ่าย`, `ผู้บันทึก`, `ผู้อัปเดตล่าสุด`: ต้องแสดงชื่อบุคลากร ไม่ใช่อีเมล
- `ลายเซ็น`: เมื่อระบบรับ data URL หรือ URL จะบันทึกเป็นสูตร `IMAGE()` เพื่อให้ชีทแสดงรูป ไม่ใช่ลิงก์เปล่า

ต้องรันซ่อมหัวตาราง/อัปเดต schema ในชีทจริงก่อน full rollout เพื่อให้หัวคอลัมน์ใหม่ตรงกับ runtime schema. ใช้ `repairHeadersWrapper` เป็น migration หลัก เพราะจะซ่อมหัวตาราง, แปลงอีเมลเจ้าหน้าที่เป็นชื่อ, normalize ค่า legacy, และแปลงลายเซ็น URL/data URL เป็น `IMAGE()` ในครั้งเดียว. หากต้องการ migrate ค่า legacy อย่างเดียวให้รัน `normalizePackageLogLegacyValues`.

```
https://script.google.com/macros/s/AKfycbzT5Fs7W2RCyhfL6IXIBlEGRIeKXzD6Z32du21gPB8PqPpk65NLPHr8NE_n6qFLf5EJSg/exec
```

## สถานะไฟล์

- แก้ไขแล้ว: `backend/Service_Auth.gs`, `backend/Service_DB.gs`, `frontend/src/api/client.ts`
- ลบแล้ว: `epostal-mcp-key.json/`
- Git: clean, tag `v4.0.2-prod`

## เอกสารที่เกี่ยวข้อง

- `PRODUCTION_LIVE_TEST_REPORT_2026-06-30.md` — ผลทดสอบระบบจริง
- `QUALITY_GATES.md` — Quality gate checklist
- `DECISION_LOG.md` — บันทึกการตัดสินใจ
