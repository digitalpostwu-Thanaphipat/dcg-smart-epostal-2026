---
description: ePostal Workflow — ระบบบันทึกรับ-จ่ายไปรษณีย์ภัณฑ์ (อัปเดต 27 ก.พ. 2569)
---

# ePostal (ระบบบันทึกรับ-จ่ายไปรษณีย์ภัณฑ์)

> **Last Updated:** 30 มิถุนายน 2569
> **Status:** ✅ ใช้งานได้ครบ workflow

## 1. ภาพรวม (Overview)

**ePostal** คือระบบบันทึกรับและจ่ายไปรษณีย์ภัณฑ์ขององค์กร รองรับการรับพัสดุหลายประเภท (ไปรษณีย์ธรรมดา, ไปรษณีย์ลงทะเบียน, EMS) พร้อมทั้งติดตามสถานะและยืนยันการจ่ายด้วยลายเซ็นดิจิทัล

### วัตถุประสงค์

- บันทึกรับไปรษณีย์ภัณฑ์เข้าระบบ (Inbound)
- จัดกลุ่มพัสดุตามอาคารและหน่วยงาน
- ยืนยันการนำจ่ายพร้อมลายเซ็นดิจิทัล
- ค้นหาและติดตามประวัติพัสดุ (ค้นหาชื่อหน่วยงาน / อาคาร / Tracking / ผู้รับ / สถานะ)

### ผู้ใช้งาน

- **เจ้าหน้าที่ (Staff)**: บันทึกรับพัสดุ และนำจ่าย
- **ผู้ใช้ทั่วไป (User)**: ค้นหาประวัติพัสดุของหน่วยงานตน
- **ผู้บริหาร (Admin)**: ค้นหาทุกหน่วยงาน

### ฐานข้อมูล

- **Project Spreadsheet**: `ePostal_2026`
- **Main Sheet**: `รายการพัสดุ` (18 Columns)
- **Representative Sheet**: `ตัวแทนรับไปรษณีย์ภัณฑ์`

---

## 2. ไฟล์ที่เกี่ยวข้อง (Files)

### Backend (Google Apps Script)

| ไฟล์                 | หน้าที่                      | บรรทัด |
| -------------------- | ---------------------------- | ------ |
| `Service_Package.gs` | เซอร์วิสหลัก (รับ-จ่ายพัสดุ) | ~767   |

### Frontend (React + TypeScript)

| ไฟล์                                      | หน้าที่                                     | บรรทัด |
| ----------------------------------------- | ------------------------------------------- | ------ |
| `pages/PostalPage.tsx`                    | Main page (3 tabs)                          | ~76    |
| `components/postal/PostalEntryForm.tsx`   | ฟอร์มบันทึกรับพัสดุ + Duplicate Check UX    | ~356   |
| `components/postal/PostalPendingList.tsx` | รายการพัสดุรอนำจ่าย + grouping อาคาร/หน่วยงาน | ~306   |
| `components/postal/PostalSearchTab.tsx`   | ค้นหาประวัติพัสดุ + filter สถานะ            | ~197   |
| `components/postal/DeliveryModal.tsx`     | Modal ยืนยันนำจ่าย + ลายเซ็น                | ~228   |
| `components/postal/EditPackageModal.tsx`  | Modal แก้ไขพัสดุ                            | ~110   |
| `components/postal/ScannerModal.tsx`      | Modal สแกนบาร์โค้ด                          | ~62    |

### API Client (`client.ts`)

| Method                     | Endpoint               | หน้าที่                  |
| -------------------------- | ---------------------- | ------------------------ |
| `postal.saveEntry`         | `savePackageEntry`     | บันทึกรับพัสดุเข้า       |
| `postal.getPending`        | `getPendingDeliveries` | ดึงรายการพัสดุรอนำจ่าย     |
| `postal.updateEntry`       | `updatePackageEntry`   | แก้ไขข้อมูลพัสดุ         |
| `postal.confirmDelivery`   | `confirmDelivery`      | ยืนยันการนำจ่าย          |
| `postal.searchPackages`    | `searchPackages`       | ค้นหาประวัติพัสดุ        |
| `postal.checkDuplicate`    | `checkDuplicate`       | ตรวจสอบเลข Tracking ซ้ำ  |
| `admin.getRepresentatives` | `getRepresentatives`   | ดึงรายชื่อตัวแทนรับไปรษณีย์ภัณฑ์ |

---

## 3. Database Schema

### Sheet: `รายการพัสดุ` (18 Columns)

| Index | Column | ชื่อฟิลด์       | ประเภท | คำอธิบาย                                               |
| ----- | ------ | --------------- | ------ | ------------------------------------------------------ |
| 0     | A      | `รหัสพัสดุ`     | String | ID อัตโนมัติ รูปแบบ ORD-xxxxxx, EMS-xxxxxx, REG-xxxxxx |
| 1     | B      | `เลขพัสดุ`      | String | Tracking Number (EMS/ลงทะเบียน)                        |
| 2     | C      | `ประเภท`        | String | ไปรษณีย์ธรรมดา, ไปรษณีย์ลงทะเบียน, EMS                 |
| 3     | D      | `ชื่อหน่วยงาน`   | String | ชื่อหน่วยงานปลายทาง (ภาษาไทย)                           |
| 4     | E      | `ชื่อผู้รับ`    | String | ชื่อผู้รับพัสดุ (หน้ากล่อง)                            |
| 5     | F      | `สถานะ`         | String | รอนำจ่าย / ส่งมอบแล้ว / มีปัญหา/ตีกลับ                                      |
| 6     | G      | `เวลาที่บันทึก` | String | วัน-เวลาที่บันทึกรับ (พ.ศ.)                            |
| 7     | H      | `เวลาที่จ่าย`   | String | วัน-เวลาที่ส่งมอบแล้ว                                  |
| 8     | I      | `จนท.ผู้นำจ่าย` | String | ชื่อเจ้าหน้าที่ที่นำจ่าย (resolve จาก staffEmail)      |
| 9     | J      | `ผู้รับจริง`    | String | ชื่อผู้ที่รับพัสดุ (เซ็นรับ)                           |
| 10    | K      | `ลายเซ็น`       | String | URL ลายเซ็นดิจิทัล (Google Drive)                      |
| 11    | L      | `รูปภาพ`        | String | URL รูปภาพ (ถ้ามี)                                     |
| 12    | M      | `พิกัด GPS`     | String | พิกัด GPS (ถ้ามี)                                      |
| 13    | N      | `วิธีการส่งมอบ` | String | Digital Signature                                      |
| 14    | O      | `ประเภทการใช้`  | String | งานมหาวิทยาลัย / ธุระส่วนตัว                           |
| 15    | P      | `หมายเหตุ / Line` | String | หมายเหตุเพิ่มเติม + สถานะ Line                        |
| 16    | Q      | `ผู้บันทึก` | String | ชื่อผู้บันทึกรายการ |
| 17    | R      | `ผู้อัปเดตล่าสุด` | String | ชื่อผู้แก้ไขรายการล่าสุด |

---

## 4. Workflow (วงจรชีวิตพัสดุ)

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│ บันทึกรับ   │ ──▶ │ รอนำจ่าย     │ ──▶ │ ส่งมอบแล้ว │
│ (Inbound)   │     │ (Pending)    │     │ (Delivered)│
└─────────────┘     └──────────────┘     └───────────┘
```

### 4.1 ขั้นตอนการทำงาน

#### ขั้นที่ 1: บันทึกรับไปรษณีย์ภัณฑ์ (Entry)

- **ผู้ใช้**: กรอกฟอร์มใน `PostalEntryForm.tsx`
- **ข้อมูลที่ส่ง**:
  - `departmentId`: หน่วยงานปลายทาง (DeptID) — ค้นหาผ่าน SearchableSelect
  - `regularQty`: จำนวนไปรษณีย์ธรรมดา
  - `emsList`: รายการ EMS/ลงทะเบียน
    - `trackingNumber`: เลขพัสดุ
    - `itemType`: ประเภท (ลงทะเบียน/EMS)
    - `recipientName`: ชื่อผู้รับ (SearchableSelect — รวม Personnel + ตัวแทนรับไปรษณีย์ภัณฑ์)
    - `notes`: หมายเหตุ
  - `staffEmail`: อีเมลเจ้าหน้าที่
- **UI Enhancements**:
  - แสดง 🏢 อาคาร / 📍 ชั้น อัตโนมัติเมื่อเลือกหน่วยงาน
  - รายชื่อผู้รับรวมจาก Personnel + ตัวแทนรับไปรษณีย์ภัณฑ์ (Representatives)
  - ตรวจสอบเลข Tracking ซ้ำอัตโนมัติ
- **Backend** (`savePackageEntry`):
  - สร้าง ID อัตโนมัติผ่าน `generateReadableId()`
  - ตรวจสอบเลขซ้ำผ่าน `checkDuplicate()`
  - บันทึกข้อมูล 18 คอลัมน์
  - **Log Workload**: บันทึกลง `Service_Workload`

#### ขั้นที่ 2: จัดกลุ่มและรอนำจ่าย (Pending)

- **ระบบ**: จัดกลุ่มพัสดุตาม **อาคาร → หน่วยงาน** (2-Level Grouping)
- **UI**: แสดงใน `PostalPendingList.tsx`
  - Column headers: เลข Tracking / ผู้รับ / ประเภท / เวลารับเข้า
  - ประเภท badge สี: ไปรษณีย์ธรรมดา (amber) / ไปรษณีย์ลงทะเบียน/EMS (teal)
  - Checkbox ต่อรายการ + เลือกทั้งหมดในหน่วยงาน
  - Collapse/Expand แต่ละหน่วยงาน
  - Loading spinner ขณะโหลด

#### ขั้นที่ 3: นำจ่ายพัสดุ (Delivery)

- **เจ้าหน้าที่**: เลือกพัสดุ → กด "ยืนยันนำจ่าย" → เปิด `DeliveryModal`
- **UI Enhancements**:
  - แสดง banner ชื่อหน่วยงานที่นำจ่าย
  - รายชื่อผู้รับกรองตามหน่วยงาน (ใช้ DeptID→DeptName map)
  - รวม Personnel + ตัวแทนรับไปรษณีย์ภัณฑ์
  - Fallback แสดงทั้งหมดถ้าไม่เจอบุคลากร + warning
- **ข้อมูลที่ส่ง**:
  - `packageIds`: รหัสพัสดุที่เลือก
  - `receiverName`: ชื่อผู้รับจริง
  - `recipientSignature`: ลายเซ็นดิจิทัล (Base64)
  - `staffEmail`: อีเมลเจ้าหน้าที่นำจ่าย (จาก Auth Store)
  - `userEmail`: อีเมลผู้ใช้ (จาก Auth Store)
- **Backend** (`confirmDelivery`):
  - อัปเดต สถานะ → "ส่งมอบแล้ว"
  - บันทึก เวลาที่จ่าย (Thai datetime)
  - บันทึก จนท.ผู้นำจ่าย (resolve ชื่อจาก staffEmail ผ่าน Users DB)
  - บันทึก ผู้รับจริง
  - **บันทึกลายเซ็น**: อัปโหลดผ่าน Google Drive `_saveSignatureToDrive()`
  - **Log Workload**: บันทึกงานนำจ่าย

#### ขั้นที่ 4: ค้นหาประวัติ (Search)

- **ทุกผู้ใช้**: ค้นหาด้วย `PostalSearchTab.tsx`
- **ค้นหาได้ 5 ฟิลด์**: Tracking Number, ชื่อผู้รับ, รหัสพัสดุ, ชื่อหน่วยงาน, ชื่ออาคาร
- **กรองสถานะ**: ทั้งหมด / รอนำจ่าย / ส่งมอบแล้ว / มีปัญหา/ตีกลับ
- **วันที่**: แสดง Thai format (เช่น 26 ก.พ. 2569 10:35)
- จำกัดผลลัพธ์ 50 รายการ

---

## 5. UI Components

### 5.1 PostalPage.tsx (Main Layout)

```tsx
// Route: /postal
// Tabs: 3 tabs
type Tab = "entry" | "pending" | "search";

const tabs = [
  { id: "entry", label: "บันทึกรับพัสดุ", icon: Package },
  { id: "pending", label: "รายการรอนำจ่าย", icon: Truck },
  { id: "search", label: "ค้นหาประวัติ", icon: Search },
];
```

### 5.2 PostalEntryForm.tsx (บันทึกรับพัสดุ)

| Section             | Fields                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| **หน่วยงานปลายทาง** | SearchableSelect (ดึงจาก Central DB), แสดง 🏢 อาคาร / 📍 ชั้น อัตโนมัติ              |
| **ไปรษณีย์ธรรมดา**  | Input number (จำนวนชิ้น)                                                             |
| **EMS/ลงทะเบียน**   | Dynamic list: เลขพัสดุ, ประเภท, ชื่อผู้รับ (SearchableSelect + ตัวแทน), สแกนบาร์โค้ด |
| **สรุป**            | รวมจำนวนก่อนบันทึก                                                                   |

### 5.3 PostalPendingList.tsx (รายการรอนำจ่าย)

- **แสดง**: 2-Level Grouping (อาคาร → หน่วยงาน)
- **Column Headers**: เลข Tracking / ผู้รับ / ประเภท / เวลารับเข้า
- **Badge สี**: ไปรษณีย์ธรรมดา (amber) / ลงทะเบียน-EMS (teal)
- **Collapse/Expand**: แต่ละหน่วยงานซ่อน/แสดงรายการ
- **เลือก**: Checkbox ต่อรายการ + เลือกทั้งหมด
- **การจ่าย**: เปิด DeliveryModal เพื่อยืนยัน
- **แก้ไข**: ปุ่มแก้ไขข้อมูลพัสดุ
- **Loading**: แสดง spinner ขณะโหลด (ไม่แสดง "ไม่มีพัสดุ" ก่อนโหลดเสร็จ)

### 5.4 PostalSearchTab.tsx (ค้นหาประวัติ)

- **Search Input**: ค้นหาด้วย Tracking/ชื่อ/หน่วยงาน/อาคาร + 🔍 icon
- **Filter Pills**: สถานะ (ทั้งหมด/รอนำจ่าย/ส่งมอบแล้ว/มีปัญหา/ตีกลับ) — auto-search เมื่อคลิก
- **Results Table**: แสดง 50 รายการล่าสุด + result count
- **วันที่**: แปลง ISO → Thai format อัตโนมัติ
- **Loading**: แสดง spinner ขณะค้นหา

### 5.5 DeliveryModal.tsx (Modal ยืนยันนำจ่าย)

- **Banner**: แสดงชื่อหน่วยงานที่นำจ่าย (teal)
- **ผู้รับ**: SearchableSelect (กรองตามหน่วยงาน ด้วย DeptID→DeptName map)
  - รวม Personnel + ตัวแทนรับไปรษณีย์ภัณฑ์ (Representatives)
  - Fallback + warning ถ้าไม่เจอบุคลากร
- **ลายเซ็น**: SignatureCanvas (ลายเซ็นดิจิทัล)
- **สรุป**: จำนวนไปรษณีย์ธรรมดา / ไปรษณีย์ลงทะเบียน-EMS

---

## 6. API Contracts

### 6.1 saveEntry (savePackageEntry)

```typescript
// Frontend → Backend
{
  departmentId: string           // DeptID
  departmentName?: string       // Fallback name
  staffEmail: string
  regularQty: number            // จำนวนไปรษณีย์ธรรมดา
  emsList: [
    {
      trackingNumber: string    // เลข Tracking
      itemType: "ลงทะเบียน/EMS"
      recipientName: string
      notes?: string
    }
  ]
}

// Backend → Frontend
{
  success: true,
  count: number,
  message: "บันทึก X รายการเรียบร้อย"
}
```

### 6.2 getPending (getPendingDeliveries)

```typescript
// Frontend → Backend
{
}

// Backend → Frontend
[
  {
    packageId: string,
    trackingNumber: string,
    itemType: string, // "ไปรษณีย์ธรรมดา" | "ไปรษณีย์ลงทะเบียน" | "EMS"
    recipientName: string,
    departmentName: string,
    buildingName: string,
    floor: string,
    receivedAt: string, // Thai datetime format
  },
];
```

### 6.3 confirmDelivery

```typescript
// Frontend → Backend
{
  packageIds: string[]           // รหัสพัสดุที่เลือก
  receiverName: string           // ชื่อผู้รับจริง
  recipientSignature: string    // Base64 PNG
  staffEmail: string             // เจ้าหน้าที่นำจ่าย (จาก Auth Store)
  userEmail: string              // อีเมลผู้ใช้ (จาก Auth Store)
}

// Backend → Frontend
{
  success: true,
  updated: number
}
```

### 6.4 searchPackages

```typescript
// Frontend → Backend
{
  query: string                  // คำค้นหา (5 ฟิลด์)
  role?: string                  // "admin" | "staff" | "user"
  deptId?: string                // หน่วยงานผู้ใช้
  statusFilter?: "" | "Pending" | "Delivered"
}

// Backend → Frontend
[
  {
    id: string,
    packageId: string,
    trackingNumber: string,
    recipientName: string,
    departmentName: string,
    buildingName: string,        // resolve จาก Departments Master Data
    status: "Pending" | "Delivered",
    lastUpdated: string          // Thai datetime format
  }
]
```

### 6.5 checkDuplicate

```typescript
// Frontend → Backend
{ trackingNumber: string }

// Backend → Frontend
{ isDuplicate: boolean, detail?: string }
```

---

## 7. Dependencies

| Module               | หน้าที่                          | วิธีใช้                                                    | สถานะ                 |
| -------------------- | -------------------------------- | ---------------------------------------------------------- | --------------------- |
| **Service_DB**       | ดึงข้อมูลหน่วยงาน/บุคลากร/ตัวแทน | `getData(SHEET_NAMES.DEPTS)`, `getData(SHEET_NAMES.USERS)` | ✅ ใช้งาน             |
| **AdminService**     | Cache ข้อมูลหน่วยงาน + ตัวแทน    | `getDepartments()`, `getRepresentatives()`                 | ✅ ใช้งาน             |
| **Service_Workload** | Log ภาระงาน                      | `logWorkload()` - งานรับพัสดุ + งานนำจ่าย                  | ⚠️ ปิดไว้ (try-catch) |
| **Service_Cache**    | Clear cache                      | `remove("CACHE_PACKAGE_LOGS")`                             | ✅ ใช้งาน             |
| **Google Drive API** | บันทึกลายเซ็นดิจิทัล             | `_saveSignatureToDrive()`                                  | ✅ ใช้งาน             |

---

## 8. Item Types (ประเภทไปรษณีย์ภัณฑ์)

> [!IMPORTANT]
> ใช้เฉพาะชื่อเหล่านี้เท่านั้น ห้ามใช้ชื่ออื่น

| Type Code | Type Label (ในระบบ)   | คำอธิบาย                             | Badge Color |
| --------- | --------------------- | ------------------------------------ | ----------- |
| ORD       | **ไปรษณีย์ธรรมดา**    | จดหมาย/ไปรษณีย์ธรรมดา ไม่มี Tracking | 🟠 amber    |
| REG       | **ไปรษณีย์ลงทะเบียน** | ลงทะเบียนตอบรับ มี Tracking          | 🟢 teal     |
| EMS       | **EMS**               | EMS แบบด่วน มี Tracking              | 🟢 teal     |

---

## 9. Resolved Issues (แก้ไขแล้ว)

| #   | Issue                                                        | สถานะ                             |
| --- | ------------------------------------------------------------ | --------------------------------- |
| C1  | PostalPage.tsx เรียก searchPackages แทน saveEntry            | ✅ แก้แล้ว                        |
| H1  | Missing API: postal.saveEntry ไม่มีใน client.ts              | ✅ แก้แล้ว                        |
| H2  | Missing API: postal.confirmDelivery ไม่มีใน client.ts        | ✅ แก้แล้ว                        |
| —   | Search ค้นหาไม่ได้ตามหน่วยงานและอาคาร                        | ✅ แก้แล้ว                        |
| —   | Search ไม่มี filter สถานะ                                    | ✅ แก้แล้ว                        |
| —   | จนท.ผู้นำจ่าย ว่าง (ไม่ส่ง staffEmail)                       | ✅ แก้แล้ว                        |
| —   | DeliveryModal ไม่กรองผู้รับตามหน่วยงาน                       | ✅ แก้แล้ว                        |
| —   | วันที่แสดงเป็น ISO format                                    | ✅ แก้แล้ว — ใช้ formatThaiDate() |
| —   | Duplicate Check UX — inline warning + spinner + block submit | ✅ แก้แล้ว                        |

## 10. Remaining TODO

- [FIXED] **Scanner**: ปุ่มสแกนบาร์โค้ดยังไม่เชื่อมต่อกับฮาร์ดแวร์จริง (ต้องทดสอบหน้างาน)
- [FIXED] **Service_Workload**: เปิดใช้งานจริงเมื่อระบบ Workload พร้อม (รอ workflow ใหม่)

---

## 11. References

- Backend: `backend/Service_Package.gs`
- Frontend: `frontend/src/pages/PostalPage.tsx`
- API: `frontend/src/api/client.ts` (lines 89-96)
- Blueprint: `dcg-master-blueprint.md` (Section 9, 11, 16)
- Guard Rules: `.agent/workflows/epostal-rules.md`
