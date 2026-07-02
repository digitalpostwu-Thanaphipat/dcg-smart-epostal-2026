function _findSpreadsheetIdByName(name) {
  try { var files = DriveApp.getFilesByName(name); if (files.hasNext()) { return files.next().getId(); } } catch (e) { console.warn("Failed to find file by name: " + name, e); }
  return null;
}

/**
 * Service_DB.gs - VERSION 22 (FIXED ENCODING)
 */

// --- PROFESSIONAL CONFIGURATION: CENTRAL DB ID ---
// [Loki Mode] Use script properties to avoid hardcoding (Sec 11 Compliance)

/**
 * setupDefaultConfig - Run this ONCE from Apps Script editor to configure Script Properties
 * Go to: Apps Script → Functions dropdown → select setupDefaultConfig → Run
 */
function setupDefaultConfig() {
  var props = PropertiesService.getScriptProperties();
  var defaults = {
    "CENTRAL_DB_ID": "1OEb6X2xKykfrBixIPpiNayyzixcKoM3iOT6xzDJ0II0",
    "LOCAL_DB_ID": "1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ"
  };
  var results = [];
  for (var key in defaults) {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaults[key]);
      results.push("Set " + key + " = " + defaults[key]);
    } else {
      results.push(key + " already configured: " + props.getProperty(key));
    }
  }
  return results.join("\n");
}

function _getCentralDbId() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("CENTRAL_DB_ID");
  if (!id) {
    throw new Error("CENTRAL_DB_ID not configured. Run setupDefaultConfig() from Apps Script editor first.");
  }
  return id;
}

var SPREADSHEET_ID = (function() {
  const props = PropertiesService.getScriptProperties();
  
  // 1. Check Cache/Properties First
  const cachedId = props.getProperty("LOCAL_DB_ID");
  if (cachedId && cachedId.length > 40) {
    // Validation: Only return if it's potentially valid (avoid illegal IDs)
    return cachedId;
  }
  
  // 2. Discovery Fallback
  console.log("โ ๏ธ SPREADSHEET_ID Cache Miss: Discovering...");
  let discoveredId = "";
  try {
    // Try finding by name (Dynamic lookup)
    discoveredId = typeof _findSpreadsheetIdByName === 'function' ? _findSpreadsheetIdByName("ePostal_2026") : null;
  } catch (e) {
    console.error("Discovery failed: " + e.message);
  }

  // 3. Final Fallback - require explicit configuration
  var finalId = (discoveredId && discoveredId.length > 40) 
    ? discoveredId 
    : null;

  if (!finalId) {
    // Try to auto-configure from defaults
    var defaultLocalId = "1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ";
    props.setProperty("LOCAL_DB_ID", defaultLocalId);
    console.log("Auto-configured LOCAL_DB_ID from defaults");
    return defaultLocalId;
  }

  // Persistence: Save to properties to avoid future misses
  if (finalId.length > 40) {
    props.setProperty("LOCAL_DB_ID", finalId);
  }
  
  return finalId;
})();

var SPREADSHEET_IDS = {
  get CENTRAL() { return _getCentralDbId(); },
  get LOCAL() { 
    // Use the validated SPREADSHEET_ID instead of direct property access to avoid illegal IDs
    return SPREADSHEET_ID; 
  }
};

/**
 * Robust Header Index Finder
 * [Hardening] Use this instead of findIndex or manual mapping.
 * Handles casing, extra spaces, and partial matching to prevent failures.
 */
function getHeaderIndex(headers, key) {
  if (!headers || !Array.isArray(headers)) return -1;
  const keywords = Array.isArray(key) ? key : [key];
  const cleanHeaders = headers.map(h => String(h || "").trim().toLowerCase());
  
  for (let i = 0; i < cleanHeaders.length; i++) {
    const h = cleanHeaders[i];
    // Exact match first
    if (keywords.some(k => h === k.toLowerCase())) return i;
  }
  // Partial match fallback
  for (let i = 0; i < cleanHeaders.length; i++) {
    const h = cleanHeaders[i];
    if (keywords.some(k => h.includes(k.toLowerCase()))) return i;
  }
  return -1;
}

/**
 * [Hardened] forceStandardizeHeaders
 * Aggressively wipes and resets the header row to exactly 16 columns.
 */
function forceStandardizeHeaders(sheetName) {
  return JSON.stringify(Service_Schema.repairPackageLogHeaders());
}

var SHEET_NAMES = {
  USERS: "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e23\u0e30\u0e1a\u0e1a",
  PERSONNEL: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19",
  DEPTS: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19",
  CONFIG: "\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e23\u0e30\u0e1a\u0e1a",
  POSITIONS: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e1a\u0e23\u0e34\u0e2b\u0e32\u0e23",
  REPS: "\u0e15\u0e31\u0e27\u0e41\u0e17\u0e19\u0e23\u0e31\u0e1a\u0e44\u0e1b\u0e23\u0e29\u0e13\u0e35\u0e22\u0e4c\u0e20\u0e31\u0e13\u0e11\u0e4c", // ตัวแทนรับไปรษณีย์ภัณฑ์
  PACKAGE_LOG: "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e1e\u0e31\u0e2a\u0e14\u0e38",
  LOGS_AUDIT: "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19",
  LOGS_ERROR: "Error_Log",
  FEEDBACK_LOG: "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e02\u0e49\u0e2d\u0e40\u0e2a\u0e19\u0e2d\u0e41\u0e19\u0e30",
  ANNOUNCEMENTS: "\u0e1b\u0e23\u0e30\u0e01\u0e32\u0e28\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a",
  SYSTEM_CONFIGS: "System_Configs",
  SYSTEM_STATS: "\u0e2a\u0e16\u0e34\u0e15\u0e34\u0e23\u0e30\u0e1a\u0e1a",
  ARCHIVE_INDEX: "\u0e14\u0e31\u0e0a\u0e19\u0e35\u0e41\u0e1f\u0e49\u0e21\u0e22\u0e49\u0e2d\u0e19\u0e2b\u0e25\u0e31\u0e07"
};

var LEGACY_SHEET_NAMES = {
  PACKAGE_LOG: "Package_Log",
  LOGS_AUDIT: "Audit_Log",
  FEEDBACK_LOG: "Feedback_Log",
  SYSTEM_STATS: "System_Stats",
  ARCHIVE_INDEX: "Archive_Index"
};

var PROJECT_SHEET_HEADERS = (function() {
  var headers = {};
  headers[SHEET_NAMES.PACKAGE_LOG] = [
    "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับไปรษณีย์ภัณฑ์", "สถานะ",
    "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับตามจ่าหน้า", "ลายเซ็น",
    "รูปภาพ", "พิกัด GPS", "วิธีการส่งมอบ", "ประเภทการใช้", "หมายเหตุ / Line",
    "ผู้บันทึก", "ผู้อัปเดตล่าสุด"
  ];
  headers[SHEET_NAMES.SYSTEM_STATS] = ["หมวดหมู่", "ตัวชี้วัด", "ค่าตัวเลข", "อัปเดตล่าสุด"];
  headers[SHEET_NAMES.USERS] = ["รหัสพนักงาน", "อีเมล (Google)", "ชื่อ-นามสกุล", "สิทธิ์ (Admin/User/Postal)", "หน่วยงาน/แผนก", "ตำแหน่ง"];
  headers[SHEET_NAMES.REPS] = [
    "\u0e2d\u0e35\u0e40\u0e21\u0e25",
    "\u0e0a\u0e37\u0e48\u0e2d-\u0e19\u0e32\u0e21\u0e2a\u0e01\u0e38\u0e25",
    "\u0e23\u0e2b\u0e31\u0e2a\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19",
    "\u0e0a\u0e37\u0e48\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19",
    "\u0e2a\u0e16\u0e32\u0e19\u0e30",
    "\u0e40\u0e1a\u0e2d\u0e23\u0e4c\u0e42\u0e17\u0e23",
    "Line ID",
    "\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38",
    "\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14"
  ];
  headers[SHEET_NAMES.ARCHIVE_INDEX] = ["ปีงบประมาณ", "Spreadsheet ID", "ชื่อไฟล์", "วันที่ย้ายล่าสุด", "จำนวนแถวที่เก็บ", "ยอดรวมพัสดุ", "ยอดส่งมอบแล้ว"];
  headers[SHEET_NAMES.ANNOUNCEMENTS] = ["ลำดับ", "วันที่", "หัวข้อประกาศ", "เนื้อหา", "สถานะ (แสดง/ซ่อน)"];
  headers[SHEET_NAMES.LOGS_AUDIT] = ["วัน-เวลา", "ผู้ดำเนินการ", "การกระทำ", "รายละเอียด", "หมายเหตุ"];
  headers[SHEET_NAMES.CONFIG] = ["ชื่อการตั้งค่า (Key)", "ค่าที่ตั้งไว้ (Value)", "คำอธิบาย"];
  headers[SHEET_NAMES.FEEDBACK_LOG] = ["Timestamp", "วันที่และเวลา (ไทย)", "ผู้ใช้งาน", "หมวดหมู่", "ระดับความพอใจ (1-5)", "รายละเอียด/ข้อเสนอแนะ", "หน้า URL", "ข้อมูลเบราว์เซอร์", "สถานะ"];
  return headers;
})();

function repairProjectSheetHeaders() {
  var lock = LockService.getScriptLock();
  var updated = [];
  var warnings = [];
  try {
    lock.waitLock(20000);
    var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL || SPREADSHEET_ID);
    Object.keys(PROJECT_SHEET_HEADERS).forEach(function(sheetName) {
      var sheet = _getSheetByCanonicalName(ss, sheetName) || ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      var headers = PROJECT_SHEET_HEADERS[sheetName];

      _removeHeaderProtections(sheet, warnings);
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setBackground("#0f766e")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      sheet.setFrozenRows(1);
      try { sheet.autoResizeColumns(1, headers.length); } catch (resizeErr) {}

      _lockHeaderRange(sheet, headers.length, warnings);
      updated.push({ sheet: sheetName, columns: headers.length });
    });

    var packageLogSheet = _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG);
    _setupStatusColors(packageLogSheet);
    var staffNameNormalization = _normalizePackageLogStaffNameColumns(packageLogSheet, warnings);
    var legacyValueNormalization = _normalizePackageLogLegacyValues(packageLogSheet, warnings);
    if (typeof Service_Cache !== "undefined") {
      Service_Cache.remove("PROJECT_SYSTEM_USERS_V1");
      Service_Cache.remove("PROJECT_REPS_V1");
      Service_Cache.remove("CACHE_REPS_V6_DYNAMIC");
      Service_Cache.remove("SYSTEM_USERS");
      Service_Cache.remove("SCHEMA_PACKAGE_LOG_V4");
      Service_Cache.remove("SCHEMA_PACKAGE_LOG_V5");
    }
    return {
      success: true,
      message: "ซ่อมหัวตารางไฟล์โปรเจกต์เรียบร้อยแล้ว",
      columnCount: PROJECT_SHEET_HEADERS[SHEET_NAMES.PACKAGE_LOG].length,
      staffNameNormalization: staffNameNormalization,
      legacyValueNormalization: legacyValueNormalization,
      updated: updated,
      warnings: warnings
    };
  } catch (e) {
    return { success: false, error: e.message, updated: updated, warnings: warnings };
  } finally {
    try { lock.releaseLock(); } catch (releaseErr) {}
  }
}

function _removeHeaderProtections(sheet, warnings) {
  var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  protections.forEach(function(p) {
    try {
      var range = p.getRange();
      var isHeaderProtection = p.getDescription() === "LOCK_HEADER" || range.getRow() === 1;
      if (isHeaderProtection && p.canEdit()) p.remove();
    } catch (e) {
      warnings.push(sheet.getName() + ": remove protection failed - " + e.message);
    }
  });
}

function _normalizePackageLogStaffNameColumns(sheet, warnings) {
  var result = { updatedCells: 0, columns: [] };
  if (!sheet || sheet.getLastRow() < 2) return result;

  try {
    var users = typeof AdminService !== "undefined" && AdminService.getUsers ? AdminService.getUsers() : [];
    var userMap = {};
    users.forEach(function(user) {
      var email = String(user.Email || "").trim().toLowerCase();
      var fullName = String(user.FullName || "").trim();
      if (email && fullName && fullName.toLowerCase() !== email) userMap[email] = fullName;
    });
    if (Object.keys(userMap).length === 0) return result;

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var targets = [
      { label: "จนท.ผู้นำจ่าย", keys: ["จนท.ผู้นำจ่าย", "Staff", "Deliverer"] },
      { label: "ผู้บันทึก", keys: ["ผู้บันทึก", "จนท.ผู้บันทึก", "Created By", "Recorder"] },
      { label: "ผู้อัปเดตล่าสุด", keys: ["ผู้อัปเดตล่าสุด", "Updated By", "Last Updated By"] }
    ];

    targets.forEach(function(target) {
      var idx = getHeaderIndex(headers, target.keys);
      if (idx === -1) return;
      result.columns.push(target.label);
      var values = sheet.getRange(2, idx + 1, lastRow - 1, 1).getValues();
      values.forEach(function(row, offset) {
        var current = String(row[0] || "").trim();
        var normalized = current.toLowerCase();
        if (userMap[normalized]) {
          sheet.getRange(offset + 2, idx + 1).setValue(userMap[normalized]);
          result.updatedCells++;
        }
      });
    });
  } catch (e) {
    warnings.push("Package_Log: normalize staff names failed - " + e.message);
  }
  return result;
}

function normalizePackageLogStaffNames() {
  var warnings = [];
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL || SPREADSHEET_ID);
  var sheet = _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) || ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
  return _normalizePackageLogStaffNameColumns(sheet, warnings);
}

function _canonicalPackageType(value) {
  var text = String(value || "").trim();
  if (!text) return text;
  var lower = text.toLowerCase();
  if (lower === "ems" || text.indexOf("ด่วนพิเศษ") > -1 || lower.indexOf("express") > -1) return "ไปรษณีย์ด่วนพิเศษ (EMS)";
  if (lower === "reg" || lower.indexOf("registered") > -1 || text.indexOf("ลงทะเบียน") > -1) return "ไปรษณีย์ลงทะเบียน";
  if (text.indexOf("ธรรมดา") > -1 || lower === "ord" || lower.indexOf("ordinary") > -1) return "ไปรษณีย์ธรรมดา";
  return text;
}

function _canonicalDeliveryMethod(value) {
  var text = String(value || "").trim();
  if (!text || text === "-") return text;
  if (text === "ส่งมอบที่หน่วยงาน") return text;
  if (text.indexOf("หน่วยงาน") > -1 || text.indexOf("นำจ่าย") > -1 || text.indexOf("เคาน์เตอร์") > -1 || text.indexOf("เซ็นรับ") > -1) {
    return "ส่งมอบที่หน่วยงาน";
  }
  return text;
}

function _canonicalUseType(value) {
  var text = String(value || "").trim();
  if (!text || text === "-") return text;
  var lower = text.toLowerCase();
  if (text === "ส่วนบุคคล" || text === "งานมหาวิทยาลัย") return text;
  if (text.indexOf("ส่วนตัว") > -1 || text.indexOf("ส่วนบุคคล") > -1 || lower.indexOf("personal") > -1) return "ส่วนบุคคล";
  if (text.indexOf("มหาวิทยาลัย") > -1 || text.indexOf("งาน") > -1 || lower.indexOf("work") > -1) return "งานมหาวิทยาลัย";
  return text;
}

function _imageFormulaUrl(formula) {
  var match = String(formula || "").match(/^=IMAGE\("([^"]+)"/i);
  return match ? match[1] : "";
}

function _signatureFormulaForValue(value, rowNumber) {
  var text = String(value || "").trim();
  if (!text) return "";
  if (text.indexOf("data:image") === 0 && typeof Service_Utils !== "undefined" && Service_Utils.saveBase64ToDrive) {
    var url = Service_Utils.saveBase64ToDrive(text, "signature_migration_row_" + rowNumber);
    return url ? '=IMAGE("' + url.replace(/"/g, '""') + '")' : "";
  }
  if (/^https?:\/\//i.test(text)) {
    return '=IMAGE("' + text.replace(/"/g, '""') + '")';
  }
  return "";
}

function _normalizePackageLogLegacyValues(sheet, warnings) {
  var result = { updatedCells: 0, signatureImages: 0 };
  if (!sheet || sheet.getLastRow() < 2) return result;

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var range = sheet.getRange(1, 1, lastRow, lastCol);
    var values = range.getValues();
    var formulas = range.getFormulas();
    var headers = values[0];
    var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type", "Type"]);
    var methodIdx = getHeaderIndex(headers, ["วิธีการส่งมอบ", "Method"]);
    var useTypeIdx = getHeaderIndex(headers, ["ประเภทการใช้", "Use Type"]);
    var signIdx = getHeaderIndex(headers, ["ลายเซ็น", "Signature"]);

    for (var r = 1; r < values.length; r++) {
      if (typeIdx > -1) {
        var nextType = _canonicalPackageType(values[r][typeIdx]);
        if (nextType !== values[r][typeIdx]) {
          sheet.getRange(r + 1, typeIdx + 1).setValue(nextType);
          result.updatedCells++;
        }
      }
      if (methodIdx > -1) {
        var nextMethod = _canonicalDeliveryMethod(values[r][methodIdx]);
        if (nextMethod !== values[r][methodIdx]) {
          sheet.getRange(r + 1, methodIdx + 1).setValue(nextMethod);
          result.updatedCells++;
        }
      }
      if (useTypeIdx > -1) {
        var nextUseType = _canonicalUseType(values[r][useTypeIdx]);
        if (nextUseType !== values[r][useTypeIdx]) {
          sheet.getRange(r + 1, useTypeIdx + 1).setValue(nextUseType);
          result.updatedCells++;
        }
      }
      if (signIdx > -1 && !_imageFormulaUrl(formulas[r][signIdx])) {
        var signatureFormula = _signatureFormulaForValue(values[r][signIdx], r + 1);
        if (signatureFormula) {
          sheet.getRange(r + 1, signIdx + 1).setFormula(signatureFormula);
          sheet.setRowHeight(r + 1, 96);
          result.signatureImages++;
        }
      }
    }

    if (signIdx > -1) sheet.setColumnWidth(signIdx + 1, 180);
  } catch (e) {
    warnings.push("Package_Log: normalize legacy values failed - " + e.message);
  }
  return result;
}

function normalizePackageLogLegacyValues() {
  var warnings = [];
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL || SPREADSHEET_ID);
  var sheet = _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) || ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
  return _normalizePackageLogLegacyValues(sheet, warnings);
}

function _lockHeaderRange(sheet, headerColumnCount, warnings) {
  try {
    var me = Session.getEffectiveUser().getEmail();
    var protection = sheet.getRange(1, 1, 1, Math.max(1, headerColumnCount)).protect().setDescription("LOCK_HEADER");
    protection.removeEditors(protection.getEditors());
    protection.addEditor(me);
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
  } catch (e) {
    warnings.push(sheet.getName() + ": lock header failed - " + e.message);
  }
}



/**
 * --- LOKI MAINTENANCE ENGINE: AUTO-SHARD & ARCHIVE ---
 */

// Get Shards from Script Properties (Permanent Dynamic Storage)
function _getShardRegistry() {
  var props = PropertiesService.getScriptProperties();
  var registry = props.getProperty("DB_SHARDS");
  if (!registry) {
    // Initial setup: Register the current SPREADSHEET_ID as FY2569
    var initial = {"2569": SPREADSHEET_ID};
    props.setProperty("DB_SHARDS", JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(registry);
}

// Update Registry
function _updateShardRegistry(year, fileId) {
  var registry = _getShardRegistry();
  registry[String(year)] = fileId;
  PropertiesService.getScriptProperties().setProperty("DB_SHARDS", JSON.stringify(registry));
}

function getActiveDatabaseId(targetDate) {
  var props = PropertiesService.getScriptProperties();
  var linkedId = props.getProperty("LINKED_DB_ID");
  if (linkedId) return linkedId;

  var fy = _getCurrentFiscalYear(targetDate);
  var registry = _getShardRegistry();
  
  // If shard for this year exists, return it.
  var shardId = registry[String(fy)];
  if (shardId) return shardId;

  // T-016: Dynamic Fallback
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) return activeSs.getId();
  } catch (e) {
    console.warn("getActiveSpreadsheet failed: " + e.message);
  }

  // Try finding by name "ePostal_2026"
  var discoveredId = _findSpreadsheetIdByName("ePostal_2026");
  if (discoveredId) return discoveredId;

  return SPREADSHEET_ID;
}

/**
 * maintainDatabaseShards - THE ARCHIVER
 * Runs through the main log and moves old fiscal year data to their respective shards.
 */
function maintainDatabaseShards() {
  var activeYear = _getCurrentFiscalYear();
  var registry = _getShardRegistry();
  var mainSheet = _getSheetByCanonicalName(SpreadsheetApp.openById(SPREADSHEET_ID), SHEET_NAMES.PACKAGE_LOG);
  if (!mainSheet) return;

  var data = mainSheet.getDataRange().getValues();
  if (data.length < 2) return "No data to archive.";

  var headers = data[0];
  var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "วันที่-เวลา", "createdAt"]);
  if (dateIdx === -1) return "Date column (เวลาที่บันทึก) not found.";

  var rowsToMove = {}; // Group rows by fiscal year
  var rowsToDelete = [];

  for (var i = data.length - 1; i >= 1; i--) {
    var rowDate = data[i][dateIdx];
    if (!rowDate) continue;
    
    var rowYear = _getCurrentFiscalYear(rowDate);
    
    // If data belongs to a PREVIOUS year (Archive)
    if (rowYear < activeYear) {
      if (!rowsToMove[rowYear]) rowsToMove[rowYear] = [];
      rowsToMove[rowYear].push(data[i]);
      rowsToDelete.push(i + 1); // Store row number for deletion (1-based)
    }
  }

  // Execute Moving
  var moveCount = 0;
  for (var year in rowsToMove) {
    var targetId = registry[year];
    
    // Auto-Create Shard if missing
    if (!targetId) {
      var templateFile = DriveApp.getFileById(SPREADSHEET_ID);
      var newFile = templateFile.makeCopy("ePostal_Archive_" + year);
      targetId = newFile.getId();
      _updateShardRegistry(year, targetId);
      
      // Clean the new shard's data (keep only headers)
      var newSs = SpreadsheetApp.openById(targetId);
      var newSheet = _getSheetByCanonicalName(newSs, SHEET_NAMES.PACKAGE_LOG);
      if (newSheet.getLastRow() > 1) {
        newSheet.deleteRows(2, newSheet.getLastRow() - 1);
      }
    }

    var targetSheet = _getSheetByCanonicalName(SpreadsheetApp.openById(targetId), SHEET_NAMES.PACKAGE_LOG);
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      targetSheet.getRange(targetSheet.getLastRow() + 1, 1, rowsToMove[year].length, headers.length).setValues(rowsToMove[year]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    moveCount += rowsToMove[year].length;
  }

  // [Phase 1: Performance] Delete moved rows from Main Sheet using Contiguous Chunk Deletion
  rowsToDelete.sort(function(a, b) { return b - a; });
  var i = 0;
  while (i < rowsToDelete.length) {
    var endIndex = rowsToDelete[i];
    var startIndex = endIndex;
    // Find contiguous blocks (e.g. 100, 99, 98)
    while (i + 1 < rowsToDelete.length && rowsToDelete[i + 1] === startIndex - 1) {
      startIndex--;
      i++;
    }
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      mainSheet.deleteRows(startIndex, endIndex - startIndex + 1);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    i++;
  }

  // T-005: Update the visible Archive Index sheet with YoY Comparison Stats
  _syncArchiveIndexSheet();

  return "Archive Complete: Moved " + moveCount + " rows to historical shards.";
}

/**
 * _getCurrentFiscalYear
 * Thai Fiscal Year logic: Starts Oct (10), ends Sept (9).
 * Plus 543 for Buddhist Year.
 */
function _getCurrentFiscalYear(date) {
  var d = date ? new Date(date) : new Date();
  var month = d.getMonth() + 1; // 0-indexed
  var year = d.getFullYear();
  
  // If month is Oct, Nov, Dec -> FY is next year
  if (month >= 10) {
    return year + 543 + 1;
  }
  return year + 543;
}

/**
 * _syncArchiveIndexSheet
 * T-005 Requirement: Materializes the Shard Registry from ScriptProperties 
 * into a visible sheet for administrators, and calculates YoY totals to dodge API Quotas.
 */
function _syncArchiveIndexSheet() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = _getSheetByCanonicalName(ss, SHEET_NAMES.ARCHIVE_INDEX);
    if (!sheet) return;

    var registry = _getShardRegistry();
    var rows = [["เธเธตเธเธเธเธฃเธฐเธกเธฒเธ“", "Spreadsheet ID", "เธเธทเนเธญเนเธเธฅเน", "เธงเธฑเธเธ—เธตเนเธขเนเธฒเธขเธฅเนเธฒเธชเธธเธ”", "เธเธณเธเธงเธเนเธ–เธงเธ—เธตเนเน€เธเนเธ", "เธขเธญเธ”เธฃเธงเธกเธเธฑเธชเธ”เธธ", "เธขเธญเธ”เธชเธณเน€เธฃเนเธ"]];
    
    var statsCache = {};
    for (var fy in registry) {
      var fileId = registry[fy];
      var fileName = "Unknown";
      var totalPackages = 0;
      var completedPackages = 0;

      try {
        var shardFile = DriveApp.getFileById(fileId);
        fileName = shardFile.getName();

        // Calculate Stats for YoY Cache
        var shardSheet = _getSheetByCanonicalName(SpreadsheetApp.openById(fileId), SHEET_NAMES.PACKAGE_LOG);
        if (shardSheet && shardSheet.getLastRow() > 1) {
           var shardData = shardSheet.getDataRange().getValues();
           totalPackages = shardData.length - 1; // Exclude Header
           var statIdx = getHeaderIndex(shardData[0], ["สถานะ", "status"]);
           if (statIdx > -1) {
             for (var r = 1; r < shardData.length; r++) {
               var sText = String(shardData[r][statIdx]).trim();
               if (sText === "ส่งมอบแล้ว" || sText === "จ่ายแล้ว" || sText === "จ่ายสำเร็จ" || sText === "สำเร็จ") {
                 completedPackages++;
               }
             }
           }
        }
      } catch(fErr) {
        Logger.log("Shard Access Error for FY " + fy + ": " + fErr.message);
      }
      
      statsCache[fy] = { total: totalPackages, completed: completedPackages };

      rows.push([
        fy, 
        fileId, 
        fileName, 
        fy === String(_getCurrentFiscalYear()) ? "ACTIVE" : Service_Utils.formatThaiDateTime(new Date()),
        totalPackages,
        totalPackages,
        completedPackages
      ]);
    }

    // Persist Cache globally for extreme fast Dashboard load
    PropertiesService.getScriptProperties().setProperty("YOY_STATS_CACHE", JSON.stringify(statsCache));

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      sheet.clear();
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    _protectHeaders(ss);
  } catch(e) {
    Logger.log("Archive Index Sync Error: " + e.message);
  }
}
// Ensure backward compatibility for scripts calling SpreadsheetApp.getActiveSpreadsheet()
// by forcing them to use getSheet() or getActiveDatabaseId() instead in the future.


function initializeSystemSheets() {
  repairProjectSheetHeaders();
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // เนเธเนเนเธเธฅเนเธ—เธตเนเธเธณเธฅเธฑเธเน€เธเธดเธ”เธญเธขเธนเนเน€เธเนเธเธซเธฅเธฑเธ
  var centralSs;
  try {
    centralSs = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
  } catch(e) {
    console.error("Could not access Central DB, using Local for everything.");
    centralSs = ss;
  }

  // 1. เธชเธฃเนเธฒเธ Header เธชเธณเธซเธฃเธฑเธเธเธตเธ—เธ•เนเธฒเธเน (เธ เธฒเธฉเธฒเนเธ—เธข 100%)
  _setupSheet(ss, SHEET_NAMES.LOGS_AUDIT, ["เธงเธฑเธ-เน€เธงเธฅเธฒ", "เธเธนเนเธ”เธณเน€เธเธดเธเธเธฒเธฃ", "เธเธฒเธฃเธเธฃเธฐเธ—เธณ", "เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”", "เธซเธกเธฒเธขเน€เธซเธ•เธธ"]);
  _setupSheet(ss, SHEET_NAMES.CONFIG, ["เธเธทเนเธญเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ (Key)", "เธเนเธฒเธ—เธตเนเธ•เธฑเนเธเนเธงเน (Value)", "เธเธณเธญเธเธดเธเธฒเธข"]);
  // 1. เธชเธฃเน‰เธฒเธ‡ Header เธชเธณเธซเธฃเธฑเธšเธŠเธตเธ—เธ•เนˆเธฒเธ‡เน† (เธ เธฒเธฉเธฒเน„เธ—เธข 100%)
  _setupSheet(ss, SHEET_NAMES.LOGS_AUDIT, ["เธงเธฑเธ™-เน€เธงเธฅเธฒ", "เธœเธนเน‰เธ”เธณเน€เธ™เธดเธ™เธ เธฒเธฃ", "เธ เธฒเธฃเธ เธฃเธฐเธ—เธณ", "เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”", "เธซเธกเธฒเธขเน€เธซเธ•เธธ"]);
  _setupSheet(ss, SHEET_NAMES.CONFIG, ["เธŠเธทเนˆเธญเธ เธฒเธฃเธ•เธฑเน‰เธ‡เธ„เนˆเธฒ (Key)", "เธ„เนˆเธฒเธ—เธตเนˆเธ•เธฑเน‰เธ‡เธ„เนˆเธฒ (Value)", "เธ„เธณเธญเธ˜เธดเธšเธฒเธข"]);
  _setupSheet(ss, SHEET_NAMES.FEEDBACK_LOG, ["เธงเธฑเธ™-เน€เธงเธฅเธฒ", "เธญเธตเน€เธกเธฅเธœเธนเน‰เธชเนˆเธ‡", "เธซเธฑเธงเธ‚เน‰เธญ", "เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”", "เธ„เธฐเน เธ™เธ™เธ„เธงเธฒเธกเธžเธถเธ‡เธžเธญเนƒเธˆ"]);
  _setupSheet(ss, SHEET_NAMES.ANNOUNCEMENTS, ["เธฅเธณเธ”เธฑเธš", "เธงเธฑเธ™เธ—เธตเนˆ", "เธซเธฑเธงเธ‚เน‰เธญเธ›เธฃเธฐเธ เธฒเธจ", "เน€เธ™เธทเน‰เธญเธซเธฒ", "เธชเธ–เธฒเธ™เธฐ (เน เธชเธ”เธ‡/เธ‹เนˆเธญเธ™)"]);
  
  // T-005: Archive Index Materialization (Extended YoY Schema)
  _setupSheet(ss, SHEET_NAMES.ARCHIVE_INDEX, ["เธ›เธตเธ‡เธšเธ›เธฃเธฐเธกเธฒเธ“", "Spreadsheet ID", "เธŠเธทเนˆเธญเน„เธŸเธฅเนŒ", "เธงเธฑเธ™เธ—เธตเนˆเธขเน‰เธฒเธขเธฅเนˆเธฒเธชเธธเธ”", "เธˆเธณเธ™เธงเธ™เน เธ–เธงเธ—เธตเนˆเน€เธ เน‡เธš", "เธขเธญเธ”เธฃเธงเธกเธžเธฑเธชเธ”เธธ", "เธขเธญเธ”เธชเธณเน€เธฃเน‡เธˆ"]);
  // T-Dashboard: Materialized Stats Snapshot
  _setupSheet(ss, SHEET_NAMES.SYSTEM_STATS, ["หมวดหมู่", "ตัวชี้วัด", "ค่าตัวเลข", "อัปเดตล่าสุด"]);

  // Package_Log Master Schema (v2.0.0 Blueprint Standard)
  const masterSchema = [
    "เธฃเธซเธฑเธชเธžเธฑเธชเธ”เธธ", "เน€เธฅเธ‚เธžเธฑเธชเธ”เธธ", "เธ›เธฃเธฐเน€เธ เธ—", "เธŠเธทเนˆเธญเธซเธ™เนˆเธงเธขเธ‡เธฒเธ™", "เธŠเธทเนˆเธญเธœเธนเน‰เธฃเธฑเธš", "เธชเธ–เธฒเธ™เธฐ",
    "เน€เธงเธฅเธฒเธ—เธตเนˆเธšเธฑเธ™เธ—เธถเธ ", "เน€เธงเธฅเธฒเธ—เธตเนˆเธˆเนˆเธฒเธข", "เธˆเธ™เธ—.เธœเธนเน‰เธ™เธณเธˆเนˆเธฒเธข", "เธœเธนเน‰เธฃเธฑเธšเธˆเธฃเธดเธ‡", "เธฅเธฒเธขเน€เธ‹เน‡เธ™",
    "เธฃเธนเธ›เธ เธฒเธž", "เธžเธดเธ เธฑเธ” GPS", "เธงเธดเธ˜เธตเธ เธฒเธฃเธชเนˆเธ‡เธกเธญเธš", "เธ›เธฃเธฐเน€เธ เธ—เธ เธฒเธฃเนƒเธŠเน‰", "เธซเธกเธฒเธขเน€เธซเธ•เธธ / Line"
  ];
  _setupSheet(ss, SHEET_NAMES.PACKAGE_LOG, masterSchema);

  // Seed Dynamic Schema to System Configs if missing
  const configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    const key = (typeof Service_Schema !== "undefined" && Service_Schema.PACKAGE_LOG_CONFIG_KEY) ? Service_Schema.PACKAGE_LOG_CONFIG_KEY : "SCHEMA_Package_Log";
    const exists = data.some(row => row[0] === key);
    if (!exists) {
      configSheet.appendRow([
        key, 
        JSON.stringify(masterSchema), 
        "Database Schema Blueprint for Package_Log (16 Columns)"
      ]);
    }
  }
  
  // เนเธชเนเธ•เธฑเธงเธญเธขเนเธฒเธเธเธฃเธฐเธเธฒเธจเธ–เนเธฒเธขเธฑเธเนเธกเนเธกเธต
  var annSheet = ss.getSheetByName(SHEET_NAMES.ANNOUNCEMENTS);
  if (annSheet && annSheet.getLastRow() === 1) {
    annSheet.appendRow([1, new Date(), "เธขเธดเธเธ”เธตเธ•เนเธญเธเธฃเธฑเธเธชเธนเน DCG Smart ePostal", "เธฃเธฐเธเธเธเธฃเนเธญเธกเนเธเนเธเธฒเธเธชเธณเธซเธฃเธฑเธเธเธฒเธฃเธเธฑเธ”เธเธฒเธฃเนเธเธฃเธฉเธ“เธตเธขเนเธ เธฑเธ“เธ‘เนเธ เธฒเธขเนเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเนเธงเธเธฃเธฑเธ", "เนเธชเธ”เธ"]);
  }
  
  // เธชเธฃเนเธฒเธ/เธ•เธฃเธงเธเธชเธญเธเธเธตเธ—เธเธนเนเนเธเนเธเธฒเธเนเธ Central DB
  if (centralSs) {
    _setupSheet(ss, SHEET_NAMES.USERS, ["เธฃเธซเธฑเธชเธเธเธฑเธเธเธฒเธ", "เธญเธตเน€เธกเธฅ (Google)", "เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ", "เธชเธดเธ—เธเธดเน (Admin/User/Postal)", "เธซเธเนเธงเธขเธเธฒเธ"]);
  }

  // 2. เธ•เธฑเนเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเธชเธณเธซเธฃเธฑเธ GEMINI_API_KEY เนเธเธเธตเธ—เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ (เนเธเนเธ•เธฑเธงเนเธเธฃเน€เธ”เธดเธก)
  if (configSheet && configSheet.getLastRow() === 1) {
    configSheet.appendRow(["GEMINI_API_KEY", "", "เธฃเธซเธฑเธช API เธชเธณเธซเธฃเธฑเธเนเธเนเธเธฒเธเธฃเธฐเธเธเธชเนเธเธเธเธฑเธชเธ”เธธ AI (Gemini 1.5 Flash)"]);
  }

  // 3. เธ•เธฑเนเธเธเนเธฒ Conditional Formatting เธชเธณเธซเธฃเธฑเธ Package_Log (เธชเธตเธเนเธเธเธญเธเธชเธ–เธฒเธเธฐ)
  _setupStatusColors(_getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG));

  // 4. เธฅเนเธญเธเธซเธฑเธงเธเธญเธฅเธฑเธกเธเน (เนเธ–เธงเธ—เธตเน 1) เธ—เธธเธเธเธตเธ— เธซเนเธฒเธกเนเธเนเนเธเน€เธ”เนเธ”เธเธฒเธ”
  _protectHeaders(ss);
  if (centralSs !== ss) _protectHeaders(centralSs);
}

function _setupSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    try {
      sheet = ss.insertSheet(name);
    } catch(e) {
      console.error("Could not insert sheet: " + name);
      return;
    }
  }
  
  // ตรวจสอบข้อมูลในแถวที่ 1
  var firstCell = sheet.getRange("A1").getValue();
  
  // ถ้าแถวที่ 1 ว่าง หรือไม่มีหัวตาราง ให้บังคับเขียน
  if (!firstCell || firstCell === "") {
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setBackground("#1e293b") // เธชเธตเธเนเธณเน€เธเธดเธเน€เธเนเธกเน€เธเนเธกเธเธฃเธถเธก
      .setFontColor("white")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    
    sheet.setFrozenRows(1);
    // เธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธฅเธฑเธกเธเนเนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด
    try {
      sheet.autoResizeColumns(1, headers.length);
    } catch(e) {
      console.warn("autoResizeColumns failed: " + e.message);
    }
  }
}

function _setupStatusColors(sheet) {
  if (!sheet) return;
  if (typeof Service_Schema !== "undefined" && Service_Schema.setupStatusConditionalFormatting) {
    Service_Schema.setupStatusConditionalFormatting();
    return;
  }
  var lastRow = sheet.getMaxRows();
  if (lastRow < 2) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  // เธเนเธเธซเธฒเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ (เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธเนเธ—เธขเนเธฅเธฐเธญเธฑเธเธเธคเธฉ)
  var statusCol = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]);
    if (h.includes("เธชเธ–เธฒเธเธฐ") || h.includes("Status")) {
      statusCol = i + 1;
      break;
    }
  }
  
  if (statusCol === -1) return;

  var range = sheet.getRange(2, statusCol, lastRow - 1, 1);
  
  sheet.clearConditionalFormatRules();
  var rules = [];

  var statusMap = {
    "เธฃเธญเธเนเธฒเธข": "#fef3c7",      
    "เธชเนเธเธกเธญเธเนเธฅเนเธง": "#dcfce7",  
    "เธเนเธฒเธขเนเธฅเนเธง": "#dcfce7",    
    "เธกเธตเธเธฑเธเธซเธฒ/เธ•เธตเธเธฅเธฑเธ": "#fee2e2" 
  };

  for (var status in statusMap) {
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(statusMap[status])
      .setRanges([range])
      .build();
    rules.push(rule);
  }
  sheet.setConditionalFormatRules(rules);
}

function _protectHeaders(ss) {
  var sheets = ss.getSheets();
  var me = Session.getEffectiveUser().getEmail();
  
  sheets.forEach(function(s) {
    var lastCol = Math.max(1, s.getLastColumn());
    var range = s.getRange(1, 1, 1, lastCol);
    
    // เธ•เธฃเธงเธเธชเธญเธ Protection เน€เธ”เธดเธก
    var protections = s.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    var protection;
    
    // เธ–เนเธฒเธกเธตเธญเธขเธนเนเนเธฅเนเธงเนเธซเนเนเธเนเธ•เธฑเธงเน€เธ”เธดเธก เธ–เนเธฒเนเธกเนเธกเธตเนเธซเนเธชเธฃเนเธฒเธเนเธซเธกเน
    var existing = protections.filter(function(p) { return p.getDescription() === 'LOCK_HEADER'; });
    if (existing.length > 0) {
      protection = existing[0];
    } else {
      protection = range.protect().setDescription('LOCK_HEADER');
    }
    
    // เธ•เธฑเนเธเธเนเธฒเธชเธดเธ—เธเธดเน: เธญเธเธธเธเธฒเธ•เน€เธเธเธฒเธฐเน€เธฃเธฒ (เธฃเธฐเธเธ)
    protection.removeEditors(protection.getEditors());
    protection.addEditor(me);
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  });
}



/**
 * _findSheetRobust [Resilience]
 * Finds a sheet by exact name. If not found, searches using fallback keywords to prevent index hardcoding errors.
 */
function _findSheetRobust(ss, exactName, fallbackKeywords) {
  var sheet = ss.getSheetByName(exactName);
  if (sheet) return sheet;
  
  var sheets = ss.getSheets();
  var keywords = Array.isArray(fallbackKeywords) ? fallbackKeywords : [fallbackKeywords];
  
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toLowerCase();
    if (keywords.some(k => name.includes(k.toLowerCase()))) {
      console.log("Fallback matched: " + exactName + " -> " + sheets[i].getName());
      return sheets[i];
    }
  }
  return null;
}

function _getLegacySheetName(sheetName) {
  for (var key in SHEET_NAMES) {
    if (SHEET_NAMES[key] === sheetName && LEGACY_SHEET_NAMES[key]) {
      return LEGACY_SHEET_NAMES[key];
    }
  }
  return null;
}

function _getSheetByCanonicalName(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  var legacyName = _getLegacySheetName(sheetName);
  if (legacyName) return ss.getSheetByName(legacyName);

  return null;
}

function getData(sheetName) {
  if (sheetName === SHEET_NAMES.DEPTS) return getCentralDepts();
  if (sheetName === SHEET_NAMES.PERSONNEL) return getCentralPersonnel();
  if (sheetName === SHEET_NAMES.POSITIONS) return getCentralPositions();
  if (sheetName === SHEET_NAMES.REPS) return getCentralReps();
  
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getCentralDepts() {
  var cacheKey = "CACHE_DEPTS_V3_REPAIRED";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = _findSheetRobust(ss, SHEET_NAMES.DEPTS, ["หน่วยงาน"]);

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    // Explicitly exclude "เธฃเธซเธฑเธชเธซเธเนเธงเธขเธเธฒเธ" from "เธซเธเนเธงเธขเธเธฒเธ" search
    let idIdx = headers.findIndex(h => h.includes("รหัส") && (h.includes("หน่วยงาน") || h.includes("แผนก") || h.includes("ศูนย์")));
    if (idIdx === -1) idIdx = headers.findIndex(h => h.includes("deptid") || h.includes("departmentid") || h.includes("รหัสแผนก"));
    
    let tempHeaders = [...headers];
    if (idIdx > -1) tempHeaders[idIdx] = "";
    
    // Find the name column, being careful not to match "เธเธทเนเธญเธเธนเนเธเธฃเธฐเธชเธฒเธเธเธฒเธ" or "เธเธทเนเธญเธขเนเธญ"
    let nameIdx = tempHeaders.findIndex(h => h === "หน่วยงาน" || h === "คณะ/ส่วนงาน" || h === "ชื่อหน่วยงาน" || h === "แผนก" || h === "ชื่อแผนก");
    if (nameIdx === -1) nameIdx = tempHeaders.findIndex(h => h.includes("ชื่อหน่วยงาน") || h.includes("ชื่อแผนก"));
    if (nameIdx === -1) nameIdx = tempHeaders.findIndex(h => (h.includes("หน่วยงาน") || h.includes("แผนก") || h.includes("ส่วนงาน")) && !h.includes("รหัส") && !h.includes("เบอร์") && !h.includes("โทร"));
    
    const buildIdx = headers.findIndex(h => h.includes("building") || h.includes("อาคาร") || h.includes("ตึก"));
    const floorIdx = headers.findIndex(h => h.includes("floor") || h.includes("ชั้น"));

    const finalIdIdx = idIdx > -1 ? idIdx : 0;
    const finalNameIdx = nameIdx > -1 ? nameIdx : 1; // Fallback to index 1 which was proven to work
    const finalBuildIdx = buildIdx > -1 ? buildIdx : 2;
    const finalFloorIdx = floorIdx > -1 ? floorIdx : 3;

    const result = data.slice(1).map((row) => {
      let deptName = String(row[finalNameIdx] || "").trim();
      let deptId = String(row[finalIdIdx] || "").trim();
      return {
        DeptID: deptId || deptName,
        DeptName: deptName,
        Building: String(row[finalBuildIdx] || "").trim(),
        Floor: String(row[finalFloorIdx] || "").trim(),
      };
    }).filter(i => i.DeptName !== "");
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { return []; }
}

function getCentralPersonnel() {
  var cacheKey = "CACHE_PERSONNEL_V6_DYNAMIC";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = _findSheetRobust(ss, SHEET_NAMES.PERSONNEL, ["พนักงาน", "Personnel", "รายชื่อพนักงาน"]);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0];
    const emailIdx = getHeaderIndex(headers, ["อีเมล", "Email", "Gmail"]);
    const nameIdx = getHeaderIndex(headers, ["ชื่อ-นามสกุล", "ชื่อนามสกุล", "Name", "Full Name", "พนักงาน"]);
    const deptIdx = getHeaderIndex(headers, ["รหัสหน่วยงาน", "DeptID", "DepartmentID", "รหัสแผนก", "หน่วยงาน"]);

    // Fallback logic if headers not found (using old indices as last resort)
    const finalEmailIdx = emailIdx > -1 ? emailIdx : 0;
    const finalNameIdx = nameIdx > -1 ? nameIdx : 1;
    const finalDeptIdx = deptIdx > -1 ? deptIdx : 2;

    const result = data.slice(1).map((row) => {
      const fullName = String(row[finalNameIdx] || "").trim();
      if (!fullName) return null;
      return {
        Email: String(row[finalEmailIdx] || "").trim(),
        FullName: fullName,
        DeptID: String(row[finalDeptIdx] || "").trim(),
        Department: "" 
      };
    }).filter(i => i !== null);
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { 
    console.error("getCentralPersonnel Error: " + e.message);
    return []; 
  }
}

function getCentralPositions() {
  var cacheKey = "CACHE_POSITIONS_V6_DYNAMIC";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = _findSheetRobust(ss, SHEET_NAMES.POSITIONS, ["ตำแหน่งบริหาร", "Positions", "รายชื่อตำแหน่ง"]);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0];
    const deptIdx = getHeaderIndex(headers, ["รหัสหน่วยงาน", "DeptID", "DepartmentID", "รหัสแผนก", "หน่วยงาน"]);
    const posIdx = getHeaderIndex(headers, ["ชื่อตำแหน่ง", "ตำแหน่ง", "Position", "Job Title"]);

    const finalDeptIdx = deptIdx > -1 ? deptIdx : 0;
    const finalPosIdx = posIdx > -1 ? posIdx : 1;

    const result = data.slice(1).map((row) => {
      const posName = String(row[finalPosIdx] || "").trim();
      if (!posName) return null;
      return {
        DeptID: String(row[finalDeptIdx] || "").trim(),
        PositionName: posName
      };
    }).filter(i => i !== null);
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { 
    console.error("getCentralPositions Error: " + e.message);
    return []; 
  }
}

function getCentralReps() {
  var cacheKey = "PROJECT_REPS_V1";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL || SPREADSHEET_ID);
    const sheet = _findSheetRobust(ss, SHEET_NAMES.REPS, ["ตัวแทนรับไปรษณีย์ภัณฑ์", "ตัวแทนรับพัสดุ", "ตัวแทน", "Representatives", "Reps"]);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0];
    const emailIdx = getHeaderIndex(headers, ["อีเมล", "Email", "Gmail"]);
    const nameIdx = getHeaderIndex(headers, ["ชื่อ-นามสกุล", "ชื่อนามสกุล", "Name", "Full Name", "ตัวแทน"]);
    const deptIdx = getHeaderIndex(headers, ["รหัสหน่วยงาน", "DeptID", "DepartmentID", "รหัสแผนก", "หน่วยงาน"]);
    const deptNameIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department", "DeptName"]);
    const statusIdx = getHeaderIndex(headers, ["สถานะ", "Status", "Active"]);
    const phoneIdx = getHeaderIndex(headers, ["เบอร์โทร", "โทรศัพท์", "Phone", "Tel"]);
    const lineIdx = getHeaderIndex(headers, ["Line ID", "LINE", "ไลน์"]);
    const noteIdx = getHeaderIndex(headers, ["หมายเหตุ", "Note"]);

    const finalEmailIdx = emailIdx > -1 ? emailIdx : 0;
    const finalNameIdx = nameIdx > -1 ? nameIdx : 1;
    const finalDeptIdx = deptIdx > -1 ? deptIdx : 2;

    const result = data.slice(1).map((row) => {
      const fullName = String(row[finalNameIdx] || "").trim();
      if (!fullName) return null;
      return {
        Email: String(row[finalEmailIdx] || "").trim(),
        FullName: fullName,
        DeptID: String(row[finalDeptIdx] || "").trim(),
        Department: deptNameIdx > -1 ? String(row[deptNameIdx] || "").trim() : "",
        Status: statusIdx > -1 ? String(row[statusIdx] || "").trim() : "ใช้งาน",
        Phone: phoneIdx > -1 ? String(row[phoneIdx] || "").trim() : "",
        LineID: lineIdx > -1 ? String(row[lineIdx] || "").trim() : "",
        Note: noteIdx > -1 ? String(row[noteIdx] || "").trim() : ""
      };
    }).filter(function(i) {
      return i !== null && (!i.Status || i.Status === "ใช้งาน" || String(i.Status).toLowerCase() === "active");
    });
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { 
    console.error("getCentralReps Error: " + e.message);
    return []; 
  }
}

/**
 * getSchema [Resilience]
 * Loads schema for a sheet from System_Configs if available.
 */
function getSchema(sheetName) {
  try {
    const ssId = getActiveDatabaseId();
    const ss = SpreadsheetApp.openById(ssId);
    const configSheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIGS);
    if (!configSheet) return null;
    
    const data = configSheet.getDataRange().getValues();
    const key = "SCHEMA_" + sheetName;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        try {
          return JSON.parse(data[i][1]);
        } catch(pErr) {
          // If not JSON, maybe comma separated?
          return String(data[i][1]).split(",").map(s => s.trim());
        }
      }
    }
  } catch (e) {
    console.error("Error loading schema for " + sheetName + ": " + e.message);
  }
  return null;
}

/**
 * ensureHeadersSync [Resilience]
 * Compares current headers with desired schema. 
 * Inserts missing columns at the end to prevent data shifting.
 */
function ensureHeadersSync(sheet, desiredHeaders) {
  if (!sheet) return;
  const lastCol = sheet.getLastColumn();
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, lastCol)).getValues()[0];
  
  // 1. Healing: Add missing columns
  const missing = desiredHeaders.filter(h => getHeaderIndex(currentHeaders, h) === -1);
  if (missing.length > 0) {
    console.log(`Healing headers for ${sheet.getName()}: Adding ${missing.join(", ")}`);
    const startCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, startCol, 1, missing.length)
      .setValues([missing])
      .setBackground("#1e293b")
      .setFontColor("white")
      .setFontWeight("bold");
  }

  // 2. Hardening: Truncate extra columns [TDD GREEN Phase]
  // Note: We check again after healing in case columns were added
  const finalColCount = sheet.getLastColumn();
  if (finalColCount > desiredHeaders.length) {
    console.warn(`Schema warning for ${sheet.getName()}: ${finalColCount - desiredHeaders.length} extra columns detected. Runtime will not delete columns.`);
  }
}

/**
 * getSheet [GLOBAL DISPATCHER]
 * T-005 Component: Routes database requests to the correct physical Spreadsheet.
 */
function getSheet(sheetName, targetDate, options) {
  try {
    var ssId;
    if (isCentralSheet(sheetName)) {
      ssId = SPREADSHEET_IDS.CENTRAL;
    } else {
      ssId = getActiveDatabaseId(targetDate);
    }
    
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = _getSheetByCanonicalName(ss, sheetName);
    
    // Safety Fallback for Users sheet naming variations
    if (!sheet && isCentralSheet(sheetName)) {
      if (sheetName === SHEET_NAMES.USERS) {
        sheet = ss.getSheetByName("Personnel") || ss.getSheets()[0];
      }
    }

    // Auto-Heal Package_Log headers if necessary (v4.0.2 Thai Standard)
    // [HARDENED] Always use the canonical 16-column schema.
    // DO NOT use getSchema() here โ€” it pulls stale 33-col schema from System_Configs
    // which causes phantom black columns (Q-AG) to reappear on every page load.
    if (sheet && sheetName === SHEET_NAMES.PACKAGE_LOG) {
      if (!options || !options.skipSchemaValidation) {
        var validation = Service_Schema.validatePackageLogSheet(sheet);
        if (!validation.valid) {
          throw new Error("Package_Log schema mismatch: " + validation.error);
        }
      }
    }
    
    return sheet;
  } catch (e) {
    Logger.log("getSheet Dispatch Error: " + e.message + " for " + sheetName);
    if (sheetName === SHEET_NAMES.PACKAGE_LOG && String(e.message).indexOf("Package_Log schema mismatch") > -1) {
      throw e;
    }
    return _getSheetByCanonicalName(SpreadsheetApp.getActiveSpreadsheet(), sheetName);
  }
}

function isCentralSheet(name) {
  var centralNames = [
    SHEET_NAMES.PERSONNEL, 
    SHEET_NAMES.DEPTS, 
    SHEET_NAMES.POSITIONS
  ];
  return centralNames.indexOf(name) !== -1;
}

