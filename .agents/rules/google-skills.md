# Rule: Google Workspace Integration Standards

## 🌐 Objectives (วัตถุประสงค์)
กำหนดมาตรฐานการเรียกใช้งาน Google Sheets API และ Google Drive API ผ่าน Google Apps Script (GAS) เพื่อความปลอดภัย ความน่าเชื่อถือ (Reliability) และความเป็นระเบียบเรียบร้อยของระบบฐานข้อมูล

## 📊 1. Google Sheets API & DB Patterns (การจัดการฐานข้อมูล)
*   **Atomic Batch Operations:** การเขียนข้อมูลเพิ่มแถว (Write/Insert) ต้องดำเนินการผ่าน `Service_Batch.insertRows` เพื่อรักษาความถูกต้องของข้อมูล (Atomic Write) และความสมบูรณ์ของชีท (Sheet Integrity)
*   **Concurrency Locking:** ในฟังก์ชันหลังบ้านใดๆ ที่มีการเขียนลงตาราง ต้องใช้ `LockService.getScriptLock()` พร้อมตั้งเวลาคอยสูงสุด 30 วินาที (`lock.waitLock(30000)`) เพื่อหลีกเลี่ยงสภาวะ Race Condition (เขียนทับซ้อนกันจาก Client หลายคน)
*   **Dynamic Column Mapping:** ห้ามดึงข้อมูลโดยระบุ Index ตายตัว (เช่น `row[4]`) ให้ค้นหา Index ด้วยชื่อคอลัมน์ภาษาไทยจากชีททุกครั้งโดยใช้ `getHeaderIndex(headers, key)` ใน `Service_DB.gs`
*   **Decoupled Secret Configurations:** ข้อมูลที่เป็นความลับ เช่น `CENTRAL_DB_ID` หรือ Token พิเศษใดๆ ห้ามฮาร์ดโค้ดลงในสคริปต์ ให้เรียกใช้ผ่าน `PropertiesService.getScriptProperties().getProperty(key)` เสมอ

## 📁 2. Google Drive Image & File Storage (การจัดการพื้นที่จัดเก็บไฟล์)
*   **Structured Folder Management:** รูปภาพหลักฐาน (เช่น รูปภาพหลักฐานการเดินเอกสาร Smart Drop หรือลายเซ็นพัสดุ) ต้องถูกแยกเก็บในโฟลเดอร์เฉพาะบน Google Drive
*   **Folder Persistence:** ทุกครั้งที่จะบันทึกภาพ ให้เรียกเช็คการมีอยู่ของโฟลเดอร์ก่อนเสมอด้วยฟังก์ชันค้นหาชื่อโฟลเดอร์ (เช่น `DriveApp.getFoldersByName(FOLDER_NAME)`) หากไม่พบให้ทำการสร้างโฟลเดอร์ใหม่โดยอัตโนมัติ
*   **Sharing and Permissions:** ลิงก์รูปภาพที่บันทึกกลับลงตารางชีท ต้องเปิดสิทธิ์เป็น Public Read หรือ Shared Link เฉพาะผู้ใช้ในองค์กร เพื่อให้ฝั่ง React Frontend สามารถโหลดรูปภาพมาแสดงผลในคอมโพเนนต์ `<img />` ได้โดยตรง

---
*Reference: Derived from Google Workspace Agent Skills (gws-sheets, gws-drive-upload)*
