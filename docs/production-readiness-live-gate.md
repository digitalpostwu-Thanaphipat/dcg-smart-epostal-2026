# ePostal Production Readiness Live Gate

Generated: 2026-08-07
Current production deployment: `@284`
Current production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## สถานะปัจจุบัน

Live readiness gate ผ่านแล้ว และ write lifecycle smoke ผ่านแล้วบน production

สถานะ release:

- **Production Ready for core workflows:** ผ่าน
- **Full Production Ready with completed PWA offline validation:** ผ่าน

## Local Gates

รันก่อน sign-off หรือ deploy รอบถัดไป:

```powershell
npm.cmd run test:unit
npm.cmd audit
npm.cmd audit --prefix frontend
npm.cmd run build --prefix frontend
npm.cmd run build:gas --prefix frontend
```

หมายเหตุ: frontend audit ยังมี 3 high: `xlsx` (2 advisories ไม่มี fix) + `react-router` RSC-mode (ไม่กระทบ HashRouter) — บันทึกเป็น accepted risk ใน `QUALITY_GATES.md`

## Live Readiness Gate

Read-only live checks:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
npm.cmd run test:live-readiness
```

Authenticated read checks:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
npm.cmd run test:live-readiness
```

Production write lifecycle check ต้อง opt-in ชัดเจน:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
$env:EPOSTAL_LIVE_WRITE = "1"
npm.cmd run test:live-readiness
```

## สิ่งที่ Gate ตรวจ

- หน้า public tracking โหลดจาก production URL ได้
- GAS ส่ง manifest ผ่าน `?get=manifest`
- GAS ส่ง service worker ผ่าน `?get=sw`
- `systemHealthCheck` ตรวจ 7 จุด: integrity, access, config, backup, trigger, monitor, sharding
- protected actions ปฏิเสธ request ที่ไม่มี token หรือ token ผิด
- authenticated read smoke ตรวจ `adminGetUsers` และ `searchPackages`
- write smoke สร้างรายการ production test, ค้นหา, confirm delivery, และ verify สถานะหลัง confirm

## ผลล่าสุดวันที่ 2 กรกฎาคม 2026

| รายการ | ผล |
| --- | --- |
| Main page | ผ่าน |
| Health check | ผ่าน, status `healthy` |
| Authenticated admin read | ผ่าน, พบผู้ใช้ 15 คน |
| Write lifecycle smoke | ผ่าน |

Write lifecycle smoke:

- Tracking: `LIVE-READINESS-20260702100910`
- Package ID: `EMS-20260702-0001`
- Final status: `ส่งมอบแล้ว`
- Delivered at: `2/7/2569 17:09`

## Manual Mobile PWA Check

ใช้ Android Chrome กับ production URL:

- เปิด live URL และยืนยันว่าไม่มี service worker MIME error ที่กระทบการใช้งาน
- ยืนยันว่ามี install prompt หรือ Add to Home Screen
- ติดตั้งและเปิดจาก Home Screen
- ปิด network แล้วเปิดซ้ำเพื่อยืนยันว่า app shell โหลดได้

ถ้ายังไม่ทำ manual check นี้ ให้คงสถานะไว้ที่ **Production Ready for core workflows**
