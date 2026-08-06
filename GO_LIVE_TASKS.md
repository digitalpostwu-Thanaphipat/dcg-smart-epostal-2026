# GO_LIVE_TASKS.md — Checklist งานก่อนประกาศใช้งานจริง ePostal

วันที่สร้าง: 6 สิงหาคม 2026
Production deployment ปัจจุบัน: **@281** (ก่อนเริ่มระยะ 1)
Production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## วิธีใช้

- `[ ]` = ยังไม่ทำ / `[x]` = เสร็จแล้ว
- ช่อง **หลักฐาน** ใส่ลิงก์/ผลลัพธ์ที่ยืนยันได้ (log, report, screenshot)
- ทำระยะ 1 ก่อนเสมอ → แล้วระยะ 2 → ระยะ 3 เป็นรอบต่อเนื่องหลัง Go-Live

---

## ระยะ 1 — BLOCKER (ต้องทำก่อน deploy รอบถัดไป)

- [x] **1. ปิดช่อง `resetOtpRateLimit`** — ตัดออกจาก `PUBLIC_ACTIONS` (Code.gs:92-101); ยังอยู่ใน `ROLE_PERMISSIONS["Admin"]` + ROUTE_MAP → admin-only เท่านั้น
  - หลักฐาน: code review `_verifyAccessV2` (Code.gs:484/662) / ตรวจ: `PUBLIC_ACTIONS` ไม่มี `resetOtpRateLimit`; `_verifyAccess` v1 ไม่ถูกเรียกจาก anywhere
- [x] **2. Review + commit กลุ่มงานค้าง** — backend 3 ไฟล์ (Code.gs, Service_Auth.gs, Service_Package.gs) + frontend/src/api/client.ts + playwright.config.ts + scripts/run-live-readiness.cjs
  - หลักฐาน: commit `2dd0363` (กลุ่มงานค้าง) + `2ba061d` (deploy.yml limit check) / ตรวจ: `git diff` review
- [ ] **3. ทดสอบ OTP email หลังเปลี่ยนเป็น `MailApp`** — login OTP + tracking OTP ส่งอีเมลจริงบน production (ก่อนหน้านี้ใช้ `GmailApp.sendEmail`)
  - หลักฐาน: ผลทดสอบ live / ตรวจ: ลอง login ด้วย OTP จริง
- [x] **4. Unit test + Build ผ่าน** — vitest 123 ผ่าน + playwright e2e ผ่าน (CI สีเขียวทุก run) + `build:gas`
  - หลักฐาน: GitHub Actions "Playwright Tests" / "Deploy to Google Apps Script" job `test` (run 31088571373 ผ่านทุกครั้ง) / ตรวจ: `npm run test:unit` + `npm run build --prefix frontend` + `npm run build:gas --prefix frontend`
- [ ] **5. Deploy ผ่าน CI** — `clasp push` → version → `redeploy` (URL เดิมไม่เปลี่ยน)
  - หลักฐาน: ⛔ **BLOCKER: Apps Script version limit 200/200** — REST API มีแต่ create/get/list ไม่มี delete; ต้องลบผ่าน Project History UI (script.google.com → Project History → Bulk delete versions) แล้ว manual ลบ admin/UI เอง; deploy workflow มี check step แจ้ง error ชัดเจนแล้ว / ตรวจ: redeploy version ใหม่ขึ้น
- [ ] **6. รัน Live Gate กับ deployment ใหม่** — 6/6 (live_production_readiness + live_full_cycle)
  - หลักฐาน: playwright output / ตรวจ: `npm run test:live-readiness`

## ระยะ 2 — ต้องปิดก่อนประกาศใช้งานจริง (Go-Live)

- [ ] **7. Load/performance test** — หา root cause GAS exec flakiness (ลาเทนซี 36-59s, 404/HTML เป็นระยะ); documented limitation + fallback UX; ถ้ารองรับ >100 รายการ/วัน ต้อง proof ด้วยตัวเลข
  - หลักฐาน: ผล load test / ตรวจ: รายงานจำนวน requests + success rate
- [ ] **8. Restore drill ที่พิสูจน์ได้** — ซ้อม restore จาก backup จริง 1 ครั้ง + บันทึกผล; ควรมีสำเนา backup นอกบัญชี (ต่าง Drive/ต่างระบบ)
  - หลักฐาน: log การซ้อม restore / ตรวจ: เปิด backup ได้ + ข้อมูลครบ
- [ ] **9. Observability + Alert** — uptime monitor alert จริง (email/Line/Telegram), error log, ตั้ง SLI/SLO ง่ายๆ (เช่น exec success ≥ 99%)
  - หลักฐาน: ตัวอย่าง alert ที่ส่งจริง / ตรวจ: สร้าง failure จำลองแล้วเห็น alert
- [ ] **10. PDPA / ข้อมูลส่วนบุคคล** — นโยบาย retention + consent + ขั้นตอน DSAR; ลายเซ็น/รูปถ่ายจัดการชัดเจน (ลบ/เก็บระยะเวลา)
  - หลักฐาน: เอกสารนโยบาย / ตรวจ: ทบทวนกับฝ่ายกฎหมาย/ผู้บริหาร
- [ ] **11. Security re-audit version ที่จะ deploy จริง** — RBAC 78/78 + security gate กับ deployment ใหม่ (ไม่ใช่ของเก่า)
  - หลักฐาน: ผล audit / ตรวจ: `npm audit` root + frontend + RBAC tests
- [ ] **12. UAT กับผู้ใช้จริง** — เจ้าหน้าที่จริง (≥2-3 คน) ใช้ workflow หลัก: รับ→นำจ่าย→ลายเซ็น→ค้นหา
  - หลักฐาน: checklist UAT ที่ลงชื่อ / ตรวจ: feedback + ปัญหาที่เจอปิดครบ
- [ ] **13. ตรวจความถูกต้องข้อมูลเดิม** — schema validation ครบทุกชีท, เช็ค duplicate tracking, ข้อมูลหน่วยงาน/ผู้ใช้ครบ
  - หลักฐาน: ผล validate / ตรวจ: `validatePackageLogSchema` + `checkDuplicate` sampling
- [ ] **14. อบรม + คู่มือ** — คู่มือผู้ใช้/Admin สั้นๆ + ช่องทางแจ้งปัญหา (ใครดูแลตอนฉุกเฉิน เวลาตอบสนอง)
  - หลักฐาน: คู่มือ + รายชื่อผู้ติดต่อ / ตรวจ: อบรมเสร็จ + มีเอกสารแจก
- [ ] **15. ซ้อม Runbook ฉุกเฉิน** — ซ้อม rollback ตาม ROLLBACK_STRATEGY.md + ตั้งผู้รับผิดชอบ/เวลาตอบสนอง
  - หลักฐาน: log การซ้อม / ตรวจ: rollback ได้จริงภายในเวลาที่กำหนด

## ระยะ 3 — หลังประกาศ (ต่อเนื่อง)

- [ ] **16. npm audit** (xlsx, react-router) — ทุกไตรมาส
- [ ] **17. ตรวจ backup มีจริง + size เพิ่มขึ้น** — ทุกสัปดาห์
- [ ] **18. ตรวจ uptime monitor ทำงาน** — ทุกเดือน
- [ ] **19. Write smoke test เมื่อ workflow เปลี่ยน** — ทุก release หลัก
- [ ] **20. อัปเดตเอกสารให้ตรง deployment** — ทุก release (QUALITY_GATES, PRODUCTION_READINESS_REPORT — ตอนนี้ล้าหลังอยู่)

---

## เกณฑ์ตัดสิน "ประกาศใช้งานจริง"

- [ ] ระยะ 1 ครบ (deploy ใหม่ + live gate 6/6)
- [ ] ข้อ 7-9 มีหลักฐาน (load test + restore drill + alert ทำงาน)
- [ ] ข้อ 12 UAT ผู้ใช้จริงผ่าน
- [ ] ข้อ 13 ข้อมูลเดิม clean
- [ ] เอกสารตรงความจริง (QUALITY_GATES.md, PRODUCTION_READINESS_REPORT.md)

## สถานะล่าสุด

| วันที่ | สถานะ | หมายเหตุ |
| --- | --- | --- |
| 6 ส.ค. 2026 | ระยะ 1: ข้อ 1, 2, 4 ปิดแล้ว; ข้อ 5 ติด BLOCKER | Production ยังวิ่ง @281; ข้อ 5 ต้องลบ Apps Script version เก่า (200/200) ผ่าน Project History UI ก่อน deploy รอบถัดไป |
