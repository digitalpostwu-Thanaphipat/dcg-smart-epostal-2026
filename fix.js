const fs = require('fs');
let content = fs.readFileSync('backend/Service_DB.gs', 'utf8');
const lines = content.split(/\r?\n/);

lines[531] = '    let idIdx = headers.findIndex(h => h.includes("รหัส") && (h.includes("หน่วยงาน") || h.includes("แผนก") || h.includes("ศูนย์")));';
lines[532] = '    if (idIdx === -1) idIdx = headers.findIndex(h => h.includes("deptid") || h.includes("departmentid") || h.includes("รหัสแผนก"));';
lines[538] = '    let nameIdx = tempHeaders.findIndex(h => h === "หน่วยงาน" || h === "คณะ/ส่วนงาน" || h === "ชื่อหน่วยงาน" || h === "แผนก" || h === "ชื่อแผนก");';
lines[539] = '    if (nameIdx === -1) nameIdx = tempHeaders.findIndex(h => h.includes("ชื่อหน่วยงาน") || h.includes("ชื่อแผนก"));';
lines[540] = '    if (nameIdx === -1) nameIdx = tempHeaders.findIndex(h => (h.includes("หน่วยงาน") || h.includes("แผนก") || h.includes("ส่วนงาน")) && !h.includes("รหัส") && !h.includes("เบอร์") && !h.includes("โทร"));';
lines[542] = '    const buildIdx = headers.findIndex(h => h.includes("building") || h.includes("อาคาร") || h.includes("ตึก"));';
lines[543] = '    const floorIdx = headers.findIndex(h => h.includes("floor") || h.includes("ชั้น"));';

lines[577] = '    const emailIdx = headers.findIndex(h => h.includes("อีเมล") || h.includes("email"));';
lines[578] = '    const nameIdx = headers.findIndex(h => h.includes("ชื่อ-ชื่อสกุล") || h.includes("ชื่อ-นามสกุล") || h.includes("ชื่อ") || h.includes("fullname") || h.includes("name"));';
lines[579] = '    const deptIdx = headers.findIndex(h => h.includes("หน่วยงาน") || h.includes("คณะ") || h.includes("สังกัด") || h.includes("ส่วนงาน") || h.includes("แผนก") || h.includes("dept"));';

lines[609] = '    const deptIdx = headers.findIndex(h => h.includes("รหัสหน่วยงาน") || h.includes("deptid"));';
lines[610] = '    const nameIdx = headers.findIndex(h => h.includes("ชื่อตำแหน่ง") || h.includes("position"));';

fs.writeFileSync('backend/Service_DB.gs', lines.join('\n'), 'utf8');
console.log("File patched.");
