# 🔄 คู่มือการกู้คืนระบบ (Rollback Strategy)
### โปรเจกต์: DCG Smart ePostal Dashboard

ในกรณีที่การ Deploy ครั้งล่าสุดพบปัญหาหลังจากขึ้นระบบจริง (Production) ให้ปฏิบัติตามขั้นตอนดังนี้:

## ⚡ 1. วิธีการกู้คืนไฟล์ UI (Rollback UI)
หากหน้าจอแสดงผลผิดพลาด หรือระบบใช้งานไม่ได้:

1.  **เข้าคลังสำรองข้อมูล:** เปิดโฟลเดอร์ `backups/` ในเครื่องคอมพิวเตอร์ของคุณ
2.  **เลือกไฟล์ล่าสุด:** ค้นหาไฟล์ `index_[timestamp].html` ที่ทำงานได้ปกติก่อนหน้านี้
3.  **กู้คืนเนื้อหา:**
    *   เปิดไฟล์สำรองด้วย Notepad หรือ VS Code
    *   คัดลอก (Copy) โค้ดทั้งหมด
    *   นำไปวางทับในไฟล์ `index.html` บน **Google Apps Script Editor**
    *   กด **Save** และ **Deploy** เวอร์ชันใหม่ทันที

## 🗄️ 2. วิธีการกู้คืนข้อมูล (Rollback Data)
หากพบว่าข้อมูลใน Google Sheets ผิดเพี้ยนจากการทำงานผิดพลาด:

1.  ไปที่ไฟล์ `Service_Backup.gs` ใน Apps Script
2.  เรียกใช้งานฟังก์ชัน `restoreFromBackup(fileId)` โดยระบุ `fileId` ของไฟล์สำรองใน Google Drive (โฟลเดอร์ `ePostal_Backups`)
3.  ระบบจะทำการกู้คืนข้อมูลจาก Snapshot ล่าสุดและรักษาไฟล์คืนค่า (Checkpoint) ไว้อัตโนมัติ

## 🕒 3. การกู้คืนด้วย Google Apps Script Versioning
คุณสามารถใช้ความสามารถของ Google โดยตรงได้เช่นกัน:

1.  ใน Script Editor เลือกเมนู **Project History** (รูปนาฬิกาสามส่วน)
2.  เลือกเวอร์ชันก่อนหน้า (Version) ที่ต้องการ
3.  กด **Restore to this version**

---
> [!CAUTION]
> **ข้อควรระวัง:** การ Rollback ข้อมูล (Database) อาจทำให้ข้อมูลใหม่ที่บันทึกหลังจากจุด Snapshot สูญหาย โปรดตรวจสอบความถูกต้องก่อนดำเนินการ

*เอกสารฉบับนี้จัดทำขึ้นเพื่อความปลอดภัยภายใต้ Loki Hardening Mode*
