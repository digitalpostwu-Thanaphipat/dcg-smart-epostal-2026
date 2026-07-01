# รายงานความพร้อมโปรเจกต์ ePostal

วันที่ตรวจ: 1 กรกฎาคม 2026  
สถานะรวม: **Pilot Production (Limited)** — พร้อมใช้งานจริงแบบจำกัดวง/ทีมจริงแบบเฝ้าดู

## สรุปสั้น

ระบบผ่านการทดสอบหลักทั้งหมด (Unit tests 22/22, Playwright E2E 11/11, Build สำเร็จ) และ deployment @248 ใช้งานได้จริง (login, admin, read, search) แต่ยังมีจุดที่ต้องแก้ก่อนประกาศใช้งานเต็มระบบ ได้แก่: ยังไม่ได้ทำ full write test, เอกสารสถานะขัดกัน

## ผลทดสอบล่าสุด

| รายการตรวจ | ผลลัพธ์ | รายละเอียด |
| --- | --- | --- |
| `npm run test:unit` | PASS 22/22 | Vitest unit tests ผ่านทั้งหมด |
| `npx playwright test` | PASS 11/11 | Playwright E2E ผ่านทั้งหมด |
| `npm run build --prefix frontend` | PASS | TypeScript check + Vite build สำเร็จ |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities (แก้ไขแล้ว 12 → 0) |
| Live deployment @248 | PASS | ใช้งานจริงได้ |
| OTP login | PASS | ยืนยัน OTP สำเร็จ |
| Admin permission | PASS | `digitalpost.wu@gmail.com` ได้สิทธิ์ Admin |
| Read/Search | PASS | อ่านข้อมูล 15 users, 62 departments, 17 packages |
| Service Account key cleanup | PASS | ลบ `epostal-mcp-key.json/` แล้ว |
| Mock-token bypass removal | PASS | ลบ dev-mode bypass แล้ว |
| Hardcoded Sheet IDs removal | PASS | ย้ายไป Script Properties ทั้งหมด |
| VITE_GAS_URL warning fix | PASS | แก้ไขแล้ว ไม่เตือนเมื่อรันบน GAS |

## สิ่งที่แก้ไขล่าสุด (1 กรกฎาคม 2026)

1. **npm audit fix**: แก้ไข vulnerabilities ทั้งหมด 12 รายการ (1 critical, 5 high) เหลือ 0
2. **ลบ Service Account key**: ลบ `epostal-mcp-key.json/` ที่มี private key บน disk
3. **ลบ mock-token bypass**: ลบ dev-mode bypass ใน `Service_Auth.gs` ที่อาจเป็นช่องโหว่
4. **ลบ hardcoded Sheet IDs**: ย้ายไป Script Properties ทั้งหมดใน `Service_DB.gs`
5. **แก้ VITE_GAS_URL warning**: ไม่เตือนเมื่อรันบน GAS (ใช้ `google.script.run` แทน)
6. **อัปเดตเอกสาร**: แก้ PRODUCTION_READINESS_REPORT ให้ตรงกับสถานะจริง

## จุดที่ยังต้องทำก่อน Full Rollout

| # | รายการ | ความรุนแรง |
|---|--------|-----------|
| 1 | Full write test: เพิ่มพัสดุ + เปลี่ยนสถานะ + verify ใน Sheets จริง | CRITICAL |
| 2 | แก้ SW MIME type issue (ถ้ายังมีปัญหา) | HIGH |
| 3 | Commit + push ไฟล์ที่ค้าง | HIGH |

## สถานะไฟล์

- แก้ไขแล้ว: `backend/Service_Auth.gs`, `backend/Service_DB.gs`, `frontend/src/api/client.ts`
- ลบแล้ว: `epostal-mcp-key.json/`

## เอกสารที่เกี่ยวข้อง

- `PRODUCTION_LIVE_TEST_REPORT_2026-06-30.md` — ผลทดสอบระบบจริง
- `QUALITY_GATES.md` — Quality gate checklist
- `DECISION_LOG.md` — บันทึกการตัดสินใจ
