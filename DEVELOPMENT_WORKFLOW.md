# Development Workflow: ePostal Control System

> **Status:** Active
> **Lead Agent:** @loki-mode
> **Philosophy:** Clean, Maintainable, Production-Grade, Immutable.

---

## 1. Core Workflow Cycle (Spec-First)

ทุก Task ต้องผ่านกระบวนการดังนี้:

### Phase 0: Discovery & Design
- **Tool:** `@brainstorming`
- **Action:** ออกแบบสถาปัตยกรรมและพฤติกรรมก่อนเขียนโค้ด
- **Output:** บันทึกลง `DECISION_LOG.md` และสร้าง Understanding Lock

### Phase 1: Specification
- **Action:** สร้าง Spec (เช่น OpenAPI YAML หรือ React Component Interface)
- **Rule:** ห้ามเขียนโค้ดจนกว่า Spec จะได้รับการยืนยัน

### Phase 2: Test-Driven Development (TDD)
- **Tool:** `@testing-qa` / `@unit-testing-test-generate`
- **Action:** เขียน failing tests ตาม Spec ที่กำหนดไว้

### Phase 3: Implementation (RARV Cycle)
- **Tool:** `@loki-mode`
- **Cycle:**
  1. **Reason:** วิเคราะห์สิ่งที่ต้องทำ
  2. **Act:** เขียนโค้ดเพื่อให้ Test ผ่าน
  3. **Reflect:** ตรวจสอบความถูกต้องและสไตล์
  4. **Verify:** รัน Test และตรวจสอบผลลัพธ์

---

## 2. Quality Gates (Pre-Merge)

ก่อนที่จะ Merge หรือถือว่า Task เสร็จสิ้น ต้องผ่านการตรวจสอบใน `QUALITY_GATES.md`:
1. **Clean Code Check:** `@code-review-excellence`
2. **Production Audit:** `@vibe-code-auditor`
3. **E2E & Performance:** `@e2e-testing` + `@web-performance-optimization`
4. **Security Check:** `@security-auditor`

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
