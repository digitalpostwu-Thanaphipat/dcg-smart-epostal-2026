# 🤖 DCG Smart ePostal - AI Agents & Skills

โฟลเดอร์นี้ใช้สำหรับจัดการ AI Agents และ Skills ของระบบ (ออกแบบมาเพื่อทำงานร่วมกับ Claude Code และเครื่องมือ Automation ต่างๆ)

## 📁 โครงสร้างโฟลเดอร์ (Folder Structure)

เพื่อป้องกันความสับสนในการแก้ไขโค้ด กรุณายึดโครงสร้างต่อไปนี้เป็นหลัก:

- **`skills/`** 🟢 (โฟลเดอร์หลัก) เก็บ Skills และ Agent Prompts ที่กำลังถูกใช้งานจริงในระบบ (Active) **หากต้องการแก้ไขโค้ด ให้แก้ไขที่นี่เสมอ**
- **`skills/.disabled/`** ⚪ เก็บ Skills ที่ถูกปิดการใช้งานชั่วคราว
- **`library/`** 📚 โฟลเดอร์ที่ใช้เก็บเครื่องมือจัดการ (เช่น `skills_manager.py`), เทมเพลตต้นฉบับ, หรือปลั๊กอิน (ไม่ควรเพิ่มหรือแก้ไขไฟล์ทักษะที่นี่โดยตรง เพื่อไม่ให้ซ้ำซ้อนกับโฟลเดอร์ `skills/`)

## 🛠️ การจัดการเปิด-ปิด Skills (Skills Manager)

ระบบมีสคริปต์ `skills_manager.py` (อยู่ใน `library/tools/scripts/`) สำหรับช่วยสลับเปิด/ปิดการทำงานของ Skills โดยมันจะย้ายไฟล์ระหว่างโฟลเดอร์ `skills/` และ `skills/.disabled/` ให้แบบอัตโนมัติ

**คำสั่งที่รองรับ (รันผ่าน Command Line ที่ Root ของโปรเจกต์):**

```bash
# 1. ดูรายชื่อ Skills ที่เปิดใช้งานอยู่
python3 .agents/library/tools/scripts/skills_manager.py list

# 2. ดูรายชื่อ Skills ที่ถูกปิดใช้งาน
python3 .agents/library/tools/scripts/skills_manager.py disabled

# 3. เปิดใช้งาน Skill (ย้ายจาก .disabled/ มาที่ skills/)
python3 .agents/library/tools/scripts/skills_manager.py enable <SKILL_NAME>

# 4. ปิดใช้งาน Skill (ย้ายจาก skills/ ไปที่ .disabled/)
python3 .agents/library/tools/scripts/skills_manager.py disable <SKILL_NAME>
```

> **คำเตือน:** อย่าคัดลอกไฟล์ซ้ำกันระหว่าง `library/` และ `skills/` หากต้องการใช้เป็น Base ขอแนะนำให้ทำเป็น Symlink แทนครับ
---