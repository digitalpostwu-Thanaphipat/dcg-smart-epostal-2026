# 🗺️ ePostal Development Roadmap

เอกสารฉบับนี้ใช้สำหรับบันทึกแผนการพัฒนาฟีเจอร์ในอนาคตเพื่อความเสถียรและประสิทธิภาพของระบบ

---

## 🛠️ Phase 1: Stability & Hardening (Current)

### 1.1 `Service_Schema.hardLink()`
**สถานะ:** `[Planned]`
**วัตถุประสงค์:** สร้างการเชื่อมต่อที่ "แข็งแกร่ง" ระหว่างแอปและ Google Sheets ฐานข้อมูล
**ความสามารถ:**
- **Header Protection:** ล็อคแถวที่ 1 (Header) อัตโนมัติป้องกัน Admin/ทมอ. แก้ไขโดยไม่ตั้งใจ
- **Dropdown Injection:** ใส่ Data Validation (Dropdown) ลงในคอลัมน์สำคัญ (Role, ItemType) อัตโนมัติ
- **Access Verification:** ตรวจสอบสิทธิ์การเข้าถึง Service Account ตลอดเวลา

---

## 📈 Phase 2: Analytics & AI Insights

### 2.1 Gemini KPI Dashboard
**สถานะ:** `[Proposed]`
**วัตถุประสงค์:** ใช้ AI สรุปสถิติการรับ-จ่ายพัสดุรายสัปดาห์ในรูปแบบภาษาที่เป็นทางการ

---
**ปรับปรุงล่าสุด:** 2026-05-14
**โดย:** @antigravity
