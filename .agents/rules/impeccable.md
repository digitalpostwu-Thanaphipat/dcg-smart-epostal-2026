# Rule: Impeccable UI Design Standards

## 🎨 Core Design Principles (หลักการออกแบบหลัก)
เพื่อให้แอปพลิเคชันมีหน้าตาที่พรีเมียมในสไตล์ **Luxury Intelligence** และไม่ดูเป็นระบบแบบพึ่งพาเทมเพลตทั่วไป ให้ยึดกฎการออกแบบดังนี้:

### 1. Typography & Hierarchy (ตัวอักษรและการจัดลำดับความสำคัญ)
*   **Font Matching:**
    *   หัวข้อ (Headings/Labels): ใช้ Font `Prompt` (ผ่าน CSS class `.font-heading`)
    *   เนื้อหา (Body/Content): ใช้ Font `Sarabun` (ผ่าน CSS class `.font-body`)
*   **Label Pattern:** ตัวอักษรขนาดเล็กพิเศษสำหรับหัวข้อกำกับฟิลด์ข้อมูลหรือหมวดหมู่ย่อย: `text-[10px] font-black uppercase tracking-widest text-slate-500`

### 2. Color System & Tinting (การใช้สีและโหมดสี)
*   **ห้ามใช้สีเทาแท้ (No Pure Gray):** ทุกองค์ประกอบที่เป็นสีเทาหรือพื้นหลังต้องใช้สีเทาที่เจือโทนสีหลัก (Tinted Grays) เช่น `Zinc` หรือ `Slate` ที่เจือเฉดเขียว Emerald หรือสีน้ำเงินเทา
*   **Contrast Compliance:** ข้อความและปุ่มกดทั้งหมดต้องมีอัตราส่วนคอนทราสต์ขั้นต่ำ **4.5:1** (WCAG 2.1 AA) เพื่อความสามารถในการเข้าถึงระบบสำหรับผู้บกพร่องทางสายตา
*   **Dark Mode Support:** ใช้ class `.dark` บนแท็ก `<html>` เสมอ และหลีกเลี่ยงการ hardcode สีขาวดำ ให้ใช้ตัวแปร CSS หรือ utility classes ที่ผูกกับโหมดมืด (เช่น `bg-zinc-50 dark:bg-zinc-950`)

### 3. Cards & Containers (การวางการ์ดและกรอบข้อมูล)
*   **ห้ามใช้การ์ดซ้อนการ์ด (No Nested Cards):** หลีกเลี่ยงการนำ `Card` ไปซ้อนภายใน `Card` อื่นที่มีขอบหรือเงา หากจำเป็นต้องแบ่งหมวดหมู่ในหน้าเดียวกัน ให้ใช้เส้นแบ่งบาง (`border-b` หรือ `border-t` ที่มี opacity ต่ำ) หรือการปรับพื้นหลังจางๆ (Soft background tinting) แทน
*   **Border Radius:** องค์ประกอบหลัก เช่น กล่องข้อความและการ์ดข้อมูล ให้ใช้ความโค้งมนที่สม่ำเสมอ (`rounded-2xl` หรือ `rounded-[2.5rem]` สำหรับ Banner/Hero)

### 4. Interactive & Micro-interactions (การตอบสนองและอนิเมชันขนาดเล็ก)
*   **Smooth Easing:** หลีกเลี่ยงการใช้อนิเมชันแบบสปริงตัว (Bounce/Elastic) ที่ดูรุนแรงเกินไป ให้ใช้ Transition ความเร็ว `150ms` ถึง `300ms` ร่วมกับ `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
*   **Tactile Hover:** ทุกปุ่มกด (Buttons) และการ์ดข้อมูลที่สามารถคลิกได้ (Interactive Cards) ต้องมีเอฟเฟกต์ hover ที่นุ่มนวล เช่น การลดหรือเพิ่ม opacity, การขยับขึ้นเล็กน้อย (`hover:-translate-y-0.5`), หรือการเรืองแสงจางๆ
*   **Blur & Transparency:** ใช้เอฟเฟกต์กระจกฝ้า (Glassmorphism) สำหรับ Sidebar, Topbar และการ์ดข้อมูลสำคัญ: `backdrop-filter: blur(8px) bg-white/70 dark:bg-zinc-900/80`

---
*Reference: Derived from pbakaus/impeccable UI guidelines and adapted for ePostal Luxury Intelligence Theme*
