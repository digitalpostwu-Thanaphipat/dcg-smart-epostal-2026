# ePostal Admin Operations

## Current Production

- Deployment: `@264`
- URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`
- Public tracking link: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec?publicTrack=1`

## Current Admin Home

หน้า `ตั้งค่าระบบ` สำหรับงาน production ปกติควรเน้นเฉพาะงานที่ admin ใช้จริงและความเสี่ยงต่ำ:

- `ลิงก์กลางติดตามพัสดุ`: ใช้คัดลอก URL `?publicTrack=1` ไปแปะหน้าเว็บหน่วยงาน
- `สำรองข้อมูลทันที`: ใช้ก่อน deploy, ก่อนแก้ข้อมูลใหญ่, หรือหลังยืนยันข้อมูลสำคัญ
- `ตรวจสุขภาพระบบ`: ใช้ตรวจ DB, config, backup, trigger, monitor, sharding ก่อนประกาศพร้อมใช้งาน

## Advanced / Technical Operations

รายการต่อไปนี้ไม่ควรอยู่หน้าแรกของ admin เพราะใช้ไม่บ่อยหรือมีความเสี่ยง:

- `Maintenance ปีงบ`: ใช้จัดเก็บ/แยกข้อมูลตามปีงบประมาณ ควรใช้ช่วงปิดรอบหรือโดยผู้ดูแลเชิงเทคนิค
- `Restore`: ใช้เฉพาะเหตุฉุกเฉิน เพราะเขียนทับข้อมูลปัจจุบัน ต้องมี backup และ confirm สองชั้น
- `Repair schema / normalize data`: ใช้ตอน rollout, ซ่อมหัวตาราง, หรือปรับข้อมูล legacy เท่านั้น
- `Uptime Monitor`: ไม่ใช่งาน admin ประจำ ควรตั้งโดยผู้ดูแลเชิงเทคนิคหลังตรวจช่องทางแจ้งเตือนจริง

## Retired OCR Flow

ยกเลิก OCR จากหน้า entry แล้ว เพราะพนักงานใช้งานยากและมีความเสี่ยงอ่านเลขพัสดุผิด

- Frontend ไม่แสดงปุ่ม `สแกนหน้าพัสดุ (AI)` แล้ว
- Backend ถอด action `performOCR` ออกจาก RBAC และ route แล้ว
- ยังเก็บไฟล์ `backend/Service_AI.gs` ไว้เพื่อ compatibility แต่ฟังก์ชันตอบ `OCR_RETIRED` เท่านั้น และไม่เรียก Gemini/UrlFetch
- การบันทึกเลขพัสดุให้ใช้การพิมพ์หรือ barcode scanner เท่านั้น

## Production Rule

ก่อน deploy production ให้รัน:

```powershell
npm.cmd run test:unit
npm.cmd run build --prefix frontend
```

หลัง deploy production ให้ตรวจ:

```powershell
npm.cmd run test:live-readiness
```

โดยตั้ง `EPOSTAL_LIVE_BASE_URL` และ token ตาม `docs/production-readiness-live-gate.md`
