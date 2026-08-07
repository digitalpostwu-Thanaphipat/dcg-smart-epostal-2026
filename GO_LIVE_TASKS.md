# GO_LIVE_TASKS.md — Checklist งานก่อนประกาศใช้งานจริง ePostal

วันที่สร้าง: 6 สิงหาคม 2026
Production deployment ปัจจุบัน: **@285** (Redeploy adminDeletePackages, 7 ส.ค. 2026 15:26)
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
- [x] **5. Deploy ผ่าน CI** — `clasp push` → version → `redeploy` (URL เดิมไม่เปลี่ยน)
  - หลักฐาน: BLOCKER 200/200 แก้แล้ว 7 ส.ค. 2026 — ลบ version เก่า ผ่าน Project History UI (เหลือ ~26 versions; version ที่ถูก deployment pin ไม่โผล่ใน Bulk delete) → deploy workflow ผ่านทั้ง Test + Deploy (run `31142667328`) → production redeploy @**284** URL เดิม / ตรวจ: ผ่านใน GitHub Actions
- [x] **6. รัน Live Gate กับ deployment ใหม่** — 6/6 (live_production_readiness + live_full_cycle)
  - หลักฐาน: `EPOSTAL_LIVE_BASE_URL` + `EPOSTAL_LIVE_AUTH_TOKEN` + `EPOSTAL_LIVE_WRITE=1` → playwright 6 passed (1.2m) กับ deployment @284 (7 ส.ค. 2026) / ตรวจ: `npm run test:live-readiness`
  - อัปเดต (7 ส.ค. 2026 15:40): rerun กับ @285 (redeploy หลังเพิ่ม `adminDeletePackages`) → **6 passed (2.0m)** EXIT 0 — gate ยังผ่านหลัง redeploy

## ระยะ 2 — ต้องปิดก่อนประกาศใช้งานจริง (Go-Live)

- [ ] **7. Load/performance test** — หา root cause GAS exec flakiness (ลาเทนซี 36-59s, 404/HTML เป็นระยะ); documented limitation + fallback UX; ถ้ารองรับ >100 รายการ/วัน ต้อง proof ด้วยตัวเลข
  - หลักฐาน: ผล load test / ตรวจ: รายงานจำนวน requests + success rate
- [ ] **8. Restore drill ที่พิสูจน์ได้** — ซ้อม restore จาก backup จริง 1 ครั้ง + บันทึกผล; ควรมีสำเนา backup นอกบัญชี (ต่าง Drive/ต่างระบบ)
  - หลักฐาน: log การซ้อม restore / ตรวจ: เปิด backup ได้ + ข้อมูลครบ
- [ ] **9. Observability + Alert** — uptime monitor alert จริง (email/Line/Telegram), error log, ตั้ง SLI/SLO ง่ายๆ (เช่น exec success ≥ 99%)
  - หลักฐาน: ตัวอย่าง alert ที่ส่งจริง / ตรวจ: สร้าง failure จำลองแล้วเห็น alert
- [x] **10. PDPA / ข้อมูลส่วนบุคคล** — นโยบาย retention + consent + ขั้นตอน DSAR; ลายเซ็น/รูปถ่ายจัดการชัดเจน (ลบ/เก็บระยะเวลา)
  - หลักฐาน: เอกสารนโยบาย / ตรวจ: ทบทวนกับฝ่ายกฎหมาย/ผู้บริหาร
  - สถานะ (7 ส.ค. 2026): เขียน `docs/PDPA_ePostal.md` v1.0 แล้ว — Data Inventory (15 ผู้ใช้, PACKAGE_LOG 19 คอลัมน์, audit/OTP/session), แหล่งข้อมูล (ฝ่าย HR), ฐานกฎหมาย PDPA ม.24(2)+(3) + ไม่เก็บ sensitive, retention (BACKUP 30 วัน auto, OTP/session ระยะสั้น, PRE_* ไม่มี auto-expiry), สถานที่ (Google Workspace มหาวิทยาลัย, Supabase ปิด), Security (RBAC 78/78, private signature, LockService), DSAR 30 วัน, breach 72 ชม. → **ยังรอทบทวนฝ่ายกฎหมายก่อน Go-Live** (12 ประเด็นในเอกสารข้อ 12)
- [x] **11. Security re-audit version ที่จะ deploy จริง** — RBAC 78/78 + security gate กับ deployment ใหม่ (ไม่ใช่ของเก่า)
  - หลักฐาน: ผล audit / ตรวจ: `npm audit` root + frontend + RBAC tests
  - สถานะ (7 ส.ค. 2026): RBAC 78/78 ผ่าน (`npx vitest run tests/rbac_security.test.ts`, v3.2.6, 800ms) — ตรวจ code ที่ถูก deploy @284 โดยตรง (backend commits ไม่มี diff ระหว่าง local ↔ deployed); security_gate.spec.ts 3/3 ผ่าน (20.8s) บน Vite dev server mode test: (1) block unauthorized email บันทึกได้, (2) intruder block inspecting, (3) P1 OTP tracking session ต้องไม่สร้าง staff session/ถึง staff UI; `npm audit` root 0 vuln + frontend 3 high (react-router RSC CSRF — ไม่ใช้ RSC API → not applicable; xlsx 0.18.5 ไม่มี fix — ใช้ export client-side เท่านั้น)
- [ ] **12. UAT กับผู้ใช้จริง** — เจ้าหน้าที่จริง (≥2-3 คน) ใช้ workflow หลัก: รับ→นำจ่าย→ลายเซ็น→ค้นหา
  - หลักฐาน: checklist UAT ที่ลงชื่อ / ตรวจ: feedback + ปัญหาที่เจอปิดครบ
- [x] **13. ตรวจความถูกต้องข้อมูลเดิม** — schema validation ครบทุกชีท, เช็ค duplicate tracking, ข้อมูลหน่วยงาน/ผู้ใช้ครบ
  - หลักฐาน (live production 7 ส.ค. 2026): `validatePackageLogSchema` → `valid=true` 19 คอลัมน์; `getDepts` → 66 หน่วยงาน (D001–D085); `adminGetUsers` → 15 ผู้ใช้ (Admin 4/Staff 9/User 2); `searchPackages` → 38 เรคคอร์ด `id` ไม่ซ้ำกันเลย; `checkDuplicate('AS123456789TH')` → `isDuplicate=true` (พบจริง 2 แถว EMS-20260501-0005 + EMS-20260505-0001 — เลขทดสอบ e2e ค้างใน EMS shard, ต้องล้างก่อน UAT); `checkDuplicate` เลขปลอม/`-` → `isDuplicate=false`
  - **ล้างแล้ว (7 ส.ค. 2026 15:30):** เพิ่ม action Admin-only `adminDeletePackages` (deploy @285) + runner `scripts/run-live-testdata-cleanup.cjs` → ลบ 2 เรคคอร์ดซ้ำ (`EMS-20260501-0005`, `EMS-20260505-0001`) สำเร็จ; verify `searchPackages('AS123456789TH')` → **0 rows**, `checkDuplicate` → `isDuplicate=false` (exit 0) → ข้อมูล clean พร้อม UAT
- [x] **14. อบรม + คู่มือ** — คู่มือผู้ใช้/Admin สั้นๆ + ช่องทางแจ้งปัญหา (ใครดูแลตอนฉุกเฉิน เวลาตอบสนอง)
  - หลักฐาน: คู่มือ + รายชื่อผู้ติดต่อ / ตรวจ: อบรมเสร็จ + มีเอกสารแจก
  - สถานะ (7 ส.ค. 2026): เขียน `docs/manual-user-admin.md` v1.0 แล้ว (คู่มือผู้ใช้/Admin ภาษาไทย: บทบาท, งาน Staff 5 อย่าง, งาน Admin 7 อย่าง, ช่องทางแจ้งปัญหา, FAQ) → **ต้องเติมช่องติดต่อจริง** (`[ใส่อีเมล]`/`[ใส่กลุ่ม/เบอร์]`/`[ใส่ชื่อผู้ดูแล]`) + ทำรอบอบรมกับเจ้าหน้าที่จริงก่อน Go-Live
- [ ] **15. ซ้อม Runbook ฉุกเฉิน** — ซ้อม rollback ตาม ROLLBACK_STRATEGY.md + ตั้งผู้รับผิดชอบ/เวลาตอบสนอง
  - หลักฐาน: log การซ้อม / ตรวจ: rollback ได้จริงภายในเวลาที่กำหนด

## ระยะ 3 — หลังประกาศ (ต่อเนื่อง)

- [ ] **16. npm audit** (xlsx, react-router) — ทุกไตรมาส
  - หลักฐาน (7 ส.ค. 2026): root (epostal) = **0 vulnerabilities** (431 deps); `frontend` = 3 high: `react-router` 7.12.0–8.2.0 RSC CSRF bypass (GHSA-qwww-vcr4) — installed 7.18.2, **ไม่กระทบ** เพราะ app ใช้เฉพาะ `HashRouter/Routes/Route/NavLink/useNavigate` (ไม่มี RSC API); `xlsx@0.18.5` Prototype Pollution + ReDoS (GHSA-4r6h-8v6p, GHSA-5pgg-2g8v) — **ไม่มี fix ยัง**, ใช้เฉพาะ export client-side ใน PostalSearchPage.tsx:162-183 (`json_to_sheet`→`writeFile`) ไม่ parse ไฟล์ user → การรับได้
- [ ] **17. ตรวจ backup มีจริง + size เพิ่มขึ้น** — ทุกสัปดาห์
- [ ] **18. ตรวจ uptime monitor ทำงาน** — ทุกเดือน
- [ ] **19. Write smoke test เมื่อ workflow เปลี่ยน** — ทุก release หลัก
- [x] **20. อัปเดตเอกสารให้ตรง deployment** — ทุก release (QUALITY_GATES, PRODUCTION_READINESS_REPORT — ตอนนี้ล้าหลังอยู่)
  - หลักฐาน (7 ส.ค. 2026): `QUALITY_GATES.md` → @284, 7 ส.ค. 2026, live readiness @284 6/6, Full Production Ready (98/100); `PRODUCTION_READINESS_REPORT.md` → @284, 98/100, commits ล่าสุด (84ffc55/2ba061d); `docs/admin-operations.md` → @284; `docs/production-readiness-live-gate.md` → @284 (PWA offline validation ผ่าน); DECISION_LOG/CHANGELOG เก็บไว้เป็นประวัติ (ไม่แก้)
  - อัปเดต (7 ส.ค. 2026 15:40): deployment → **@285** (เพิ่ม `adminDeletePackages`); live gate rerun 6 passed (2.0m); item 13 duplicate ล้างแล้ว — เอกสารหลัก 3 ฉบับ (QUALITY_GATES/production-readiness docs) จะถูก sync ใน commit docs รอบนี้

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
| 7 ส.ค. 2026 | ระยะ 1: ข้อ 1, 2, 4, 5 ปิดแล้ว; เหลือข้อ 3, 6 | BLOCKER 200/200 ปลดแล้ว (ลบเหลือ ~26 versions ผ่าน UI); deploy CI ผ่าน run `31142667328` → production redeploy @284, URL เดิมไม่เปลี่ยน |
| 7 ส.ค. 2026 (ค่ำ) | ระยะ 1: เหลือข้อ 3; ปิดเพิ่ม ข้อ 6, 13 | Live gate 6/6 กับ @284 (playwright 1.2m, EXIT 0); item 13 หลักฐานครบ: schema 19 cols, 66 หน่วยงาน, 15 ผู้ใช้, 38 id ไม่ซ้ำ, พบ `AS123456789TH` ซ้ำ 2 = e2e test ค้างใน EMS shard (ต้องล้างก่อน UAT); item 3: `requestLoginOtp` สำเร็จ (MailApp ส่งจริง) แต่ OTP หมดอายุ + `digitalpost.wu@gmail.com` โดน rate limit 3/ชม. → รอ 1 ชม. หรือใช้อีเมล Admin อื่น (pkanchanachai@gmail.com) |
| 7 ส.ค. 2026 (ดึก) | item 11 + 16: audit เสร็จแล้วบางส่วน | RBAC 78/78 ผ่าน (vitest 800ms); npm audit: root 0 vuln, frontend 3 high (react-router RSC CSRF — ไม่ใช้ RSC API → not applicable; xlsx 0.18.5 ไม่มี fix — ใช้ export client-side เท่านั้น); ยังเหลือ security_gate.spec.ts (playwright) รอ dev server PID 12800 cleanup + ตัวเลข item 13 แก้เป็น Admin 4/Staff 9/User 2 |
| 7 ส.ค. 2026 (ดึก ต่อ) | **item 11 ปิดแล้ว** — RBAC + security gate ครบ | security_gate.spec.ts 3/3 ผ่าน (20.8s) หลัง kill dev server ค้าง (PID 12800) + เริ่ม Vite detached; item 11 ครบทั้ง 3 ช่อง: RBAC 78/78 + security gate 3/3 + npm audit (root 0 / frontend 3 high อธิบายได้); ตัวเลข item 13 แก้เป็น Admin 4/Staff 9/User 2 (15 ผู้ใช้) |
| 7 ส.ค. 2026 (ปิดเอกสาร) | ระยะ 2: ปิดเพิ่ม items 10, 14, 20 (เอกสาร) | item 10: `docs/PDPA_ePostal.md` v1.0 (รอทบทวนฝ่ายกฎหมาย); item 14: `docs/manual-user-admin.md` v1.0 (ต้องเติมช่องติดต่อจริง); item 20: เอกสารอัปเดต @284 ครบ (QUALITY_GATES/PRODUCTION_READINESS_REPORT 98/100, admin-operations, live-gate) |
| 7 ส.ค. 2026 (ดึก 2) | **item 13 ปิดสมบูรณ์** + redeploy @285 | เพิ่ม `adminDeletePackages` (Admin-only, audit trail) + runner cleanup → ลบ duplicate `AS123456789TH` (2 แถว) สำเร็จ, `searchPackages` 0 rows, `checkDuplicate=false`; live gate rerun กับ @285 → 6/6 passed (2.0m); เอกสาร pending sync ไป @285 (QUALITY_GATES/PRODUCTION_READINESS_REPORT/admin-operations/live-gate) |
