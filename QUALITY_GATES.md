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

## 5. Accepted Risks

### xlsx (SheetJS) - Accepted Risk

- **Package:** `xlsx` v0.18.5
- **Vulnerabilities:** Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS (GHSA-5pgg-2g8v-p4x9)
- **Severity:** High
- **Fix available:** No
- **Decision:** Accept risk + isolate
- **Justification:**
  - Used only for client-side Excel export (dynamic import)
  - Does NOT parse user-uploaded Excel files
  - Already isolated via dynamic import (`await import('xlsx')`)
  - Attack surface is minimal (output only, no untrusted input)

#### Conditions for Acceptance

1. **DO NOT** use xlsx to parse/import Excel files from users without security review
2. **Keep** dynamic import to minimize bundle exposure
3. **If future Excel import is needed:** Replace library or implement sandbox/validation

#### Monitoring

- Re-evaluate when xlsx releases a fix
- Check npm advisories quarterly

---

## 6. Deploy Checklist (Backend: GAS)
- [ ] **Copy dist:** `Copy-Item frontend\dist\index.html backend\index.html -Force`
- [ ] **Push source:** `clasp push` — อัปเดต HEAD code
- [ ] **Create deployment:** `clasp deploy -d "Description (YYYY-MM-DD)"` — สร้าง Live version ใหม่
- [ ] **Update Proxy:** อัปเดต Deployment ID ใน `vite.config.ts` (บรรทัด 70) ให้ตรงกับ @version ใหม่
- [ ] **Verify URL:** ทดสอบ localhost + Production URL ว่าไม่ได้ 404
- [ ] **Deployment Cleanup:** ถ้ามี 20 deployments แล้ว ต้อง `clasp undeploy <OLD_ID>` ก่อน

> ⚠️ `clasp push` เพียงอย่างเดียว **ไม่ทำให้การเปลี่ยนแปลงมีผลบน Published URL** — ต้อง `clasp deploy` เสมอ
> ⚠️ **ห้ามลืมอัปเดต proxy URL!** — ถ้าลบ deployment เก่าแล้วไม่อัปเดต proxy จะได้ 404 ทั้ง localhost

---

## 7. Skills Reference

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

## 8. Live Production Check - 2026-07-02

- [x] Unit test: `npm run test:unit` ผ่าน 22/22
- [x] Frontend build: `npm run build:gas --prefix frontend` ผ่าน (2081 modules)
- [x] Backend deploy: `clasp push` + `clasp deploy` สำเร็จ
- [x] Production version: `@274`
- [x] Sentry Error Monitoring: DSN ใส่แล้ว (Project: `dcg-smart-epostal-2026`)
- [x] Health Check: `Service_Health.gs` ตรวจ 7 จุด (integrity, access, config, backup, trigger, monitor, sharding)
- [x] Rate Limiting: `checkRateLimit()` จำกัด 15 req/min สำหรับ public search
- [x] Automated Backup: Time-driven trigger `createDailyBackup` ตั้งแล้ว
- [x] CI/CD Pipeline: `.github/workflows/deploy.yml` พร้อมใช้งาน
- [x] SystemSettingsPage: 3 การ์ดหลัก + เครื่องมือขั้นสูง (Uptime, Maintenance, Restore, Repair)
- [x] Public tracking: ลิงก์ติดตามพัสดุทำงานปกติ
- [x] Admin OTP login: ยืนยัน OTP ได้สำเร็จ
- [x] Git push: ซิงค์กับ GitHub main branch เรียบร้อย

---

## Final Approval
- [ ] **Lead Agent Sign-off:** `@loki-mode` ตรวจสอบความสอดคล้องกับ Blueprint
- [ ] **Decision Log Update:** บันทึกการเปลี่ยนแปลงและเหตุผลลงใน `DECISION_LOG.md` เรียบร้อยแล้ว

**[ STATUS: LOCKED | IMMUTABLE ]**
*(ติ๊กช่องนี้เมื่อผ่านทุก Gate - ห้ามแก้ไขไฟล์ที่เกี่ยวข้องหลังจากนี้)*
