# ePostal: Agent Master Instructions

> **Lead Agent:** @loki-mode
> **Last Updated:** 2026-03-30

## 🎯 Current Mission
พัฒนาระบบ Epostal ให้มีความเสถียรระดับ Production โดยใช้ Workflow ที่ควบคุมคุณภาพอย่างเข้มงวด

## 🛠 Project Workflow
คุณ **ต้อง** ปฏิบัติตามขั้นตอนใน [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) ทุกครั้งที่เริ่ม Task ใหม่

## 🚦 Quality Control
ห้ามถือว่างานเสร็จสิ้นหากยังไม่ผ่านเกณฑ์ใน [QUALITY_GATES.md](./QUALITY_GATES.md)

## 🧠 Memory & Decisions
ตรวจสอบการตัดสินใจในอดีตได้ที่ [DECISION_LOG.md](./DECISION_LOG.md)

---

## 📜 Key Rules & Standards
กฎการพัฒนาที่แยกตามส่วนงานจะถูกเก็บไว้ที่ `./.agents/rules/`:
- [Duplicate Prevention](./.agents/rules/duplicate-prevention.md) (In-progress)
- [Design Standards](./.agents/rules/design-standards.md) (In-progress)

## 📦 Package Manager & Deploy Workflow
- **Frontend:** npm (`npm install`, `npm run dev`)
- **Backend:** clasp — **ต้องทำ 3 ขั้นตอนเสมอ:**
  ```powershell
  # 1. Sync frontend build to backend
  Copy-Item frontend\dist\index.html backend\index.html -Force
  # 2. Push source code
  cd backend && clasp push
  # 3. Create new live deployment (⚠️ push alone does NOT update /exec URL)
  clasp deploy -d "Description (YYYY-MM-DD)"
  ```
  > ⚠️ **Critical:** `clasp push` เท่านั้น ≠ Live — Published URL ยังรัน version เก่าจนกว่าจะ `clasp deploy`

---
**Co-Authored-By:** Gemini 1.5 Pro <loki-mode@epostal.ai>
