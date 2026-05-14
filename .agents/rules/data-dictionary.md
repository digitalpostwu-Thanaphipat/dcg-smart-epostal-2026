# 📦 ePostal Data Dictionary (Database Schema)

> **Source of Truth:** v4.1.0
> **Database:** Google Sheets (`ePostal_2026` and Fiscal Year Shards)
> **Schema Strictness:** 18 Fixed Columns. Managed by `Service_Schema.gs`.
> **Write Pattern:** Header-mapped via `buildRow()` + `getHeaderIndex()`

## 📋 Table: Package_Log (รายการพัสดุ)

| Index | Column Name (Thai) | AI Descriptor | Type | Description / Constraints |
|-------|-------------------|---------------|------|---------------------------|
| 0 | รหัสพัสดุ | `packageId` | String | **Primary Key**: `[TYPE]-[YYYYMMDD]-[SEQ]` |
| 1 | เลขพัสดุ | `trackingNo` | String | Tracking Number (or "-" for regular) |
| 2 | ประเภท | `itemType` | Enum | `ไปรษณีย์ด่วนพิเศษ (EMS)`, `ไปรษณีย์ลงทะเบียน`, `ไปรษณีย์ธรรมดา` |
| 3 | ชื่อหน่วยงาน | `deptName` | String | Destination Department (from Central DB) |
| 4 | ชื่อผู้รับ | `recipientName` | String | Intended recipient name on label |
| 5 | สถานะ | `status` | Enum | `รอนำจ่าย` (Pending), `จ่ายสำเร็จ` (Delivered), `จ่ายแล้ว` (Legacy), `มีปัญหา/ตีกลับ` (Issue) |
| 6 | เวลาที่บันทึก | `createdAt` | DateTime | Timestamp of entry (Thai BE format) |
| 7 | เวลาที่จ่าย | `deliveredAt` | DateTime | Timestamp of delivery confirmation |
| 8 | จนท.ผู้นำจ่าย | `delivererName` | String | **FullName** of staff who delivered (resolved from email @216) |
| 9 | ผู้รับจริง | `actualReceiver` | String | Person who signed/received the item |
| 10 | ลายเซ็น | `signatureImg` | Base64 | Signature image reference or URI |
| 11 | รูปภาพ | `photoProof` | URL | Delivery photo proof reference |
| 12 | พิกัด GPS | `gpsLocation` | String | "Latitude, Longitude" |
| 13 | วิธีการส่งมอบ | `deliveryMethod` | String | e.g., "เซ็นรับที่เคาน์เตอร์", "นำจ่ายที่หน่วยงาน" |
| 14 | ประเภทการใช้ | `usageType` | Enum | `ส่วนตัว` (Personal), `งานมหาวิทยาลัย` (Work) |
| 15 | หมายเหตุ / Line | `notes` | String | Additional notes or LINE status |
| 16 | ผู้บันทึก | `recordedBy` | String | **FullName** of staff who initially logged the package (NEW @216) |
| 17 | ผู้อัปเดตล่าสุด | `lastModifiedBy` | String | **FullName** of last person who modified this record |

---

## 📊 Table: System_Stats (สถิติระบบ)

| Index | Column Name (Thai) | AI Descriptor | Description |
|-------|-------------------|---------------|-------------|
| 0 | หมวดหมู่ | `category` | Overview or Dept Name |
| 1 | ตัวชี้วัด | `metric` | Total, Pending, Delivered |
| 2 | ค่าตัวเลข | `value` | Count |
| 3 | อัปเดตล่าสุด | `lastUpdated` | Materialized timestamp |

---

## 👤 Table: ผู้ใช้งานระบบ (DCG_Central_DB)

| Index | Column Name (Thai) | AI Descriptor | Description |
|-------|-------------------|---------------|-------------|
| 0 | รหัสพนักงาน | `empId` | Employee ID |
| 1 | อีเมล (Google) | `email` | Primary Email (Auth Key) |
| 2 | ชื่อ-นามสกุล | `fullName` | Display Name |
| 3 | สิทธิ์ (Admin/User/Postal) | `role` | Role-Based Access Control |
| 4 | หน่วยงาน/แผนก | `dept` | User's Department |
| 5 | ตำแหน่ง | `position` | User's Job Title |

---

## 🎨 Conditional Formatting (สถานะสี)

Managed by `Service_Schema.setupStatusConditionalFormatting()`:

| สถานะ | Background | Font Color | หมายเหตุ |
|-------|-----------|-----------|---------|
| `รอนำจ่าย` | #FEF3C7 (Amber) | #92400E | สถานะเริ่มต้นเมื่อบันทึก |
| `รอจ่าย` | #FEF3C7 (Amber) | #92400E | Legacy status |
| `จ่ายสำเร็จ` | #DCFCE7 (Green) | #166534 | สถานะหลังยืนยันนำจ่าย |
| `จ่ายแล้ว` | #DCFCE7 (Green) | #166534 | Legacy status |
| `ส่งมอบแล้ว` | #DCFCE7 (Green) | #166534 | Legacy status |
| `มีปัญหา/ตีกลับ` | #FEE2E2 (Red) | #991B1B | มีปัญหาในการนำจ่าย |

---

## ⚙️ Special Handling Rules
- **Schema Lock:** The `Package_Log` sheet MUST have exactly 18 columns (enforced by `Service_Schema.gs`).
- **Header-Mapped Writes:** `savePackageEntry` uses `buildRow()` to map data by header name, not column index. Adding/moving columns only requires updating the header string.
- **Thai Header Matching:** AI should use the Thai names for Sheet interactions and the `AI Descriptor` names for JSON/Frontend data.
- **Buddhist Era (BE):** Dates displayed to users should be in BE format (+543 years).
- **Primary Key:** `packageId` must be unique across all shards.
- **Email→Name:** Columns `จนท.ผู้นำจ่าย`, `ผู้บันทึก`, `ผู้อัปเดตล่าสุด` store FullName (resolved via `AdminService.getUsers()` userMap).
- **Auth Sync:** User roles are cached in the frontend but validated against `DCG_Central_DB` on app load.
