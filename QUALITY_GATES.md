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
- [ ] **Verify URL:** ตรวจสอบว่า Proxy URL ใน `vite.config.ts` ชี้ไปยัง Deployment ที่ถูกต้อง

> ⚠️ `clasp push` เพียงอย่างเดียว **ไม่ทำให้การเปลี่ยนแปลงมีผลบน Published URL** — ต้อง `clasp deploy` เสมอ

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

> 💡 Skills ทั้งหมดติดตั้งอยู่ใน `.agents/skills/` — ถ้า Agent รายงานว่า "not found" ให้ตรวจสอบ context budget และรัน session ใหม่

---

## Final Approval
- [ ] **Lead Agent Sign-off:** `@loki-mode` ตรวจสอบความสอดคล้องกับ Blueprint
- [ ] **Decision Log Update:** บันทึกการเปลี่ยนแปลงและเหตุผลลงใน `DECISION_LOG.md` เรียบร้อยแล้ว

**[ STATUS: LOCKED | IMMUTABLE ]**
*(ติ๊กช่องนี้เมื่อผ่านทุก Gate - ห้ามแก้ไขไฟล์ที่เกี่ยวข้องหลังจากนี้)*
