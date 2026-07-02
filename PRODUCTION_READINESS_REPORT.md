# รายงานความพร้อมโปรเจกต์ ePostal

วันที่อัปเดต: 1 กรกฎาคม 2026  
Deployment ปัจจุบัน: **@264**  
Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## สถานะสรุป

สถานะปัจจุบัน: **Production Ready for core workflows**

ระบบพร้อมใช้งานจริงสำหรับงานหลัก:

- บันทึกรับไปรษณีย์ภัณฑ์
- ค้นหารายการ
- นำจ่ายและบันทึกลายเซ็น
- ตรวจสอบรายการผ่านลิงก์ติดตามกลาง
- จัดการสิทธิ์ผู้ใช้ตาม role
- สำรองข้อมูลและตรวจสุขภาพระบบ

ยังไม่ควรประกาศว่า **Full Production Ready with PWA support** จนกว่าจะทดสอบติดตั้งบน Android Chrome จริงครบ manifest, service worker, install prompt, และ offline fallback

## Deployment ล่าสุด

| รายการ | สถานะ | รายละเอียด |
| --- | --- | --- |
| Apps Script deployment | PASS | Deployment เดิมถูกอัปเดตเป็น `@264` โดยลิงก์ production ไม่เปลี่ยน |
| Backend push | PASS | `clasp.cmd push` อัปโหลด 25 ไฟล์สำเร็จ |
| Frontend GAS bundle | PASS | `npm.cmd run build:gas --prefix frontend` สร้าง single-file bundle และ copy ไป `backend/index.html` |
| Unit tests | PASS | `npm.cmd run test:unit` ผ่าน 22/22 |
| OCR retirement | PASS | หน้า entry ไม่มีปุ่ม OCR, backend ไม่มี route/RBAC `performOCR`, `Service_AI.gs` ตอบ `OCR_RETIRED` เท่านั้น |
| Delivery performance | DEPLOYED | `confirmDelivery` ลดการเขียน Google Sheets ทีละ cell และใช้ batch write ตามช่วงแถว/คอลัมน์ |

## สิ่งที่เปลี่ยนใน @264

1. ปิด OCR ใน workflow บันทึกรับไปรษณีย์ภัณฑ์ เพื่อลดความเสี่ยงจากการอ่านเลขพัสดุผิด
2. ถอด `performOCR` ออกจาก backend route และ role permissions
3. เปลี่ยน `Service_AI.gs` เป็น compatibility stub ที่ไม่เรียก Gemini หรือ `UrlFetchApp`
4. ลบ client API กลุ่ม `ApiClient.ai` ออกจาก frontend source
5. rebuild `backend/index.html` จาก frontend source ล่าสุด เพื่อให้หน้า production ไม่มี AI/OCR UI ค้าง
6. ปรับ `prepare-gas-build.cjs` ให้ copy `frontend/dist/index.html` ไป `backend/index.html` อัตโนมัติหลัง build
7. เพิ่ม/อัปเดตเอกสาร admin operation และ live readiness gate

## ผลตรวจล่าสุด

| คำสั่ง | ผล |
| --- | --- |
| `npm.cmd run test:unit` | PASS, 22/22 |
| `npm run skill-check` | PASS, แก้ไขผ่านเกณฑ์คุณภาพทั้ง 22 รายการ (GAS Hardening, Column Safety, UI/A11y) ครบถ้วน |
| `npm.cmd run build --prefix frontend` | PASS |
| `npm.cmd run build:gas --prefix frontend` | PASS |
| `clasp.cmd push` ใน `backend/` | PASS |
| `clasp.cmd deploy -i <production-deployment-id>` | PASS, deployed `@264` |

## เกณฑ์ก่อนประกาศเต็มระบบ

ต้องผ่านเพิ่มเติม:

- ทดสอบ mobile/PWA บน Android Chrome จริง
- รัน live readiness gate กับ production URL ล่าสุด
- ทดสอบ write lifecycle หลัง deploy: create package -> search -> confirm delivery -> verify sheet/audit log
- ตรวจ backup ล่าสุดและ trigger รายวันก่อนเปิดใช้งานจริงเต็มรูปแบบ

## เอกสารที่เกี่ยวข้อง

- `docs/admin-operations.md`
- `docs/production-readiness-live-gate.md`
- `docs/release-2026-07-01-264.md`
- `QUALITY_GATES.md`
- `DECISION_LOG.md`
