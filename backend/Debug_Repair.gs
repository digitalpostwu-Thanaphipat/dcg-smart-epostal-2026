/**
 * Debug_Repair.gs - System Repair Toolkit [Loki Mode]
 * ใช้สำหรับซ่อมแซมการเชื่อมต่อฐานข้อมูลและล้างค่าคอนฟิกที่ผิดพลาด
 */

/**
 * runSystemRepair
 * [Hardened] Consolidated repair logic with discovery chain and validation.
 */
function runSystemRepair() {
  const props = PropertiesService.getScriptProperties();
  const me = Session.getEffectiveUser().getEmail();
  
  console.log("🛠️ Starting System Repair for: " + me);
  
  // 1. Clear potentially corrupt properties
  props.deleteProperty("LOCAL_DB_ID");
  props.deleteProperty("CENTRAL_DB_ID");
  props.deleteProperty("DB_SHARDS");
  props.deleteProperty("LINKED_DB_ID");
  
  // 2. Discovery Chain
  let discoveredId = "";
  
  // A. Try Active Spreadsheet (Most Reliable if running from the DB file)
  try {
    const activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      const id = activeSs.getId();
      if (_isValidSpreadsheet(id)) {
        discoveredId = id;
        console.log("✅ Using Active Spreadsheet ID: " + discoveredId);
      }
    }
  } catch (e) {
    console.warn("Active SS Discovery failed: " + e.message);
  }

  // B. Try searching by name "ePostal_2026"
  if (!discoveredId) {
    const searchId = typeof _findSpreadsheetIdByName === 'function' ? _findSpreadsheetIdByName("ePostal_2026") : null;
    if (searchId && _isValidSpreadsheet(searchId)) {
      discoveredId = searchId;
      console.log("✅ Discovered via Name Search: " + discoveredId);
    }
  }

  // 3. Final Linking
  if (discoveredId) {
    props.setProperty("LOCAL_DB_ID", discoveredId);
    console.log("✅ Linked successfully to: " + discoveredId);
  } else {
    // Last Resort: Hardcoded ID (Validated v4.0.2 ID)
    const fallbackId = "1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ"; 
    if (_isValidSpreadsheet(fallbackId)) {
      props.setProperty("LOCAL_DB_ID", fallbackId);
      console.log("⚠️ Linked to Fallback ID.");
    } else {
      return "❌ ไม่สามารถระบุฐานข้อมูลที่ถูกต้องได้ กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่า LOCAL_DB_ID ด้วยตนเอง";
    }
  }
  
  // 4. Force Initialize Sheets
  try {
    if (typeof initializeSystemSheets === 'function') {
      initializeSystemSheets();
      console.log("✅ System Sheets verified.");
    }
  } catch (e) {
    console.error("❌ Sheet initialization failed: " + e.message);
  }
  
  const finalId = props.getProperty("LOCAL_DB_ID");
  return "🚀 ซ่อมแซมระบบเรียบร้อยแล้ว!\n\nเชื่อมต่อกับ: " + finalId + "\nกรุณารีเฟรชหน้าเว็บเพื่อใช้งานครับ";
}

/**
 * _isValidSpreadsheet
 * Helper to validate if an ID is a valid, accessible Spreadsheet.
 */
function _isValidSpreadsheet(id) {
  if (!id || id.length < 40) return false;
  try {
    const ss = SpreadsheetApp.openById(id);
    return !!ss;
  } catch (e) {
    return false;
  }
}

/**
 * repairWrapper
 * UI Trigger for Google Sheets Menu
 */
function repairWrapper() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('ยืนยันการซ่อมแซม?', 'ระบบจะล้างค่าการเชื่อมต่อเดิมและพยายามค้นหาฐานข้อมูลใหม่โดยอัตโนมัติ', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    const result = runSystemRepair();
    ui.alert('ผลการดำเนินการ', result, ui.ButtonSet.OK);
  }
}

/**
 * listAllRelevantSheets
 * Diagnostic tool to list ePostal-related files
 */
function listAllRelevantSheets() {
  const results = [];
  try {
    const files = DriveApp.getFiles(); 
    let count = 0;
    while (files.hasNext() && count < 30) {
      const file = files.next();
      if (file.getName().includes("ePostal")) {
        results.push({ name: file.getName(), id: file.getId() });
      }
      count++;
    }
  } catch (e) {
    console.error("List error: " + e.message);
  }
  return results;
}
