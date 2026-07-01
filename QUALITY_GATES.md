# Quality Gates: ePostal

> Task จะถือว่า **"Complete"** และเข้าสู่สถานะ **"Immutable"** เมื่อผ่านการตรวจสอบทุกข้อดังนี้

---

## 1. Static Analysis & Clean Code
- [ ] **Type Safety:** รัน `tsc` (TypeScript) และห้ามมี Error ในไฟล์ที่เกี่ยวข้อง
- [ ] **Linting:** ผ่านการตรวจสอบโดย Linter มาตรฐานของโปรเจกต์
- [ ] **Review Excellence:** ผ่านการ Review โดย `@code-review-excellence` (เน้น readability และ logic)
- [ ] **Modular Check:** ฟังก์ชันต้องมีขนาดเล็กและแยก Service ชัดเจนตามกฎ Modular Code

## 2. Production Audit (The Vibe Check)
- [ ] **Production-Ready:** ผ่านการ Audit โดย `@vibe-code-auditor`
- [ ] **Best Practices:** ไม่มีการใช้ Hard-coded secrets, ไม่มีการใช้ `any` โดยไม่จำเป็น
- [ ] **Error Handling:** มีการใช้ try-catch ครอบคลุมจุดเสี่ยงและบันทึก Log ลง Service_Utils

## 3. Testing Gates
- [ ] **Unit Tests:** เขียนเทสครอบคลุม Logic หลัก (ผ่าน `@unit-testing-test-generate`)
- [ ] **Test Coverage:** มียอดการทดสอบครอบคลุมโค้ด (Coverage) มากกว่า **80%**
- [ ] **E2E Smoke Test:** ผ่านการทดสอบหน้าจอหลักด้วย `@e2e-testing` (Playwright)

## 4. Security & Performance
- [ ] **Security Audit:** ผ่านการสแกนโดย `@security-auditor` (เน้น OWASP และ RBAC)
- [ ] **Performance:** ไม่มีการทำ N+1 Query ใน Apps Script และโค้ด Frontend ไม่ทำให้เกิด Re-render ที่ไม่จำเป็น

---

## 5. Deploy Checklist (Backend: GAS)
- [ ] **Copy dist:** `Copy-Item frontend\dist\index.html backend\index.html -Force`
- [ ] **Push source:** `clasp push` — อัปเดต HEAD code
- [ ] **Create deployment:** `clasp deploy -d "Description (YYYY-MM-DD)"` — สร้าง Live version ใหม่
- [ ] **Update Proxy:** อัปเดต Deployment ID ใน `vite.config.ts` (บรรทัด 70) ให้ตรงกับ @version ใหม่
- [ ] **Verify URL:** ทดสอบ localhost + Production URL ว่าไม่ได้ 404
- [ ] **Deployment Cleanup:** ถ้ามี 20 deployments แล้ว ต้อง `clasp undeploy <OLD_ID>` ก่อน

> ⚠️ `clasp push` เพียงอย่างเดียว **ไม่ทำให้การเปลี่ยนแปลงมีผลบน Published URL** — ต้อง `clasp deploy` เสมอ
> ⚠️ **ห้ามลืมอัปเดต proxy URL!** — ถ้าลบ deployment เก่าแล้วไม่อัปเดต proxy จะได้ 404 ทั้ง localhost

---

## 6. Skills Reference

| ขั้นตอน | Skill ที่ใช้ | สถานะ |
|---------|------------|------|
| Phase 0 Discovery | `@brainstorming` | ✅ Installed |
| Phase 0 High-Impact | `@multi-agent-brainstorming` | ✅ Installed |
| Phase 2 TDD | `@testing-qa`, `@unit-testing-test-generate` | ✅ Installed |
| Phase 3 RARV | `@loki-mode` | ✅ `.agents/library/loki-mode/` |
| Quality: Clean Code | `@code-review-excellence` | ✅ Installed |
| Quality: Audit | `@vibe-code-auditor` | ✅ Installed |
| Quality: E2E | `@e2e-testing` | ✅ Installed |
| Quality: Performance | `@web-performance-optimization` | ✅ Installed |
| Quality: Security | `@security-auditor` | ✅ Installed |
| Final Approval | `@loki-mode` | ✅ Installed |
| Engineering: Planning | `@grill-with-docs`, `@to-prd` | ✅ Installed |
| Engineering: Execution | `@to-issues`, `@diagnose` | ✅ Installed |
| Engineering: Architecture | `@improve-codebase-architecture` | ✅ Installed |
| Productivity: Strategy | `@grill-me`, `@caveman` | ✅ Installed |

> 💡 Skills ทั้งหมดติดตั้งอยู่ใน `.agents/skills/` — ถ้า Agent รายงานว่า "not found" ให้ตรวจสอบ context budget และรัน session ใหม่

---

## Live Production Check - 2026-06-30

- [x] Unit test: `npm run test:unit` ผ่าน 22/22
- [x] Frontend build: `npm run build --prefix frontend` ผ่าน
- [x] Backend deploy: `clasp push` และ `clasp redeploy` สำเร็จ
- [x] Production version: `@248`
- [x] Public tracking: เปิดลิงก์ `?publicTrack=1` แล้วเข้าหน้าติดตามไปรษณีย์ภัณฑ์ได้
- [x] Admin OTP login: `digitalpost.wu@gmail.com` ยืนยัน OTP ได้สำเร็จ
- [x] Admin permission: ระบบคืนสิทธิ์ `Admin`
- [x] Project users sheet: อ่านผู้ใช้งานได้ 15 คน
- [x] Departments: อ่านหน่วยงานได้ 62 หน่วยงาน
- [x] Package search: ค้นหารายการจริงได้ 17 รายการ
- [ ] Full write test: ยังไม่ได้ทดสอบเพิ่มพัสดุ/เปลี่ยนสถานะบนข้อมูลจริง
- [ ] Warning cleanup: ยังมี warning เรื่อง `VITE_GAS_URL` และ service worker MIME

รายละเอียดเต็มอยู่ใน `PRODUCTION_LIVE_TEST_REPORT_2026-06-30.md`

---

## Final Approval
- [ ] **Lead Agent Sign-off:** `@loki-mode` ตรวจสอบความสอดคล้องกับ Blueprint
- [ ] **Decision Log Update:** บันทึกการเปลี่ยนแปลงและเหตุผลลงใน `DECISION_LOG.md` เรียบร้อยแล้ว

**[ STATUS: LOCKED | IMMUTABLE ]**
*(ติ๊กช่องนี้เมื่อผ่านทุก Gate - ห้ามแก้ไขไฟล์ที่เกี่ยวข้องหลังจากนี้)*
