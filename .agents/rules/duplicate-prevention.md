# Rule: Duplicate Prevention Standards

## 🎯 Objective
ป้องกันการนำเข้าข้อมูลพัสดุซ้ำซ้อนในทุกระดับ (UI, Frontend Logic, Backend)

## 🚦 Mandatory Checks
1. **Backend Verification:** ห้ามใช้เพียงข้อมูลใน Batch ปัจจุบันตรวจสอบ ต้องเรียกใช้ `checkDuplicate` ใน `Service_DB.gs` เพื่อตรวจสอบกับฐานข้อมูลจริงเสมอ
2. **UI Feedback:** หากพบข้อมูลซ้ำ ต้องแสดงข้อความเตือนที่ชัดเจนและบล็อกปุ่ม "บันทึก" ทันไป
3. **Tracking ID Integrity:** Tracking ID ทุกตัวต้องถูก Normalize (trim space, upper case) ก่อนตรวจสอบ

---
*Created from Lessons Learned in CONTINUITY.md (2026-03-25)*
