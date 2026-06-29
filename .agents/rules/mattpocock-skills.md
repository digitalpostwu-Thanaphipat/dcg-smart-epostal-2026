# Rule: Developer Quality & Modularity Standards

## 🎯 Objectives (วัตถุประสงค์)
กำหนดกฎเกณฑ์สำหรับเอเจนต์เขียนโค้ด (AI Coding Assistant) เพื่อป้องกันปัญหาการ Over-engineering การเขียนคำตอบที่เยิ่นเย้อเกินไป และการสร้างหนี้ทางเทคนิค (Technical Debt / Ball of Mud)

## 🚦 1. AI Behavior & Verbosity Control (การจำกัดพฤติกรรมเอเจนต์)
*   **Concise Communication:** เอเจนต์ต้องอธิบายงานให้กระชับและไม่ตอบอธิบายโค้ดที่ไม่จำเป็น (No code explanations unless asked) ให้เน้นที่ผลลัพธ์และสิ่งที่เปลี่ยนแปลง
*   **Atomic Work Packets:** ห้ามทำการแก้ไขไฟล์หลายๆ ไฟล์หรือหลายจุดพร้อมกันเป็นกลุ่มใหญ่โดยไม่จำเป็น ให้เน้นทำการเปลี่ยนแปลง "ทีละฟีเจอร์ย่อย" และทดสอบให้ผ่านก่อนเริ่มชิ้นถัดไป (Loki Mode standard)
*   **Reason-Act-Review-Verify (RARV):** เอเจนต์ต้องวิเคราะห์เหตุผลและแผนงานก่อนแก้โค้ด และตรวจสอบความถูกต้องหลังแก้เสร็จก่อนส่งมอบงาน

## 📦 2. Code Modularity & Quality Gate Rules (มาตรฐานโครงสร้างโค้ด)
*   **Single Responsibility Principle (SRP):** 1 คอมโพเนนต์ต้องทำหน้าที่เพียงอย่างเดียว ห้ามเอาการ์ดย่อยหลายตัวมาเขียนรวมไว้ในเพจใหญ่ ให้แยกคอมโพเนนต์ย่อยออกเป็นไฟล์เดี่ยว (1 Component = 1 File)
*   **Function Length Restriction:** หลีกเลี่ยงการเขียนฟังก์ชันยาวๆ ในทางทฤษฎีทุกฟังก์ชันควรมีความยาวน้อยกว่า **20 บรรทัด** เพื่อให้อ่านเข้าใจง่ายและทดสอบได้สะดวก
*   **Decoupled Frontend Architecture:**
    *   **UI vs Business Logic:** แยกโค้ด UI (JSX) ออกจาก Logic ดึงข้อมูล โดยใช้ Custom Hooks เสมอ
    *   **State Management:** จัดการ Global State ผ่าน Zustand stores ที่แยกตามหมวดหมู่ (เช่น `useAuthStore.ts`, `useDropStore.ts`) ห้ามใช้ Context API เปล่าๆ ปนเปกัน
    *   **API Client Decoupling:** ทุกการยิง API Call ต้องเรียกผ่าน `src/api/client.ts` เท่านั้น ห้ามเขียน fetch/axios เรียก API ในหน้าคอมโพเนนต์โดยตรง
*   **DRY (Don't Repeat Yourself):** ฟังก์ชันที่เป็น Utility การทำงานซ้ำๆ (เช่น การแปลงเวลาไทย `formatThaiDate`, หรือการต่อ Class `cn`) ต้องถูกเก็บและดึงใช้งานจากโฟลเดอร์ส่วนกลาง (`src/lib/utils.ts` หรือ `src/utils/designUtils.ts`) เท่านั้น

---
*Reference: Inspired by mattpocock/skills and ePostal Clean Code Guidelines (Sec 14)*
