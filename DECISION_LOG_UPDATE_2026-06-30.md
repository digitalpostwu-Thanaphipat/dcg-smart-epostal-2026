# Decision Log Update - 2026-06-30

## Production Live Test @248

- **Context:** ต้องยืนยันว่าระบบจริงพร้อมทดสอบใช้งานหลัง deploy เวอร์ชันล่าสุด และต้องตรวจทั้งลิงก์ติดตามสาธารณะกับการเข้าใช้งาน Admin ด้วย OTP
- **Decision:** ใช้ deployment เดิม `AKfycbz3A7-mdN49qYnSnNjo5vyNaHbZL3KMoMRZq0UL8UU91fUhrcmOnNOAtjK-9gAyjuEilg` และ redeploy เป็น `@248` โดยแก้ route ตรวจ `publicTrack=1` ให้ทำงานกับ iframe ของ Google Apps Script
- **Rationale:** Apps Script แยกหน้าเว็บจริงไปอยู่ใน iframe ของ `googleusercontent.com` ทำให้ React อ่าน query จาก `window.location.search` โดยตรงไม่ได้ ต้องใช้ `google.script.url.getLocation` ช่วยตรวจ URL จริง
- **Impact:** ลิงก์ติดตามสาธารณะเปิดได้จริง, Admin OTP ผ่าน, อ่านผู้ใช้ 15 คน, อ่านหน่วยงาน 62 หน่วยงาน, ค้นหารายการพัสดุจริงได้ 17 รายการ
- **Residual Risk:** ยังมี warning เรื่อง `VITE_GAS_URL` และ service worker MIME; ยังไม่ได้ทดสอบเขียนข้อมูลจริงในชีท
- **Status:** Accepted | Deployed @248
- **Lead Agent:** Codex

## หมายเหตุ

ไม่ได้แก้ `DECISION_LOG.md` โดยตรง เพราะไฟล์เดิมมีปัญหา encoding และเครื่องมือ patch อ่านไฟล์ไม่ได้แบบปลอดภัย การอัปเดตนี้จึงถูกแยกไว้เป็นไฟล์ addendum เพื่อไม่ทำให้ประวัติเดิมเสียหาย
