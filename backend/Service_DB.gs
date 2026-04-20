function _findSpreadsheetIdByName(name) {
  try { var files = DriveApp.getFilesByName(name); if (files.hasNext()) { return files.next().getId(); } } catch (e) { }
  return null;
}

/**
 * Service_DB.gs - VERSION 22 (FIXED ENCODING)
 */

// --- PROFESSIONAL CONFIGURATION: CENTRAL DB ID ---
// [Loki Mode] Use script properties to avoid hardcoding (Sec 11 Compliance)
function _getCentralDbId() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("CENTRAL_DB_ID") || "1OEb6X2xKykfrBixIPpiNayyzixcKoM3iOT6xzDJ0II0";
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
  console.log("⚠️ SPREADSHEET_ID Cache Miss: Discovering...");
  let discoveredId = "";
  try {
    // Try finding by name (Dynamic lookup)
    discoveredId = typeof _findSpreadsheetIdByName === 'function' ? _findSpreadsheetIdByName("ePostal_2026") : null;
  } catch (e) {
    console.error("Discovery failed: " + e.message);
  }

  // 3. Final Fallback (Validated v4.0.2 ID)
  const finalId = (discoveredId && discoveredId.length > 40) 
    ? discoveredId 
    : "1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ";

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
    if (keywords.some(k => h.includes(k.toLowerCase()))) return i;
  }
  return -1;
}

var SHEET_NAMES = {
  USERS: "\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19\u0e23\u0e30\u0e1a\u0e1a",
  PERSONNEL: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19",
  DEPTS: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19",
  CONFIG: "\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e23\u0e30\u0e1a\u0e1a",
  POSITIONS: "\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e1a\u0e23\u0e34\u0e2b\u0e32\u0e23",
  PACKAGE_LOG: "Package_Log",
  LOGS_AUDIT: "Audit_Log",
  LOGS_ERROR: "Error_Log",
  FEEDBACK_LOG: "Feedback_Log",
  ANNOUNCEMENTS: "\u0e1b\u0e23\u0e30\u0e01\u0e32\u0e28\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a",
  SYSTEM_CONFIGS: "System_Configs"
};



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
  } catch (e) {}

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
  var mainSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.PACKAGE_LOG);
  if (!mainSheet) return;

  var data = mainSheet.getDataRange().getValues();
  if (data.length < 2) return "No data to archive.";

  var headers = data[0];
  var dateIdx = headers.indexOf("วันที่-เวลา");
  if (dateIdx === -1) return "Date column not found.";

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
      var newSheet = newSs.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
      if (newSheet.getLastRow() > 1) {
        newSheet.deleteRows(2, newSheet.getLastRow() - 1);
      }
    }

    var targetSheet = SpreadsheetApp.openById(targetId).getSheetByName(SHEET_NAMES.PACKAGE_LOG);
    targetSheet.getRange(targetSheet.getLastRow() + 1, 1, rowsToMove[year].length, headers.length).setValues(rowsToMove[year]);
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
    mainSheet.deleteRows(startIndex, endIndex - startIndex + 1);
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
    var sheet = ss.getSheetByName("Archive_Index");
    if (!sheet) return;

    var registry = _getShardRegistry();
    var rows = [["ปีงบประมาณ", "Spreadsheet ID", "ชื่อไฟล์", "วันที่ย้ายล่าสุด", "จำนวนแถวที่เก็บ", "ยอดรวมพัสดุ", "ยอดสำเร็จ"]];
    
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
        var shardSheet = SpreadsheetApp.openById(fileId).getSheetByName(SHEET_NAMES.PACKAGE_LOG);
        if (shardSheet && shardSheet.getLastRow() > 1) {
           var shardData = shardSheet.getDataRange().getValues();
           totalPackages = shardData.length - 1; // Exclude Header
           var statIdx = getHeaderIndex(shardData[0], "สถานะ");
           if (statIdx > -1) {
             for (var r = 1; r < shardData.length; r++) {
               var sText = String(shardData[r][statIdx]).trim();
               if (sText === "จ่ายแล้ว" || sText === "สำเร็จ" || sText === "ส่งมอบแล้ว") {
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

    sheet.clear();
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    _protectHeaders(ss);
  } catch(e) {
    Logger.log("Archive Index Sync Error: " + e.message);
  }
}
// Ensure backward compatibility for scripts calling SpreadsheetApp.getActiveSpreadsheet()
// by forcing them to use getSheet() or getActiveDatabaseId() instead in the future.


function initializeSystemSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // ใช้ไฟล์ที่กำลังเปิดอยู่เป็นหลัก
  var centralSs;
  try {
    centralSs = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
  } catch(e) {
    console.error("Could not access Central DB, using Local for everything.");
    centralSs = ss;
  }

  // 1. สร้าง Header สำหรับชีทต่างๆ (ภาษาไทย 100%)
  _setupSheet(ss, SHEET_NAMES.LOGS_AUDIT, ["วัน-เวลา", "ผู้ดำเนินการ", "การกระทำ", "รายละเอียด", "หมายเหตุ"]);
  _setupSheet(ss, SHEET_NAMES.CONFIG, ["ชื่อการตั้งค่า (Key)", "ค่าที่ตั้งไว้ (Value)", "คำอธิบาย"]);
  _setupSheet(ss, SHEET_NAMES.FEEDBACK_LOG, ["วัน-เวลา", "อีเมลผู้ส่ง", "หัวข้อ", "รายละเอียด", "คะแนนความพึงพอใจ"]);
  _setupSheet(ss, SHEET_NAMES.ANNOUNCEMENTS, ["ลำดับ", "วันที่", "หัวข้อประกาศ", "เนื้อหา", "สถานะ (แสดง/ซ่อน)"]);
  
  // T-005: Archive Index Materialization (Extended YoY Schema)
  _setupSheet(ss, "Archive_Index", ["ปีงบประมาณ", "Spreadsheet ID", "ชื่อไฟล์", "วันที่ย้ายล่าสุด", "จำนวนแถวที่เก็บ", "ยอดรวมพัสดุ", "ยอดสำเร็จ"]);
  
  // ใส่ตัวอย่างประกาศถ้ายังไม่มี
  var annSheet = ss.getSheetByName(SHEET_NAMES.ANNOUNCEMENTS);
  if (annSheet && annSheet.getLastRow() === 1) {
    annSheet.appendRow([1, new Date(), "ยินดีต้อนรับสู่ DCG Smart ePostal", "ระบบพร้อมใช้งานสำหรับการจัดการไปรษณีย์ภัณฑ์ภายในหน่วยงานแล้วครับ", "แสดง"]);
  }
  
  // สร้าง/ตรวจสอบชีทผู้ใช้งานใน Central DB
  if (centralSs) {
    _setupSheet(centralSs, SHEET_NAMES.USERS, ["รหัสพนักงาน", "อีเมล (Google)", "ชื่อ-นามสกุล", "สิทธิ์ (Admin/User/Postal)", "หน่วยงาน"]);
  }

  // 2. ตั้งค่าเริ่มต้นสำหรับ GEMINI_API_KEY ในชีทการตั้งค่าระบบ
  var configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (configSheet && configSheet.getLastRow() === 1) {
    configSheet.appendRow(["GEMINI_API_KEY", "", "รหัส API สำหรับใช้งานระบบสแกนพัสดุ AI (Gemini 1.5 Flash)"]);
  }

  // 3. ตั้งค่า Conditional Formatting สำหรับ Package_Log (สีบ่งบอกสถานะ)
  _setupStatusColors(ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG));

  // 4. ล็อกหัวคอลัมน์ (แถวที่ 1) ทุกชีท ห้ามแก้ไขเด็ดขาด
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
  var firstCell = sheet.getRange(1, 1).getValue();
  
  // ถ้าแถวที่ 1 ว่าง หรือไม่มีหัวตาราง ให้บังคับเขียน
  if (!firstCell || firstCell === "") {
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setBackground("#1e293b") // สีน้ำเงินเข้มเข้มขรึม
      .setFontColor("white")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    
    sheet.setFrozenRows(1);
    // ปรับขนาดคอลัมน์ให้อัตโนมัติ
    try {
      sheet.autoResizeColumns(1, headers.length);
    } catch(e) {}
  }
}

function _setupStatusColors(sheet) {
  if (!sheet) return;
  var lastRow = sheet.getMaxRows();
  if (lastRow < 2) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  // ค้นหาคอลัมน์สถานะ (รองรับทั้งไทยและอังกฤษ)
  var statusCol = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]);
    if (h.includes("สถานะ") || h.includes("Status")) {
      statusCol = i + 1;
      break;
    }
  }
  
  if (statusCol === -1) return;

  var range = sheet.getRange(2, statusCol, lastRow - 1, 1);
  
  sheet.clearConditionalFormatRules();
  var rules = [];

  var statusMap = {
    "รอจ่าย": "#fef3c7",      
    "ส่งมอบแล้ว": "#dcfce7",  
    "จ่ายแล้ว": "#dcfce7",    
    "มีปัญหา/ตีกลับ": "#fee2e2" 
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
    
    // ตรวจสอบ Protection เดิม
    var protections = s.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    var protection;
    
    // ถ้ามีอยู่แล้วให้ใช้ตัวเดิม ถ้าไม่มีให้สร้างใหม่
    var existing = protections.filter(function(p) { return p.getDescription() === 'LOCK_HEADER'; });
    if (existing.length > 0) {
      protection = existing[0];
    } else {
      protection = range.protect().setDescription('LOCK_HEADER');
    }
    
    // ตั้งค่าสิทธิ์: อนุญาตเฉพาะเรา (ระบบ)
    protection.removeEditors(protection.getEditors());
    protection.addEditor(me);
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  });
}



function isCentralSheet(sheetName) {
  var central = ["ผู้ใช้งานระบบ", "รายชื่อพนักงาน", "รายชื่อหน่วยงาน", "การตั้งค่าระบบ", "รายชื่อตำแหน่งบริหาร"];
  return central.indexOf(sheetName) > -1;
}

function getData(sheetName) {
  if (sheetName === SHEET_NAMES.DEPTS) return getCentralDepts();
  if (sheetName === SHEET_NAMES.PERSONNEL) return getCentralPersonnel();
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
  var cacheKey = "CACHE_DEPTS_V26_REFRESH";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = ss.getSheetByName(SHEET_NAMES.DEPTS) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    // Explicitly exclude "รหัสหน่วยงาน" from "หน่วยงาน" search
    let idIdx = headers.findIndex(h => h.includes("รหัส") && (h.includes("หน่วยงาน") || h.includes("แผนก") || h.includes("ศูนย์")));
    if (idIdx === -1) idIdx = headers.findIndex(h => h.includes("deptid") || h.includes("departmentid") || h.includes("รหัสแผนก"));
    
    let tempHeaders = [...headers];
    if (idIdx > -1) tempHeaders[idIdx] = "";
    
    // Find the name column, being careful not to match "ชื่อผู้ประสานงาน" or "ชื่อย่อ"
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
  var cacheKey = "CACHE_PERSONNEL_V27_REFRESH";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = ss.getSheetByName(SHEET_NAMES.PERSONNEL) || ss.getSheets()[2];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailIdx = headers.findIndex(h => h.includes("อีเมล") || h.includes("email"));
    const nameIdx = headers.findIndex(h => h.includes("ชื่อ-ชื่อสกุล") || h.includes("ชื่อ-นามสกุล") || h.includes("ชื่อ") || h.includes("fullname") || h.includes("name"));
    const deptIdx = headers.findIndex(h => h.includes("หน่วยงาน") || h.includes("คณะ") || h.includes("สังกัด") || h.includes("ส่วนงาน") || h.includes("แผนก") || h.includes("dept"));
    
    // Fallbacks
    const finalEmailIdx = emailIdx > -1 ? emailIdx : 1;
    const finalNameIdx = nameIdx > -1 ? nameIdx : 2;
    const finalDeptIdx = deptIdx > -1 ? deptIdx : 4;

    const result = data.slice(1).map((row) => ({
      Email: String(row[finalEmailIdx] || "").trim(),
      FullName: String(row[finalNameIdx] || "").trim(),
      Department: String(row[finalDeptIdx] || "").trim()
    })).filter(i => i.FullName !== "");
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { return []; }
}

function getCentralPositions() {
  var cacheKey = "CACHE_POSITIONS_V1";
  var cached = Service_Cache.get(cacheKey);
  if (cached) return cached;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const sheet = ss.getSheetByName(SHEET_NAMES.POSITIONS);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const deptIdx = headers.findIndex(h => h.includes("รหัสหน่วยงาน") || h.includes("deptid"));
    const nameIdx = headers.findIndex(h => h.includes("ชื่อตำแหน่ง") || h.includes("position"));

    // Fallbacks
    const finalDeptIdx = deptIdx > -1 ? deptIdx : 0;
    const finalNameIdx = nameIdx > -1 ? nameIdx : 1;

    const result = data.slice(1).map((row) => ({
      DeptID: String(row[finalDeptIdx] || "").trim(),
      PositionName: String(row[finalNameIdx] || "").trim()
    })).filter(i => i.PositionName !== "");
    
    Service_Cache.put(cacheKey, result, 21600);
    return result;
  } catch (e) { return []; }
}

/**
 * ensureHeadersSync [Resilience]
 * Compares current headers with desired schema. 
 * Inserts missing columns at the end to prevent data shifting.
 */
function ensureHeadersSync(sheet, desiredHeaders) {
  if (!sheet) return;
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
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
}

/**
 * getSheet [GLOBAL DISPATCHER]
 * T-005 Component: Routes database requests to the correct physical Spreadsheet.
 */
function getSheet(sheetName, targetDate) {
  try {
    var ssId;
    if (isCentralSheet(sheetName)) {
      ssId = SPREADSHEET_IDS.CENTRAL;
    } else {
      ssId = getActiveDatabaseId(targetDate);
    }
    
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName(sheetName);
    
    // Safety Fallback for Users sheet naming variations
    if (!sheet && isCentralSheet(sheetName)) {
      if (sheetName === SHEET_NAMES.USERS) {
        sheet = ss.getSheetByName("Personnel") || ss.getSheets()[0];
      }
    }

    // Auto-Heal Package_Log headers if necessary
    if (sheet && sheetName === SHEET_NAMES.PACKAGE_LOG) {
      const schema = ["รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับ", "สถานะ", "เวลาบันทึก", "เวลาจ่าย", "จนท.นำจ่าย", "ผู้รับจริง", "ลายเซ็น", "รูปภาพ", "GPS", "วิธีส่งมอบ", "ประเภทการใช้", "หมายเหตุ / สถานะ Line", "AppVersion", "Metadata"];
      ensureHeadersSync(sheet, schema);
    }
    
    return sheet;
  } catch (e) {
    Logger.log("getSheet Dispatch Error: " + e.message + " for " + sheetName);
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  }
}

function isCentralSheet(name) {
  var centralNames = [
    SHEET_NAMES.USERS, 
    SHEET_NAMES.PERSONNEL, 
    SHEET_NAMES.DEPTS, 
    SHEET_NAMES.POSITIONS
  ];
  return centralNames.indexOf(name) !== -1;
}
