---
description: กฎป้องกันระบบ ePostal — อ่านก่อนแก้ไขโมดูลนี้
---

# 🛡️ ePostal Module Guard Rules

> **⚠️ อ่านทั้งหมดก่อนแก้ไขโค้ดในระบบ ePostal**
>
> เอกสารนี้คือ "ป้ายห้าม" สำหรับนักพัฒนาใหม่ เพื่อป้องกันการทำระบบที่ใช้งานได้อยู่แล้วพัง

---

## ❌ ห้ามทำ (DO NOT)

### 1. ห้ามเปลี่ยน Schema 18 คอลัมน์

```
0:รหัสพัสดุ, 1:เลขพัสดุ, 2:ประเภท, 3:ชื่อหน่วยงาน, 4:ชื่อผู้รับ,
5:สถานะ, 6:เวลาบันทึก, 7:เวลาจ่าย, 8:จนท.นำจ่าย, 9:ผู้รับจริง,
10:ลายเซ็น, 11:รูปภาพ, 12:GPS, 13:วิธีส่งมอบ, 14:ประเภทการใช้, 15:หมายเหตุ/Line, 16:ผู้บันทึก, 17:ผู้อัปเดตล่าสุด
```

- ❌ ห้ามเพิ่ม/ลบ/เปลี่ยนลำดับคอลัมน์โดยไม่ได้รับอนุมัติ
- ❌ ห้ามเปลี่ยน Index เช่น Col A (index 0) ต้องเป็น รหัสพัสดุ เสมอ

### 2. ห้ามเปลี่ยนชื่อประเภทไปรษณีย์ภัณฑ์

| Type Code | ชื่อที่ถูกต้อง        | ❌ ห้ามใช้                        |
| --------- | --------------------- | --------------------------------- |
| ORD       | **ไปรษณีย์ธรรมดา**    | ~~พัสดุธรรมดา~~, ~~จดหมายธรรมดา~~ |
| REG       | **ไปรษณีย์ลงทะเบียน** | ~~ลงทะเบียน~~, ~~พัสดุลงทะเบียน~~ |
| EMS       | **EMS**               | —                                 |

### 3. ห้ามแก้ไขข้ามโมดูล

- ❌ ห้ามแก้ `Service_Package.gs` แล้วไปกระทบ `Service_SmartDrop.gs`
- ❌ ห้ามแก้ `Code.gs` routing โดยไม่ทดสอบทุก action ที่มีอยู่
- ❌ ห้ามย้าย/เปลี่ยนชื่อ `Service_Package.gs` (เป็นชื่อที่ Blueprint กำหนด)

### 4. ห้ามลบ API endpoints ที่มีอยู่แล้ว

```
savePackageEntry, updatePackageEntry, confirmDelivery,
searchPackages, getPendingDeliveries, checkDuplicate, getRepresentatives
```

---

## ✅ ต้องทำ (MUST DO)

### 1. อ่านเอกสารก่อนเริ่มงาน

- อ่าน `.agent/workflows/epostal.md` (Workflow ฉบับเต็ม)
- อ่าน `dcg-master-blueprint.md` (Section 9: Module Registry)
- อ่านเอกสารนี้ (`epostal-rules.md`)

### 2. ทดสอบก่อน Deploy

**Checklist ก่อน Deploy:**

- [ ] TypeScript build ผ่าน (`npx tsc --noEmit --skipLibCheck`)
- [ ] บันทึกรับพัสดุ (ทั้งไปรษณีย์ธรรมดาและ EMS) ทำงานได้
- [ ] รายการรอนำจ่าย แสดงข้อมูลถูกต้อง (grouping อาคาร/หน่วยงาน)
- [ ] ยืนยันนำจ่าย → จนท.ผู้นำจ่าย ไม่ว่าง
- [ ] ค้นหาประวัติ → ค้นหาได้ทั้ง 5 ฟิลด์ + filter สถานะ
- [ ] วันที่แสดงเป็น Thai format ไม่ใช่ ISO

### 3. รักษาลำดับข้อมูลตามชีท

- รายชื่อหน่วยงานเรียงตามลำดับในชีท (ห้าม sort)
- รายชื่อบุคลากรเรียงตามลำดับในชีท (ห้าม sort)

### 4. ใช้ Thai Date Format เสมอ

- Frontend ต้องใช้ `formatThaiDate()` สำหรับแสดงวันที่
- ❌ ห้ามแสดง ISO format เช่น `2569-02-26T03:35:00.000Z`
- ✅ ต้องแสดง `26 ก.พ. 2569 10:35`

---

## 📐 Module Boundaries

```
ePostal Module Scope:
├── Backend
│   └── Service_Package.gs       ← แก้ไขได้ (ระวัง Schema 18 คอลัมน์)
├── Frontend
│   ├── pages/PostalPage.tsx     ← แก้ไขได้ (3 tabs)
│   └── components/postal/
│       ├── PostalEntryForm.tsx   ← แก้ไขได้
│       ├── PostalPendingList.tsx ← แก้ไขได้
│       ├── PostalSearchTab.tsx   ← แก้ไขได้
│       ├── DeliveryModal.tsx     ← แก้ไขได้
│       ├── EditPackageModal.tsx  ← แก้ไขได้
│       └── ScannerModal.tsx      ← แก้ไขได้
├── API Client
│   └── client.ts (lines 89-96)  ← แก้ไขเฉพาะ postal section
└── ⚠️ Shared Dependencies (ห้ามแก้โดยไม่ได้อนุมัติ)
    ├── Code.gs                   ← Router — เพิ่ม route ได้ แต่ห้ามลบ
    ├── AdminService.gs          ← อ่านอย่างเดียว
    ├── Service_DB.gs            ← อ่านอย่างเดียว
    └── Service_Utils.gs         ← อ่านอย่างเดียว
```

---

## 📋 Change Request Process

เมื่อต้องการเปลี่ยนแปลง **โครงสร้าง** ของ ePostal:

1. **เขียน Proposal** — อธิบายสิ่งที่ต้องเปลี่ยนและเหตุผล
2. **ตรวจ Impact** — ไฟล์ใดบ้างที่ได้รับผลกระทบ
3. **ขออนุมัติ** — ส่ง Proposal ให้ผู้ดูแลระบบ
4. **ทดสอบ** — ผ่าน Checklist ทั้งหมดก่อน Deploy
5. **อัปเดตเอกสาร** — อัปเดต `epostal.md` + `epostal-rules.md` + `dcg-master-blueprint.md`
