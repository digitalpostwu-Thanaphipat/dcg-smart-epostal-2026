# 🕹️ ePostal Command Center (Admin Intelligence Hub)

ยินดีต้อนรับสู่ศูนย์ควบคุมอัจฉริยะของ ePostal (คู่มือสำหรับผู้ดูแลระบบ) 
เอกสารนี้คือจุดรวมทักษะเสริม (Skills) ที่คุณ (Admin) สามารถสั่งให้ AI (Gemini/Claude/Cursor) ช่วยดูแล, ซ่อมแซม, หรือขยายระบบได้อย่างปลอดภัย โดยไม่ทำลายมาตรฐานเดิมของโปรเจกต์

---

## 🧭 คำสั่ง AI สำหรับผู้ดูแลระบบ (Admin Commands)
เมื่อคุณต้องการให้ AI ช่วยทำงาน ให้พิมพ์คำสั่งเหล่านี้ลงใน Prompt ของคุณ:

| คำสั่งสั่งการ | ทักษะที่ AI จะดึงมาใช้ | ใช้ในสถานการณ์ไหน? |
| :--- | :--- | :--- |
| **`npm run skill`** | **Core Context Loader** | **[บังคับ]** ต้องรันตอนเริ่มงานทุกครั้ง เพื่อ "เบิกเนตร" AI ให้จำกฎเหล็กได้ |
| **`npm run skill-check`**| **Quality Gate Validator**| **[บังคับ]** ต้องรันก่อนส่งงาน เพื่อตรวจความถูกต้อง (LockService, Schema, ARIA) |
| **`/brain`** | `epostal-brain` | เมื่อคุณเพิ่งมารับงานต่อ และต้องการให้ AI อธิบายโครงสร้างหรือเหตุผลที่โค้ดถูกเขียนขึ้นมาแบบนี้ |
| **`/navigate`** | `epostal-navigator` | เมื่อเกิด "บั๊ก" หรือระบบค้าง ให้ AI ช่วยไล่โค้ดตั้งแต่หน้าเว็บ (React) ไปจนถึงฐานข้อมูล (Sheet) เพื่อหาต้นตอ |
| **`/architect`** | `epostal-gas-architect` | เมื่อคุณต้องการให้ AI "แก้โค้ด Backend" อย่างปลอดภัย ไม่ให้เกิน Quota ของ Google Apps Script |
| **`/design`** | `epostal-design-system` | เมื่อคุณต้องการ "เพิ่มหน้าเว็บใหม่" โดยบังคับให้ AI ใช้สี ฟอนต์ และ UI ให้ตรงกับมาตรฐานเดิมเป๊ะๆ |
| **`/admin-ops`** | `epostal-admin-ops` | เมื่องานประจำวัน เช่น ล้างแคชผู้ใช้, บังคับซ่อมหัวตาราง, หรือ Backup ฐานข้อมูล |
| **`@loki-mode`** | **Efficiency Protocol** | ใช้เมื่อต้องการให้ AI รันงานที่มีความซับซ้อนสูงและต้องการประสิทธิภาพสูงสุด (เช่น Sharding) |
| **`@brainstorm`** | **Review Protocol** | ใช้เมื่อต้องการ "ระดมสมอง" จาก AI หลายตัวเพื่อตรวจสอบ Spec หรือ Schema ก่อนเริ่มงาน |

---

## 🏗️ แดชบอร์ดสถานะระบบ (System Health & Focus Areas)

### 1. 🛡️ ระบบความปลอดภัยและสิทธิ์ (Security & Auth)
- **Focus**: `Code.gs` (`_verifyAccess`), `Login.tsx`
- **Commands**: ใช้ `/navigate` ตรวจสอบสิทธิ์
- **Status**: 🟢 เสถียร (ใช้งาน Token-first RBAC และระบบ Cache 15 นาทีแล้ว)

### 2. ⚡ ฐานข้อมูลและประสิทธิภาพ (Google Sheets DB)
- **Focus**: `Service_DB.gs`, `Service_Package.gs`
- **Commands**: ใช้ `/admin-ops` เพื่อรันการจัดระเบียบตาราง
- **Status**: 🟢 Schema Hardened (16 Cols) + Materialized Stats Active

### 3. 🎨 ส่วนแสดงผลผู้ใช้งาน (Frontend UI)
- **Focus**: `src/components/`, `src/pages/`
- **Commands**: ใช้ `/design` ก่อนสร้างหน้าใหม่เสมอ
- **Status**: 🟢 รองรับ PWA และ Offline Caching

---

## 🧠 กฎเหล็กสำหรับ AI (AI System Prompt)
*เมื่อ User พิมพ์คำสั่ง ให้ AI ปฏิบัติตามนี้อย่างเคร่งครัด:*
1. **ห้ามเดา (No Hallucination):** ถ้าไม่แน่ใจโครงสร้าง ให้เปิดอ่านประวัติระบบผ่าน `/brain` เสมอ
2. **วิเคราะห์ก่อนแก้ (Trace Before Patch):** ก่อนจะแนะนำให้ Admin แก้ไขโค้ด ให้ใช้ `/navigate` อธิบายผลกระทบ (Impact) ที่จะเกิดกับไฟล์อื่นๆ ก่อนเสมอ
3. **รักษากฎแพลตฟอร์ม (Platform Limits):** การเขียนโค้ดฝั่ง Server (GAS) ต้องอิงตามข้อจำกัดของ Google (เช่น ห้ามใช้ท่าที่ใช้เวลาทำงานเกิน 6 นาที, บังคับใช้ `LockService` เสมอเวลาเขียนข้อมูล)

---

## 💾 หน่วยความจำโครงการ (Project Memory & Registry)
เพื่อให้การทำงานต่อเนื่องและไม่ซ้ำซ้อน โปรดตรวจสอบและอัปเดตไฟล์เหล่านี้:

1. **[HANDOFF.md](./memory/HANDOFF.md)**: สรุปงานล่าสุดสำหรับการส่งต่อ (Agent-to-Agent Transfer)
2. **[KNOWN_ISSUES.md](./rules/KNOWN_ISSUES.md)**: ทะเบียนปัญหาทางเทคนิคและข้อจำกัดของระบบที่ต้องระวัง

> "ระบบที่ดี คือระบบที่ดูแลตัวเองได้และส่งต่อได้อย่างยั่งยืน"
