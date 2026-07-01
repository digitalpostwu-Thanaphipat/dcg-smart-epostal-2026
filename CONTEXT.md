# ePostal Context

## Package Log Glossary

- `ชื่อผู้รับไปรษณีย์ภัณฑ์`: ชื่อผู้รับที่บันทึกจากหน้าซองหรือหน้าพัสดุ ใช้แทนคำเดิม `ชื่อผู้รับ`
- `ผู้รับตามจ่าหน้า`: ชื่อที่บันทึกตอนยืนยันส่งมอบ/ลงนาม ใช้แทนคำเดิม `ผู้รับจริง`
- `วิธีการส่งมอบ`: ใช้ค่า `ส่งมอบที่หน่วยงาน`
- `ประเภทการใช้`: ใช้ค่า `ส่วนบุคคล` หรือ `งานมหาวิทยาลัย` เท่านั้น
- `จนท.ผู้นำจ่าย`, `ผู้บันทึก`, `ผู้อัปเดตล่าสุด`: แสดงชื่อบุคลากร ไม่แสดงอีเมลเมื่อพบข้อมูลผู้ใช้ในฐานข้อมูล
- `ลายเซ็น`: บันทึกเป็นรูปที่แสดงใน Google Sheets ผ่าน `IMAGE()` เมื่อระบบได้รับ data URL หรือ URL
- `ประเภท`: ใช้ค่า `ไปรษณีย์ธรรมดา`, `ไปรษณีย์ด่วนพิเศษ (EMS)`, หรือ `ไปรษณีย์ลงทะเบียน`

## Migration Notes

- Runtime code ยังอ่านหัวคอลัมน์เก่า `ชื่อผู้รับ` และ `ผู้รับจริง` เพื่อรองรับชีทที่ยังไม่ได้ซ่อมหัวตาราง
- `ส่วนตัว` และ `ธุระส่วนตัว (ส่วนบุคคล)` เป็นค่า legacy สำหรับอ่านข้อมูลเก่าเท่านั้น รายการใหม่ต้องบันทึกเป็น `ส่วนบุคคล`
- `EMS`, `ไปรษณีย์ภัณฑ์ธรรมดา`, `นำจ่ายที่หน่วยงาน`, `เซ็นรับที่เคาน์เตอร์` เป็นค่า legacy ที่ต้อง normalize ก่อน full rollout
- หลัง deploy ให้รันฟังก์ชันซ่อมหัวตารางของโปรเจคเพื่อให้ชีทจริงใช้ schema ใหม่ครบ 18 คอลัมน์

## Installed Skills

- Installed from `google/agents-cli`: `google-agents-cli-workflow`, `google-agents-cli-scaffold`, `google-agents-cli-adk-code`, `google-agents-cli-eval`, `google-agents-cli-deploy`, `google-agents-cli-publish`, `google-agents-cli-observability`
- Current ePostal project is a React + Google Apps Script app, not an ADK agent project, so the agents-cli skills are used as workflow/code-preservation guidance only. Do not run scaffold/enhance unless the project is intentionally converted to an ADK agent project.
