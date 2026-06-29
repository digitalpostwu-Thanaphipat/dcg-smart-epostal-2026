/**
 * Debug_Search.gs - Diagnostic tool
 * Run this from GAS Script Editor to see exactly what the search sees.
 */
function debugSearchDiagnostic() {
  var results = [];
  
  try {
    // 1. Check SPREADSHEET_ID
    results.push("=== SPREADSHEET_ID ===");
    results.push("SPREADSHEET_ID: " + SPREADSHEET_ID);
    results.push("ID Length: " + SPREADSHEET_ID.length);
    
    // 2. Open the spreadsheet
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    results.push("Spreadsheet Name: " + ss.getName());
    
    // 3. Get the sheet
    var sheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) : (ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG) || ss.getSheetByName("Package_Log"));
    if (!sheet) {
      results.push("❌ FATAL: Sheet '" + SHEET_NAMES.PACKAGE_LOG + "' NOT FOUND!");
      results.push("Available sheets: " + ss.getSheets().map(s => s.getName()).join(", "));
      Logger.log(results.join("\n"));
      return results.join("\n");
    }
    results.push("Sheet Name: " + sheet.getName());
    results.push("Last Row: " + sheet.getLastRow());
    results.push("Last Column: " + sheet.getLastColumn());
    
    // 4. Get all data
    var data = sheet.getDataRange().getValues();
    results.push("Data Rows (including header): " + data.length);
    
    // 5. Headers
    var headers = data[0];
    results.push("\n=== HEADERS ===");
    for (var h = 0; h < headers.length; h++) {
      results.push("  Col " + h + ": [" + headers[h] + "] (type: " + typeof headers[h] + ")");
    }
    
    // 6. Header Index Resolution
    results.push("\n=== INDEX RESOLUTION ===");
    var idIdx = getHeaderIndex(headers, ["รหัสพัสดุ", "Package ID", "ID"]);
    var trackIdx = getHeaderIndex(headers, ["เลขพัสดุ", "Tracking No", "Tracking Number"]);
    var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type", "Type"]);
    var recIdx = getHeaderIndex(headers, ["ชื่อผู้รับ", "Receiver Name", "Recipient Name"]);
    var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department", "Dept Name"]);
    var statusIdx = getHeaderIndex(headers, ["สถานะ", "Status"]);
    var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Created At", "Received At"]);
    
    results.push("  idIdx: " + idIdx);
    results.push("  trackIdx: " + trackIdx);
    results.push("  typeIdx: " + typeIdx);
    results.push("  recIdx: " + recIdx);
    results.push("  deptIdx: " + deptIdx);
    results.push("  statusIdx: " + statusIdx);
    results.push("  dateIdx: " + dateIdx);
    
    // 7. Sample data rows
    results.push("\n=== DATA ROWS ===");
    for (var i = 1; i < Math.min(data.length, 10); i++) {
      var row = data[i];
      results.push("  Row " + i + ":");
      results.push("    ID: [" + row[idIdx] + "]");
      results.push("    Track: [" + row[trackIdx] + "]");
      results.push("    Type: [" + row[typeIdx] + "]");
      results.push("    Dept: [" + row[deptIdx] + "]");
      results.push("    Recv: [" + row[recIdx] + "]");
      results.push("    Status: [" + row[statusIdx] + "] (trimmed: [" + String(row[statusIdx]).trim() + "])");
      results.push("    Date: [" + row[dateIdx] + "]");
    }
    
    // 8. Test search for AS123456789TH
    results.push("\n=== SEARCH TEST: AS123456789TH ===");
    var keyword = "as123456789th";
    var found = 0;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var content = [row[idIdx], row[trackIdx], row[recIdx], row[deptIdx]].join(" ").toLowerCase();
      if (content.indexOf(keyword) !== -1) {
        found++;
        results.push("  ✅ MATCH at row " + i + ": " + row[trackIdx]);
      }
    }
    results.push("  Total matches: " + found);
    
    // 9. Test Shard Registry
    results.push("\n=== SHARD REGISTRY ===");
    var registry = typeof _getShardRegistry === "function" ? _getShardRegistry() : {};
    results.push("  Registry: " + JSON.stringify(registry));
    
    // 10. Script Properties
    results.push("\n=== SCRIPT PROPERTIES ===");
    var props = PropertiesService.getScriptProperties();
    results.push("  LOCAL_DB_ID: " + props.getProperty("LOCAL_DB_ID"));
    results.push("  CENTRAL_DB_ID: " + props.getProperty("CENTRAL_DB_ID"));
    results.push("  DB_SHARDS: " + props.getProperty("DB_SHARDS"));
    results.push("  LINKED_DB_ID: " + props.getProperty("LINKED_DB_ID"));
    
  } catch (e) {
    results.push("❌ ERROR: " + e.message);
    results.push("Stack: " + e.stack);
  }
  
  var output = results.join("\n");
  Logger.log(output);
  return output;
}
