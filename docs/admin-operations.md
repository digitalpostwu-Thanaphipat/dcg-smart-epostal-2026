# ePostal Admin Operations

## Current Production

- Deployment: `@284`
- URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`
- Public tracking link: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec?publicTrack=1`

## สถานะระบบ

ระบบผ่าน live readiness และ write lifecycle smoke แล้ว พร้อมใช้งานจริงสำหรับ workflow หลัก

สิ่งที่ตั้งค่าแล้ว:

- `ROOT_ADMIN_EMAIL`
- `BACKUP_FOLDER_ID`
- OAuth scope `script.scriptapp`
- Trigger `createDailyBackup`
- Trigger `checkSystemUptime`
- ชีท `บันทึกการใช้งาน` ใช้หัวคอลัมน์ภาษาไทย

## งาน Admin ประจำ

หน้า `ตั้งค่าระบบ` ควรใช้สำหรับงาน production ปกติ:

- คัดลอกลิงก์ติดตามพัสดุส่วนกลาง
- สำรองข้อมูลทันที ก่อน deploy หรือก่อนแก้ข้อมูลขนาดใหญ่
- ตรวจสุขภาพระบบผ่าน health check
- ตรวจการตั้งค่า trigger และ backup

## Advanced Operations

ใช้เฉพาะเมื่อจำเป็น:

- Maintenance ปีงบ: ใช้ช่วงปิดรอบหรือโดยผู้ดูแลเชิงเทคนิค
- Restore: ใช้เฉพาะเหตุฉุกเฉิน ต้องมี backup และยืนยันสองชั้น
- Repair schema / normalize data: ใช้ตอน rollout, ซ่อมหัวตาราง, หรือปรับข้อมูล legacy
- Uptime Monitor: ตั้งโดยผู้ดูแลระบบหลังยืนยันช่องทางแจ้งเตือนจริง

## Security Operations

### migrateSignaturePrivacy (Admin-only)

คำสั่งเปลี่ยนไฟล์ลายเซ็นทั้งหมดใน Drive ให้เป็น Private:

```
POST /api
{ "action": "migrateSignaturePrivacy", "authToken": "<admin_token>" }
```

- วนลูปไฟล์ทั้งหมดในโฟลเดอร์ `ePostal_Signatures`
- เปลี่ยนจาก public → private (Owner only)
- ตรวจ `getSharingAccess()` หลังเปลี่ยนเพื่อยืนยันผล
- คืน `{ success: true, migrated: N, errors: M }`
- ใช้ครั้งเดียวหลัง deploy ลายเซ็น security patch

### Role Cache Clearing

เมื่อลบ/แก้ไขผู้ใช้ ระบบจะล้าง role cache อัตโนมัติ:
- `adminDeleteUser` → ล้าง cache ก่อนและหลัง operation สำเร็จ
- `adminUpdateUser` → ล้าง cache ของ email เดิม (และ email ใหม่ถ้าเปลี่ยน)

### Conflict Control

`confirmDelivery` ตรวจ `expectedVersions` ก่อนเขียน:
- ถ้า version ตรง → เขียน + เพิ่ม version +1
- ถ้า version ไม่ตรง → return `CONFLICT` + ไม่เขียนแม้แต่รายการเดียว
- Frontend แสดง toast รายชื่อพัสดุที่ conflict + auto-refresh

## Backup

Backup ล่าสุดที่ตรวจแล้ว:

- `BACKUP_ePostal_2026-07-02_1639`

ต้องมี trigger `createDailyBackup` ทำงานรายวัน และควรตรวจ log หลัง deploy สำคัญทุกครั้ง

## Production Health

Health check ต้องผ่าน 7 จุด:

- integrity
- access
- config
- backup
- trigger
- monitor
- sharding

ถ้า health check degrade ให้แก้ก่อน Go-Live หรือก่อนประกาศ release ใหม่

## Security

- ห้ามแชร์ session token, OTP, Apps Script properties, หรือ Drive folder ID ในช่องทางสาธารณะ
- หลังใช้ token สำหรับ live smoke ให้ logout/re-login เพื่อออก session ใหม่
- `xlsx` เป็น accepted risk เฉพาะ Excel export ฝั่ง client เท่านั้น

## Retired OCR Flow

OCR ถูกยกเลิกจากหน้า entry แล้ว เพราะมีความเสี่ยงอ่านเลขพัสดุผิดและไม่เหมาะกับ workflow production

- Frontend ไม่แสดงปุ่ม AI/OCR
- Backend ไม่ expose `performOCR`
- `Service_AI.gs` เป็น compatibility stub เท่านั้น

## Production Rule

ก่อน deploy:

```powershell
npm.cmd run test:unit
npm.cmd run build --prefix frontend
npm.cmd run build:gas --prefix frontend
```

หลัง deploy:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
npm.cmd run test:live-readiness
```

Production write smoke ต้อง opt-in ชัดเจน และใช้ session token ใหม่เท่านั้น
