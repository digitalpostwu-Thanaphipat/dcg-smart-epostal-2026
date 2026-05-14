# Development Workflow: ePostal Control System

> **Status:** Active
> **Lead Agent:** @antigravity (Powered by @loki-mode)
> **Philosophy:** Clean, Maintainable, Production-Grade, Immutable.

---

## 1. Daily Protocol: The Closed-Loop Workflow

เพื่อให้มั่นใจว่า AI (Antigravity) ทำงานภายใต้กฎระเบียบและพิมพ์เขียวที่ถูกต้อง 100% ทุกวัน ให้ปฏิบัติตามขั้นตอนนี้:

### 🌅 Start of Day: AI Priming (Input Gate)
ทุกครั้งที่เปิด Workspace หรือเริ่มงานใหม่ในวันนั้น ให้พิมพ์คำสั่ง:
```bash
npm run skill
```
**ทำไมต้องทำ?**
- เพื่อ "เบิกเนตร" AI ให้ดึงข้อมูลจาก `SKILL.md` ล่าสุดเข้าสู่ Context
- ป้องกัน AI เขียนโค้ดแบบ "จิตสัมผัส" (หลงทาง/คิดไปเอง)
- ย้ำเตือน "Golden Rules" (เช่น การใช้ LockService, Schema 16 columns)

### 🛠 During Work: Spec-First Implementation
1. **Plan**: สร้าง `implementation_plan.md` ทุกครั้งก่อนเริ่มงานใหญ่
2. **Implement**: เขียนโค้ดตามแผน โดยยึดหลัก **Modular** และ **Accessible**
3. **Internal Check**: หมั่นรัน `npm run skill-check` ระหว่างทำงานเพื่อดูว่าเราทำผิดกฎเหล็กหรือไม่

### 🌇 End of Day: Quality Validation (Output Gate)
ก่อนจะ Push โค้ด หรือ Deploy ให้รัน:
```bash
npm run skill-check
```
**ทำไมต้องทำ?**
- เป็นระบบ "ผู้ตรวจการ" (Linter) ที่เช็คกฎทางธุรกิจ (Business Rules) ที่ Linter ทั่วไปเช็คไม่ได้
- ตรวจสอบ `LockService`, `Column Indices`, และ `ARIA labels`
- หากไม่ผ่าน (❌ FAILED) **ห้าม Deploy เด็ดขาด**

---

## 2. Core Workflow Cycle (Spec-First)

---

## 2. Quality Gates (Pre-Merge)

ก่อนที่จะ Merge หรือถือว่า Task เสร็จสิ้น ต้องผ่านการตรวจสอบใน `QUALITY_GATES.md`:
1. **Clean Code Check:** `@code-review-excellence`
2. **Production Audit:** `@vibe-code-auditor`
3. **E2E & Performance:** `@e2e-testing` + `@web-performance-optimization`
4. **Security Check:** `@security-auditor`
5. **Efficiency Audit:** `@loki-mode` (Database & Tool Usage Optimization)

---

## 3. Immutable After Pass Rule

**"Once passed, never modified."**

- เมื่อไฟล์หรือโมดูลใดผ่าน Quality Gates และได้รับการประทับตรา "Pass" แล้ว **ห้ามแก้ไขโดยตรงเด็ดขาด**
- หากมีความจำเป็นต้องแก้ไข (เช่น เปลี่ยน Requirement):
  1. ต้องเริ่มกระบวนการตั้งแต่ Phase 0 (Brainstorming) ใหม่
  2. ต้อง Update Spec และ Tests ก่อน
  3. ถือว่าเป็นการสร้างเวอร์ชันใหม่ของโมดูลนั้น

---

## 4. High-Impact Task Escalation

สำหรับงานที่มีผลกระทบสูง (เช่น Database Schema, Auth System):
- ต้องใช้ `@multi-agent-brainstorming` เพื่อทำ Structured Review (3 reviewers) ก่อนเริ่ม Phase 1
- ต้องผ่านการตรวจสอบความเสถียรจาก `@loki-mode` ก่อนทำการ Deploy จริง
