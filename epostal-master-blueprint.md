# 🏛️ DCG Smart ePostal — Master Blueprint

**Role:** Senior Systems Architect & Lead Developer
**Project Context:** Enterprise-grade government application (Thai Language — ภาษาไทย 100%)
**Version:** 4.0.2 | **Last Updated:** 5 พฤษภาคม 2569 (Hardening Phase)

---

## 📑 Table of Contents

- Section 0: Governance & Advisory
- Section 1: Technical Stack
- Section 2: UI & Design Standards (Luxury Intelligence)
- Section 3-3.6: Naming, Data Integrity, Date Standards
- Section 4: Security & Middleware
- Section 5-8: Checklists, Error Handling, Testing
- **Section 9: Module Registry (Extended)** ⭐
- Section 10-14: Definition of Done, Database Schema, Routing, Skills, Clean Code
- **Section 15: Module Workflows** ⭐
- **Section 16: API Contracts** ⭐
- **Section 17: Known Issues Registry** ⭐
- **Section 18: Backend Dependency Graph** ⭐

---

## ⚖️ SECTION 0: GOVERNANCE & ADVISORY (กฎการตัดสินใจ)

1. **DEFAULT CONSISTENCY:** โดยปกติให้ยึดถือโครงสร้างและมาตรฐานในไฟล์นี้เป็นหลัก (Priority 1) เพื่อความสม่ำเสมอของโปรเจกต์
2. **CONSULTATIVE EXCEPTION (ข้อยกเว้นเพื่อการพัฒนา):**
   - หาก AI พบว่ามาตรฐานในไฟล์นี้ "ล้าสมัย", "มีช่องโหว่", หรือ "มีวิธีที่ดีกว่ามาก (Best Practice)" จากความรู้ภายนอก **ห้ามทำเงียบ!**
   - **Action:** ให้หยุดและเสนอ **"Architectural Proposal"** ทันที โดยเปรียบเทียบข้อดี/ข้อเสีย (Pros/Cons) ระหว่างแบบเดิมกับแบบใหม่
   - รอให้ User อนุมัติ (Approve) ก่อน จึงจะเริ่มใช้มาตรฐานใหม่ได้
3. **APP NAME:** ชื่อแอปที่ถูกต้องคือ **DCG Smart ePostal** (สะกดตามนี้เท่านั้น — ห้ามเปลี่ยน)
4. **LANGUAGE:** UI ต้องเป็น **ภาษาไทย 100%** — ห้ามมีข้อความภาษาอังกฤษปรากฏใน UI ที่ผู้ใช้เห็น (ยกเว้น Technical Terms เช่น Email, ID)

---

## 🏗️ SECTION 1: TECHNICAL STACK

- **Frontend:** React (Vite) + Tailwind CSS v4 + Lucide Icons
- **State Management:** `Zustand` (src/store/use `<Domain>`Store.ts) — แยก Store ต่อ Domain (ห้ามใช้ Context API เปล่าๆ)
- **Backend:** Google Apps Script (GAS)
- **Database:** Google Sheets (Fiscal Year Sharding — ดู Section 12.1) ✅ **ดำเนินการแล้ว**
- **Middleware:** (Pipeline: Auth -> RateLimit -> RBAC)
- **Intelligence:** (KPI/MIS Logic)
- **AI Engine:** Google Gemini API (Model: `gemini-flash-latest`) via `Service_AI.gs` (ห้ามใช้ Lib ภายนอก)
- **Theme System:** `useThemeStore` (Zustand) — รองรับ 3 ค่า: `light` | `dark` | `system` ✅ **ดำเนินการแล้ว**
- **Config Management:** `ScriptProperties` สำหรับ Secrets (เช่น `CENTRAL_DB_ID`) ✅ **ดำเนินการแล้ว**

---

## 🎨 SECTION 2: UI & DESIGN STANDARDS (Luxury Intelligence)

> **[อัปเดต T-011]** Design Direction เปลี่ยนจาก "Nexus Soft" เป็น **"Luxury Intelligence"** — ผสมระหว่าง Luxury Minimal + Industrial Utilitarian ✅

- **Aesthetic:** "Luxury Intelligence" — หรูหรา ทันสมัย เป็นมืออาชีพ
  - **Light Mode:** พื้นขาวนวล (Zinc-50) + Emerald Accent + Soft Shadows
  - **Dark Mode:** พื้นเทาเข้ม (Zinc-950) + Emerald Accent + Subtle Borders
  - **Glassmorphism:** `backdrop-filter: blur` สำหรับ Sidebar, Cards, Topbar
- **Typography (Strict):** ✅ **ตรวจสอบแล้ว — สม่ำเสมอทุกโมดูล**
  - **Headers:** `fontFamily: 'Prompt'` → ใช้ CSS class `.font-heading` (ห้ามใช้ inline style)
  - **Body/Content:** `fontFamily: 'Sarabun'` → ใช้ CSS class `.font-body`
  - **Label Pattern:** `text-[10px] font-black uppercase tracking-widest` — ใช้ตรงกันทุกที่
- **Palette (Zinc + Emerald + Indigo):** ✅ **ตรวจสอบแล้ว**
  - **Primary:** Emerald (#047857 / #10b981) — สีหลักสำหรับ CTA, Active states, ปุ่มหลัก
  - **Admin Accent:** Indigo (#6366f1) — สำหรับหน้า Admin/Security เท่านั้น
  - **Background:** Zinc-50 (Light) / Zinc-950 (Dark)
  - **Card:** White (Light) / Zinc-900 (Dark)
  - **Semantic:** Success (Emerald), Warning (Amber), Destructive (Rose), Info (Sky)
- **Icon Library:** Lucide Icons เท่านั้น (ห้ามใช้ Heroicons, FontAwesome, หรืออื่นๆ) ✅
- **Dark/Light Mode:** ✅ **ดำเนินการแล้ว**
  - ใช้ CSS class `.dark` บน `<html>` สำหรับสลับโหมด
  - จัดเก็บ preference ใน `localStorage` ผ่าน `useThemeStore` (Zustand)
  - รองรับ 3 ค่า: `light` | `dark` | `system`
  - **Login Page** ใช้ `useThemeStore` ร่วมกับ Layout (ไม่มี Local State แยก) ✅ **แก้ไขแล้ว T-011**
- **Responsive & PWA:**
  - Mobile-first priority สำหรับทุก Module
  - Sidebar เป็น slide-in drawer บนหน้าจอ < 768px
  - Safe-area padding สำหรับ PWA
  - `manifest.json` + Service Worker สำหรับ Offline Mode
- **Page Headers (Hero Pattern):** ✅ **ตรวจสอบแล้ว — ใช้ตรงกันทุกโมดูล**
  - ทุกหน้าหลักมี `section` พื้นหลัง `Zinc-900` + `rounded-[2.5rem]`
  - มีไอคอนขนาดใหญ่ที่ `opacity-5` วางเยื้องมุมขวา (Ghost Icon)
  - มี Pill Badge บอกชื่อโปรโตคอล/หน้า (ภาษาไทย 100%)
- **Sidebar Branding:** ✅ **อัปเดตแล้ว T-011**
  - ชื่อ: **DCG Smart ePostal** (ไม่ใช่ "ePostal PRO")
  - ไอคอน: `Mail` (ซองจดหมาย) จาก Lucide
  - คำอธิบาย: "ส่วนอำนวยการและสารบรรณ"
  - ปุ่ม Logout: "ออกจากระบบ" (ภาษาไทย)

---

## 🏷️ SECTION 3: NAMING CONVENTIONS

| Category         | Convention                     | Example |
| :--------------- | :----------------------------- | :------ |
| **GAS Services** | PascalCase (prefix:`Service_`) |         |
| **GAS Logic**    | PascalCase (Business Domain)   |         |
| **Helpers**      | PascalCase                     |         |
| **Frontend**     | PascalCase `.tsx`              |         |
| **Store/Hooks**  | camelCase (prefix:`use`) `.ts` |         |

---

## 🔐 SECTION 3.5: DATA INTEGRITY & ID GENERATION

- **Strict ID Generation:** ห้ามเขียน Logic สร้าง ID เอง
- **Atomic Batching:** การเขียนข้อมูล > 1 แถวเสมอ
- **Concurrency:** ระบบใช้ `LockService` ป้องกันการเขียนทับ (Race Condition)

---

## 📅 SECTION 3.6: DATE & TIME STANDARDS

- **Thai Context:** ห้ามใช้ `toLocaleDateString` แบบ Default
- **Helper:** ต้องใช้ หรือ Logic ที่รองรับพุทธศักราช (+543) เสมอเมื่อต้องแสดงผล
- **Storage:** เก็บข้อมูลลง Sheet เป็น Object `new Date()` (เพื่อให้ Sheet จัดการ)
- **Fiscal Year:** ปีงบประมาณ (ต.ค. — ก.ย.) ใช้สำหรับ Sharding ฐานข้อมูล ✅ **ดำเนินการแล้ว T-005**

---

## 🛡️ SECTION 4: SECURITY & MIDDLEWARE

- **Pipeline:** ทุก Request ต้องผ่าน `Code.gs`
- **RBAC:** ตรวจสอบสิทธิ์ผ่าน `ROLE_PERMISSIONS` ใน `Code.gs` เสมอ
  - **Admin:** สิทธิ์เต็ม ทุก action
  - **Postal:** บันทึกรับพัสดุ (`savePackageEntry`) ✅ + นำจ่าย + ค้นหา
  - **Staff:** บันทึกรับพัสดุ (`savePackageEntry`) ✅ + นำจ่าย + ค้นหา *(แก้ไขแล้ว T-012)*
  - **User:** ค้นหา + Feedback เท่านั้น
- **User Identity:** เช็ค `Session.getActiveUser().getEmail()` ทุกครั้ง ห้ามเชื่อ Client 100%
- **Config:** ใช้ `ScriptProperties` สำหรับความลับ (Secrets) เช่น `CENTRAL_DB_ID` ✅ **ดำเนินการแล้ว T-010**
  - เปลี่ยนค่าได้ผ่าน `AdminService.updateCentralDbConfig(id)` โดยไม่ต้องแก้โค้ด
- **Login Response:** ✅ **แก้ไขแล้ว T-009**
  - Backend ส่ง `{ success: true, Email, Role, FullName, Department }` (Flat structure)
  - Frontend รองรับทั้ง Wrapped (`res.data`) และ Flat (`res.Role`) response structures
  - เมื่อ Login ล้มเหลว: `{ success: false, error: "..." }` — แสดง Error เป็นภาษาไทย

---

## 📋 SECTION 5: PRE-TASK CHECKLIST (ตรวจสอบก่อนเริ่มงาน)

- [ ] **PWA Offline?** Component นี้ต้องรองรับ Service Worker caching หรือไม่?
- [ ] **Route Guard?** วาง Route ใหม่ภายใต้ `ProtectedRoute` ใน `App.tsx` หรือยัง?
- [ ] **Mock Data?** เตรียมข้อมูลจำลองใน `client.ts` สำหรับการเทส Local หรือยัง?
- [ ] **Module Check:** ตรวจสอบ Section 9 ว่ามีไฟล์เดิมอยู่แล้วหรือไม่ (ห้ามสร้างซ้ำ)
- [ ] **Thai 100%:** ข้อความทุกจุดที่ผู้ใช้เห็นเป็นภาษาไทยหรือไม่? ✅ **เพิ่มใหม่ T-011**

---

## ✅ SECTION 6: DEVELOPMENT CHECKLIST (มาตรฐานคุณภาพ)

- [ ] **Luxury Intelligence UI:** ใช้ Hero Pattern, Glassmorphism, และฟอนต์ Prompt/Sarabun ถูกต้อง?
- [ ] **API Standard:** Backend ส่งกลับเป็น `{ "success": boolean, "data": ..., "error": ... }`?
- [ ] **Performance:** เรียกใช้ `<GlobalLoader />` เมื่อประมวลผลนานกว่า 200ms?
- [ ] **Validation:** ฟอร์มมีระบบแจ้งเตือน Error เป็นภาษาไทย?
- [ ] **Audit:** การกระทำสำคัญ (Write/Delete) มีการเรียก `logAudit`?
- [ ] **Thai Localization:** Badge, Status, Empty State ทุกจุดเป็นภาษาไทย 100%? ✅ **เพิ่มใหม่ T-011**

---

## 🔄 SECTION 7: ERROR HANDLING & SYNC POLICY

- **Offline First:** เมื่อบันทึกตอน Offline ให้ลง `IndexedDB` และแสดง Toast ว่า "บันทึกในเครื่องแล้ว"
- **Retry Logic:** หาก API ล้มเหลว ต้องมีปุ่ม "ลองใหม่" (Retry) เสมอ
- **Silent Fail Protection:** ห้ามใช้ `catch(e) {}` ว่างเปล่า

---

## 🧪 SECTION 8: TESTING STRATEGY

- **Unit Test:** ใช้ `UnitTests` สำหรับทดสอบ Logic การคำนวณ
- **Simulation Protocol:** ก่อน Deploy Backend ใหม่ **ต้องรัน** `runIntegrationTest()` ใน `IntegrationSimulation.gs` ให้ผ่านทุกข้อ
- **Sanity Check:** ทดสอบหน้าเว็บ Localhost ด้วย Mock Data ก่อน Deploy เสมอ

---

## 🗂️ SECTION 9: MODULE REGISTRY

### 1. Authentication Module ✅ **อัปเดตแล้ว**

| Layer         | File              | Status |
| ------------- | ----------------- | :----: |
| Backend       | Service_Auth.gs   | ✅      |
| Frontend      | Login.tsx         | ✅      |
| Store         | useAuthStore.ts   | ✅      |
| Theme         | useThemeStore.ts  | ✅      |

### 2. Operational Modules

#### 2.1 📦 ePostal (ระบบคัดแยก-นำจ่ายไปรษณีย์ภัณฑ์ภายในองค์กร) ✅

| Layer         | File | Functions                                                                                                                                               |
| ------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend Logic |      | savePackageEntry, updatePackageEntry, confirmDelivery, searchPackages, getPendingDeliveries                                                             |
| Backend Stats |      | getDailyOperationalStats, getFrequentDestinations, saveRun, saveSort, saveExternal                                                                      |
| Frontend      |      | Entry Form, Pending List, Search Page (Intelligence Archive)                                                                                            |
| API Client    |      | postal.saveEntry, postal.getPending, postal.confirm, postal.searchPackages, postal.checkDuplicate, postal.revert, postal.reportIssue |

**Sheet: รายการพัสดุ (18 cols)**

```
0:รหัสพัสดุ, 1:เลขพัสดุ, 2:ประเภท, 3:ชื่อหน่วยงาน, 4:ชื่อผู้รับไปรษณีย์ภัณฑ์, 5:สถานะ,
6:เวลาที่บันทึก, 7:เวลาที่จ่าย, 8:จนท.ผู้นำจ่าย, 9:ผู้รับตามจ่าหน้า, 10:ลายเซ็น,
11:รูปภาพ, 12:พิกัด GPS, 13:วิธีการส่งมอบ, 14:ประเภทการใช้, 15:หมายเหตุ / Line,
16:ผู้บันทึก, 17:ผู้อัปเดตล่าสุด
```

#### 2.2 📝 Feedback (ระบบรับฟีดแบ็ก)

| Layer    | File | Functions              |
| -------- | ---- | ---------------------- |
| Backend  |      | submitFeedback         |
| Frontend |      | FeedbackWidget (Floating) |
| API      |      | feedback.submit        |

#### 2.3 🛡️ Admin (จัดการสิทธิ์ผู้ใช้งาน) ✅

| Layer    | File                     | Functions                                  |
| -------- | ------------------------ | ------------------------------------------ |
| Backend  | AdminService.gs          | adminGetUsers, adminAddUser, adminUpdateUser, adminDeleteUser |
| Frontend | UserManagementPage.tsx   | ตาราง CRUD + Modal ลงทะเบียน/แก้ไขสิทธิ์   |
| API      | admin.*                  | getUsers, addUser, updateUser, deleteUser   |

### 3. Cross-link: Section 13 (Skill Integration)

DCG-Skill Mapping is described in Section 13.1. This section links Module Registry (Section 9) with the Skill Integration guidance to ensure proper skill usage per module.

---

## 🚀 SECTION 10: DEFINITION OF DONE

1. **Consistency:** โค้ดใหม่ไม่ขัดแย้งกับ Module Registry
2. **Security:** ผ่าน Middleware และมีการ Validate Data
3. **User Experience:** ไม่มีจุดที่ User ติดขัด (Dead End) และภาษาไทยถูกต้อง 100%
4. **Self-Audit:** AI สรุปท้ายงานว่า "ผ่าน Checklist ข้อใดบ้างใน Blueprint นี้"
5. **Thai Localization:** ไม่มีข้อความภาษาอังกฤษใน UI ที่ผู้ใช้เห็น ✅ **เพิ่มใหม่ T-011**

---

## 📊 SECTION 11: DATABASE SCHEMA TRUTH (โครงสร้างฐานข้อมูลจริง)

**[CRITICAL]** ห้ามเดาชื่อคอลัมน์ ต้องใช้ Mapping ภาษาไทยตาม Index 0-N ดังนี้:

### 11.1 🌐 DCG_Central_DB (ฐานข้อมูลกลาง) ✅

> **[อัปเดต T-010]** Spreadsheet ID จัดเก็บใน `ScriptProperties` ไม่ Hardcode ในโค้ด
> ดึงค่าผ่าน `_getCentralDbId()` → fallback เป็น Default ID
> เปลี่ยนค่าผ่าน `AdminService.updateCentralDbConfig(id)` โดยไม่ต้องแก้โค้ด

1. **ผู้ใช้งานระบบ:** `[รหัสพนักงาน, อีเมล (Google), ชื่อ-นามสกุล, สิทธิ์, หน่วยงาน/แผนก, ตำแหน่ง]`
2. **รายชื่อพนักงาน:** `[อีเมล, ชื่อ-นามสกุล, รหัสหน่วยงาน, ชื่อสำหรับตรวจสอบ]`
3. **รายชื่อหน่วยงาน:** `[รหัสหน่วยงาน, ชื่อหน่วยงาน, อาคาร, ชั้น, สายส่ง, สังกัดแม่, อีเมลติดต่อ, LINE Token, กลุ่มรายงาน, เจ้าของงบประมาณ]`
4. **รายการบริการ:** `[รหัสบริการ, ชื่อบริการ, รายละเอียด, ค่าบริการ (บาท)]`
5. **ตัวแทนรับพัสดุ:** `[อีเมลตัวแทน, ชื่อตัวแทน, รหัสหน่วยงาน, ตำแหน่ง, เบอร์โทร, รหัส PIN, สถานะ]`
6. **ฐานข้อมูลฟังก์ชันงาน (KPI):** `[รหัสงาน, กลุ่มภารกิจ, ชื่องาน, ผลลัพธ์ที่คาดหวัง, เป้าหมาย]`
7. **ภาระงานมาตรฐาน:** `[เวลา/ความถี่, ผู้บันทึก, หมวดหมู่, รายการงาน, หน่วยนับ, รายละเอียด, รหัสงานอ้างอิง, เวลามาตรฐาน]`

### 11.2 📦 DCG Smart ePostal (ระบบไปรษณีย์ - 18 Cols)

`0:รหัสพัสดุ, 1:เลขพัสดุ, 2:ประเภท, 3:ชื่อหน่วยงาน, 4:ชื่อผู้รับไปรษณีย์ภัณฑ์, 5:สถานะ, 6:เวลาที่บันทึก, 7:เวลาที่จ่าย, 8:จนท.ผู้นำจ่าย, 9:ผู้รับตามจ่าหน้า, 10:ลายเซ็น, 11:รูปภาพ, 12:พิกัด GPS, 13:วิธีการส่งมอบ, 14:ประเภทการใช้, 15:หมายเหตุ / Line, 16:ผู้บันทึก, 17:ผู้อัปเดตล่าสุด`

Canonical values:
- `ประเภท`: `ไปรษณีย์ธรรมดา`, `ไปรษณีย์ด่วนพิเศษ (EMS)`, `ไปรษณีย์ลงทะเบียน`
- `วิธีการส่งมอบ`: `ส่งมอบที่หน่วยงาน`
- `ประเภทการใช้`: `ส่วนบุคคล`, `งานมหาวิทยาลัย`
- `จนท.ผู้นำจ่าย`, `ผู้บันทึก`, `ผู้อัปเดตล่าสุด`: แสดงชื่อบุคลากร ไม่ใช่อีเมล
- `ลายเซ็น`: แสดงรูปในชีทด้วย `IMAGE()` เมื่อมี URL/data URL

Legacy migration:
- `repairHeadersWrapper` ซ่อมหัวตาราง, normalize ค่า legacy, แปลงอีเมลเจ้าหน้าที่เป็นชื่อ, และแปลงลายเซ็นเป็นรูป
- `normalizePackageLogLegacyValues` ใช้เมื่อต้อง normalize เฉพาะค่าเดิม เช่น `EMS`, `ไปรษณีย์ภัณฑ์ธรรมดา`, `นำจ่ายที่หน่วยงาน`, `เซ็นรับที่เคาน์เตอร์`, `ส่วนตัว`

### 11.3 📊 System_Stats (ตารางสรุปสถิติ) ✅ [เพิ่มใหม่]

`0:หมวดหมู่ (ภาพรวม/หน่วยงาน), 1:ทั้งหมด, 2:รอนำจ่าย, 3:จ่ายสำเร็จ, 4:เปอร์เซ็นต์สำเร็จ, 5:อัปเดตล่าสุด`

### 11.5 🛡️ DCG Smart Digital Office (โครงสร้างพื้นฐาน)

- **บันทึกการตรวจสอบ (Audit):** `[เวลา, ผู้กระทำ, การกระทำ, รายละเอียด, IP Address]`
- **บันทึกข้อผิดพลาด (Error):** `[เวลา, ฟังก์ชัน, ข้อความ, รายละเอียดย่อ]`
- System Config: `[Key, Value, Description]` ✅ **Dynamic Schema Enabled**
  - **Key:** `SCHEMA_Package_Log` สำหรับควบคุมลำดับและชื่อคอลัมน์แบบ Dynamic
  - **Self-Healing:** ระบบจะตรวจสอบและซ่อมแซมหัวตารางอัตโนมัติ (Truncate 17+ columns) ทุกครั้งที่มีการเข้าถึงผ่าน `Service_DB.gs`

---

## 🗺️ SECTION 12: DATA ROUTING & INTEGRATION

1. **Routing:** แยก Spreadsheet ID ตามประเภท (Central/ePostal/Drop/Workload/DigitalOffice)
2. **Auto-Log:** เมื่อ Transaction ใน ePostal/Drop สำเร็จ ต้องดีดข้อมูลลง Workload อัตโนมัติ (Rule 9.2)
3. ให้อ่านข้อมูลในโฟลเดอร์ ข้อมูลชืท ที่อยู่ใน root ของโปรเจคอย่างละเอียด

### 12.1 Fiscal Year Sharding ✅ **ดำเนินการแล้ว T-005**

> **Global Dispatcher:** การเข้าถึงฐานข้อมูลทั้งหมดต้องผ่าน `getSheet(name, date)` ใน `Service_DB.gs`
> **Fiscal Year Logic:** ปีงบประมาณไทย (ต.ค. — ก.ย.) + ปีพุทธศักราช
> **Sheet Naming:** `Package_Log_FY{พ.ศ.}` เช่น `Package_Log_FY2569`

---

## 🤖 SECTION 13: SKILL INTEGRATION (เครื่องมือช่วยพัฒนา — v2.4)

### กฎการใช้ Skill:

#### 13.1 DCG-Skill Mapping

- ใช้เพื่อแมปโมดูลกับ Skills ที่จำเป็นสำหรับการพัฒนาในโปรเจคนี้
- สอดคล้องกับ Section 9: Module Registry
- | ตัวอย่างแมป: | Module                                                   | Mandatory Skills                                        | Recommended |
  | ------------ | -------------------------------------------------------- | ------------------------------------------------------- | ----------- |
  | Auth         | loki-mode, api-security-best-practices                   | react-best-practices, zustand-store-ts                  |
  | ePostal      | loki-mode, zustand-store-ts, api-security-best-practices | error-handling-patterns, tailwind-design-system         |
  | Smart Drop   | loki-mode, react-best-practices                          | workflow-patterns, prompt-engineering                   |
  | Workload     | loki-mode, googlesheets-automation                       | docs-architect, clean-code                              |
  | AI           | loki-mode, ai-engineer                                   | prompt-engineering, llm-evaluation                      |
  | Strategy/MIS | loki-mode, analytics-tracking                            | data-engineering, documentation-generation-doc-generate |
  | Feedback     | loki-mode                                                | documentation-templates                                 |
  | **UI Audit** | **frontend-design, ui-ux-designer**                      | **ui-visual-validator** ✅ เพิ่มใหม่ T-011              |

#### 13.2 Usage Guidelines

- บันทึกการอ้างอิง Skill ในโค้ด: // [Skill: skill-name]
- ใช้ Loki-mode (RARV) ในทุก Task

1. **ก่อนเริ่มงานใหม่:** ตรวจสอบ Skill Assignment Table ด้านล่างว่าต้องใช้ Skill ใด
2. **อ่าน SKILL.md** ของ Skill ที่เกี่ยวข้อง (`.agent/skills/skills/<skill-name>/SKILL.md`) ก่อนเขียนโค้ด
3. **บันทึก Reference** ใน Comment ของไฟล์ว่าใช้ Pattern จาก Skill ใด (เช่น `// [Skill: zustand-store-ts]`)
4. **RARV Cycle** จาก `loki-mode` บังคับใช้ทุกขั้นตอน (Reason → Act → Review → Verify)

### Skill ที่บังคับใช้ (Mandatory):

| ลำดับ | Skill                         | ขอบเขต                   | ใช้เมื่อ                                                    |
| :---: | :---------------------------- | :----------------------- | :---------------------------------------------------------- |
|   1   | `loki-mode`                   | ทุกขั้นตอน               | **เสมอ** — RARV Cycle, ONE FEATURE AT A TIME, Quality Gates |
|   2   | `zustand-store-ts`            | State Management (Sec 1) | สร้าง/แก้ไข Store ใดๆ — ต้องใช้`subscribeWithSelector`      |
|   3   | `api-security-best-practices` | Security (Sec 4)         | สร้าง/แก้ไข API endpoint, middleware, input validation      |
|   4   | `error-handling-patterns`     | Error Handling (Sec 7)   | สร้าง Error Boundary, retry logic, graceful degradation     |
|   5   | `react-best-practices`        | Frontend (Sec 1+2)       | สร้าง/แก้ไข React components, hooks, performance            |

### Skill ที่แนะนำ (Recommended):

| ลำดับ | Skill                             | ขอบเขต                | ใช้เมื่อ                                      |
| :---: | :-------------------------------- | :-------------------- | :-------------------------------------------- |
|   6   | `architect-review`                | Governance (Sec 0)    | ทำ Architectural Proposal หรือ Design Review  |
|   7   | `tailwind-design-system`          | UI/UX (Sec 2)         | จัดการ Design Tokens และ Utility Patterns     |
|   8   | `frontend-design`                 | UI Components (Sec 2) | ออกแบบ UI ให้ตรงตาม Luxury Intelligence ✅ อัปเดต |
|   9   | `javascript-testing-patterns`     | Testing (Sec 8)       | เขียน Unit Tests สำหรับ Frontend              |
|  10   | `e2e-testing-patterns`            | Testing (Sec 8)       | วาง E2E Test (Playwright)                     |
|  11   | `clean-code`                      | Code Quality (Sec 9)  | Refactoring, naming, function design          |
|  12   | `auth-implementation-patterns`    | Auth (Sec 4)          | Auth flow, session management                 |
|  13   | `code-refactoring-refactor-clean` | Maintenance           | ลด Tech Debt, restructure code                |
|  14   | `verification-before-completion`  | DoD (Sec 10)          | Enforce Definition of Done checklist          |
|  15   | `multi-agent-brainstorming`       | Architecture (Sec 5)  | วิจารณ์และตรวจสอบข้อจำกัดของสถาปัตยกรรมระบบ       |
|  16   | `impeccable`                      | UI/UX Design (Sec 2)  | ออกแบบและเก็บรายละเอียดความหรูหราของอินเตอร์เฟซ (อ้างอิง `.agents/rules/impeccable.md`) |
|  17   | `google-skills`                   | DB & APIs (Sec 12)    | เชื่อมต่อกับตาราง Google Sheets & Drive (อ้างอิง `.agents/rules/google-skills.md`) |
|  18   | `mattpocock-skills`               | Clean Code (Sec 14)   | การจำกัดความซับซ้อน ป้องกัน AI Over-engineering (อ้างอิง `.agents/rules/mattpocock-skills.md`) |

---

## 📐 SECTION 14: CLEAN CODE STANDARDS (มาตรฐานโค้ดสะอาด — v2.4)

**[Ref]** [freeCodeCamp: How to Write Clean Code](https://www.freecodecamp.org/news/how-to-write-clean-code/)
**[Skill]** `clean-code` + `code-refactoring-refactor-clean`

### 14.1 Meaningful Names (ชื่อที่สื่อความหมาย)

- ใช้ชื่อที่อ่านแล้วเข้าใจทันที: `elapsedTimeInDays` ไม่ใช่ `d`
- Class/Component = Nouns: `PackageCard`, `UserProfile`
- Function/Method = Verbs: `savePackageEntry`, `validateInput`
- ห้ามใช้ชื่อซ้ำซ้อน: `PackageData` vs `PackageInfo` (เลือกหนึ่งเดียว)

### 14.2 Small Functions — SRP (ฟังก์ชันเล็ก ทำงานเดียว)

- ทุกฟังก์ชันควรสั้นกว่า **20 บรรทัด**
- ห้ามผสม Business Logic กับ UI Logic ในฟังก์ชันเดียว
- Arguments: 0 ดีที่สุด, 1-2 รับได้, 3+ ต้องรวมเป็น Object/Interface

### 14.3 Modularization (แยกส่วน)

- 1 Component = 1 File (ห้ามใส่ StatCard ใน DashboardPage)
- แยก Business Logic ออกจาก UI → ใช้ Custom Hooks (`usePackages`, `useWorkload`)
- แยก API calls → `src/api/client.ts`
- แยก Types → `src/types/schema.ts`
- **Utility Functions:** `cn()` and `formatThaiDate()` are centralized in `@/lib/utils.ts`. ✅ **FIXED T-014**

### 14.4 Format & Syntax (รูปแบบโค้ด)

- **Newspaper Metaphor:** High-level ไว้บนสุด, Details ไว้ล่าง
- ห้ามใช้ inline `style={{ }}` — ใช้ Tailwind classes หรือ CSS utility classes
- ใช้ Template Literals แทน String Concatenation
- Import order: (1) React/Libraries → (2) Components → (3) Hooks/Store → (4) Types → (5) Styles

### 14.5 Single Source of Truth — SSOT (แหล่งข้อมูลเดียว)

- Design Tokens → `index.css` `@theme` block เท่านั้น
- Thai Column Names → Blueprint Sec 11 เท่านั้น (ห้ามเดา)
- ID Generation → `Service_Utils.generateNextId` เท่านั้น (Sec 3.5)
- Theme State → `useThemeStore` เท่านั้น ✅ **บังคับใช้แล้ว T-011**
- Central DB ID → `ScriptProperties` เท่านั้น (ห้าม Hardcode) ✅ **บังคับใช้แล้ว T-010**

### 14.6 Error Handling (จัดการข้อผิดพลาด)

- [Skill: `error-handling-patterns`]
- ห้าม `catch(e) {}` ว่างเปล่า (Sec 7)
- ใช้ Error Boundary สำหรับ React (อ้างอิง `ErrorBoundary.tsx`)
- ใช้ `useErrorStore` สำหรับ Global Error Reporting
- Error messages เป็นภาษาไทยเสมอ

### 14.7 Only Expose What You Need (เปิดเผยเฉพาะที่จำเป็น)

- Export เฉพาะ Public API จาก Store/Module
- ห้าม expose internal state ที่ไม่ต้องใช้ข้างนอก
- ใช้ Individual Selectors ใน Zustand: `useStore(s => s.field)` ไม่ใช่ `useStore()`

### 14.8 Documentation & Comments (เอกสารและหมายเหตุ)

- ห้าม Comment โค้ดที่แย่ — เขียนโค้ดให้ดีแทน
- Good Comments: Blueprint Section refs, Skill refs, TODO with ticket, legal
- Bad Comments: commented-out code, redundant descriptions, noise
- ทุกไฟล์ต้องมี Header Comment: purpose, skills used, blueprint sections

### 14.9 Code Smell Detection (ตรวจจับกลิ่นโค้ด)

- **Rigidity:** เปลี่ยนยาก → ต้อง Refactor
- **Fragility:** แก้จุดหนึ่งพังอีกจุด → ต้องแยก Concerns
- **Needless Complexity:** Over-engineering → ทำให้ง่ายที่สุด
- **Needless Repetition:** DRY — Don't Repeat Yourself

---

## 🔄 SECTION 15: MODULE WORKFLOWS

#### 15.1 Auth Module ✅ **อัปเดตแล้ว T-009**

Frontend Flow

```
App -> LoginPage -> submit -> ApiClient.auth.login({ email })
-> response: { success, Email, Role, FullName, Department }
-> useAuthStore.login(userData) -> redirect to Dashboard
```

Backend Flow

```
POST action=handleLogin
- validate payload (email required)
- lookup user in DCG_Central_DB.ผู้ใช้งานระบบ (via ScriptProperties)
- return { success, Email, Role, FullName, Department }
- on fail: { success: false, error: "..." }
```

#### 15.2 ePostal Module

> **[อัปเดต]** โฟลว์การทำงาน (Workflow) ฉบับเต็มและละเอียดที่สุดของระบบ ePostal (ทั้ง Frontend และ Backend) ถูกย้ายไปจัดเก็บอย่างเป็นระเบียบที่ไฟล์ `/.agents/workflows/epostal.md`
>
> _กรุณาอ้างอิงไฟล์ดังกล่าวสำหรับการศึกษาและพัฒนาต่อ_

#### 15.7 Feedback Module

Backend Flow

```
submitFeedback(payload)
- store feedback in sheet/log
- return acknowledgment
```

#### 15.8 Archive Module

Backend Flow

```
runArchive()
- move older sheets to archive
- maintain trigger status
```

---

## 📡 SECTION 16: API CONTRACTS

#### 16.1 Auth APIs ✅ **อัปเดตแล้ว**

```
handleLogin: { email } -> { success, Email, Role, FullName, Department }
           OR on fail -> { success: false, error: "..." }
```

#### 16.2 ePostal APIs

```
savePackageEntry: payload { departmentId, staffEmail, regularQty, emsList } -> { success, data: { count, message } }
updatePackageEntry: payload { packageId, trackingNumber, itemType, departmentName, recipientName } -> { success, message }
getPendingDeliveries: {} -> [ { packageId, trackingNumber, itemType, departmentName, buildingName, recipientName, receivedAt } ]
confirmDelivery: payload { packageIds[], staffEmail, userEmail, receiverName, recipientSignature } -> { success, updated }
searchPackages: payload { query, status, type, department, dateFrom, dateTo, fiscalYear } -> [ { id, packageId, trackingNumber, recipientName, departmentName, buildingName, status, lastUpdated } ]
getDailyOperationalStats: { startDate, endDate, department } -> { total, pending, delivered, successRate, yoy, depts... }
recalculateStatsSnapshot: {} -> { success, stats }
checkDuplicate: { trackingNumber } -> { isDuplicate, detail? }
revertDelivery: { packageId, reason } -> { success, message }
reportDeliveryIssue: { packageId, reason } -> { success, message }
```

#### 16.3 Admin APIs ✅ **เพิ่มใหม่**

```
adminGetUsers: {} -> [ { Email, FullName, Role, Department } ]
adminAddUser: { email, fullName, role, department } -> { success }
adminUpdateUser: { email, newRole, newDepartment } -> { success }
adminDeleteUser: { email } -> { success }
updateCentralDbConfig: { id } -> { success } (via AdminService)
```

#### 16.6 System APIs

```
systemHealthCheck: {} -> { status, checks, version, timestamp }
runArchive: {} -> { success }
getArchiveStatus: {} -> { status }
```

#### 16.7 Feedback APIs

```
submitFeedback: payload { userEmail, category, rating, comment, url?, userAgent? } -> { success, message }
```

#### 16.8 Frontend API Client Reference ✅ **อัปเดตแล้ว**

```ts
// src/api/client.ts
ApiClient = {
  auth: {
    login: (data) => request("handleLogin", data, "POST"),
  },
  admin: {
    getDepartments: () => request("getDepts", null, "POST"),
    getPersonnel: () => request("getPersonnel", null, "POST"),
    getPositions: () => request("getPositions", null, "POST"),
    getRepresentatives: () => request("getRepresentatives", null, "POST"),
    getUsers: () => request("adminGetUsers", null, "POST"),
    addUser: (data) => request("adminAddUser", data, "POST"),
    updateUser: (data) => request("adminUpdateUser", data, "POST"),
    deleteUser: (email) => request("adminDeleteUser", { email }, "POST"),
    createManualBackup: () => request("createManualBackup", null, "POST"),
    restoreFromBackup: (data) => request("restoreFromBackup", data, "POST"),
    runMaintenance: () => request("runMaintenance", null, "POST"),
  },
  postal: {
    saveEntry: (data) => request("savePackageEntry", data, "POST"),
    getPending: () => request("getPendingDeliveries", null, "POST"),
    confirm: (data) => request("confirmDelivery", data, "POST"),
    getStats: () => request("getDailyOperationalStats", null, "POST"),
    searchPackages: (filters) => request("searchPackages", filters, "POST"),
    revert: (data) => request("revertDelivery", data, "POST"),
    reportIssue: (id, reason) => request("reportDeliveryIssue", { packageId: id, reason }, "POST"),
    checkDuplicate: (tn) => request("checkDuplicate", { trackingNumber: tn }, "POST"),
  },
  feedback: {
    submit: (payload) => request("submitFeedback", payload, "POST"),
  },
  health: {
    check: () => request("systemHealthCheck", null, "POST"),
  },
  ai: {
    performOCR: (imageBase64) => request("performOCR", { image: imageBase64 }, "POST"),
  },
  announcements: {
    get: () => request("getAnnouncements", null, "POST"),
  },
};
```

---

## 🐛 SECTION 17: KNOWN ISSUES REGISTRY

#### 17.1 Critical — ✅ แก้ไขทั้งหมดแล้ว

- ✅ [FIXED] C1: PostalPage.tsx เรียก searchPackages แทน saveEntry
- ✅ [FIXED] C2: SHEET_NAMES.EXT — เพิ่ม alias ที่ Service_DB.gs L28
- ✅ [FIXED] C3: Code Smell Detection (addressed via refactoring)
- ✅ [FIXED] C4: Archive — ใช้ SHEET_NAMES constants แทนชื่อ English
- ✅ [FIXED] C5: generateBatchIds() — implement ใน Service_Batch.gs L59
- ✅ [FIXED] C6: Search Page UI mismatch — ปรับเป็น Hero Banner + การ์ดพัสดุมาตรฐาน

#### 17.2 High Priority — ✅ แก้ไขทั้งหมดแล้ว

- ✅ [FIXED] H1: Missing API client methods in frontend
- ✅ [FIXED] H2: ConfirmDelivery UI missing (DeliveryModal + Signature Pad)
- ✅ [FIXED] H3: QR/Barcode scanner not integrated
- ✅ [FIXED] H4: Duplicate entry prevention missing
- ✅ [FIXED] H5: Backup ครอบคลุมทุก 5 Spreadsheets
- ✅ [FIXED] H6: dev@local backdoor — removed
- ✅ [FIXED] H7: DeliveryModal ไม่กรองผู้รับตามหน่วยงาน
- ✅ [FIXED] H8: วันที่แสดงเป็น ISO format
- ✅ [FIXED] H9: คำว่า "พัสดุธรรมดา" เปลี่ยนเป็น "ไปรษณีย์ธรรมดา"
- ✅ [FIXED] H10: PendingList ไม่มี Column Headers + ไม่แยกสี Badge

#### 17.3 Medium Priority

- ✅ [FIXED] M1: formatThaiDateTime duplication in multiple files
- ✅ [FIXED] M2: getJobLogs mapping not 25 columns
- ✅ [FIXED] M3: Signature save error handling — try-catch + fallback
- ⚠️ M4: Direct sheet access vs router pattern → **Partially Fixed** (Service_DB Dispatcher)
- ✅ [FIXED] M5: Service_Workload sheet mismatch — target WORKLOAD consistently
- ✅ [FIXED] M6: Service_Feedback ใช้ Service_Batch.insertRows

#### 17.4 Low Priority / Tech Debt

- ✅ [FIXED] L1: Security hard-coded dev@local pattern
- ⚠️ L2: Many small UX polish items → **Ongoing**
- ✅ [FIXED] L3: TestingFramework class deduplicated
- ✅ [FIXED] L4: Dispatcher.gs.gs deleted
- ✅ [FIXED] L5: Service_CentralSync uses Service_Batch.insertRows
- ✅ [FIXED] L6: `cn()` utility centralized in `@/lib/utils.ts`
- ✅ [FIXED] L7: `animate-slide-up` moved to `index.css`

---

## 📋 SECTION 17.5: SESSION CHANGELOG (บันทึกการเปลี่ยนแปลงตาม Session)

| Session | Task | การเปลี่ยนแปลงหลัก | สถานะ |
| :------ | :--- | :----------------- | :---: |
| T-004   | Backend Hardening | Checkpoint, 16-col validation, backup restore | ✅ |
| T-005   | Fiscal Year Sharding | Global Dispatcher `getSheet()`, FY logic (Oct-Sept) | ✅ |
| T-006   | Login UI Overhaul | Deep Glass Aesthetic, Emerald+Zinc tokens | ✅ |
| T-007   | Login Branding | "DCG Smart ePostal", version 2.0.0, Mail icon | ✅ |
| T-008   | Login Thai L10n | Labels, placeholders, error messages — Thai 100% | ✅ |
| T-009   | Login Auth Fix | Response structure compatibility (Wrapped+Flat) | ✅ |
| T-010   | Config Decoupling | `ScriptProperties` for CENTRAL_DB_ID, `updateCentralDbConfig()` | ✅ |
| T-011   | UI Audit & Fix | Theme unification, Sidebar branding, Thai localization (9 fixes) | ✅ |
| T-012   | Production Hardening | Vite 8 build fix (oxc), RBAC Staff/Postal, SPREADSHEET_ID cache, E2E 7/7 pass | ✅ |
| T-013   | Stats & L10n Hardening | Materialized Dept Stats, Robust Date Parsing, Dept Fallback Fix, Deployed @190 | ✅ |
| T-014   | Tech Debt Cleanup | Centralized `cn()`, `formatThaiDate()`, Fixed L6/L7 | ✅ |
| T-015   | A11y & Backend Schema | WCAG 2.1 AA Contrast, Public tracking ARIA, v4.0.2 18-col repair, 3/3 tests | ✅ |

---

## 🕸️ SECTION 18: BACKEND DEPENDENCY GRAPH & DATA FLOW

**[ภาพรวมสถาปัตยกรรมฝั่ง Backend]**

```text
[Frontend / Client]
       │ (JSON Payload with `action`)
       ▼
 [Code.gs] ─────▶ [Service_Security.gs] (Validates token via Service_Auth.gs)
       │
       ├─▶ action=handleLogin ──▶ [Service_Auth.gs] ──▶ [DCG_Central_DB via ScriptProperties]
       ├─▶ action=getInitialData ─▶ [AdminService.gs] ──▶ [Service_DB.gs]
       ├─▶ action=getStrategicData ▶ [Service_Strategy.gs]
       │
       ├─▶ action=savePackageEntry ▶ [Service_Package.gs] ───┐
       ├─▶ action=createJob ───────▶ [Service_SmartDrop.gs] ─┼─▶ [Service_Workload.gs]
       ├─▶ action=saveRun ─────────▶ [DailyOpsService.gs] ───┘
       │
       │ (All services above rely on...)
       ▼
 [Service_DB.gs] (Sheet Connection & Headers + Fiscal Year Dispatcher ✅)
 [Service_Batch.gs] (Atomic Writes / Row Insertion)
 [Service_Utils.gs] (ID Generation, Thai Dates)
```
