/**
 * Service_Schema.gs
 * Single source of truth for runtime schema reads.
 *
 * รายการพัสดุ schema is owned by System_Configs key SCHEMA_Package_Log.
 * Runtime validation must not delete or insert columns automatically.
 */

var Service_Schema = {
  PACKAGE_LOG_CONFIG_KEY: "SCHEMA_Package_Log",
  PACKAGE_LOG_EXPECTED_LENGTH: 18,
  CACHE_TTL_SECONDS: 3600, // Increase cache TTL for production

  DEFAULT_PACKAGE_LOG_SCHEMA: [
    "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับไปรษณีย์ภัณฑ์", "สถานะ",
    "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับตามจ่าหน้า", "ลายเซ็น",
    "รูปภาพ", "พิกัด GPS", "วิธีการส่งมอบ", "ประเภทการใช้", "หมายเหตุ / Line",
    "ผู้บันทึก", "ผู้อัปเดตล่าสุด"
  ],

  DEFAULT_SYSTEM_STATS_SCHEMA: [
    "หมวดหมู่", "ตัวชี้วัด", "ค่าตัวเลข", "อัปเดตล่าสุด"
  ],

  getPackageLogSchema: function() {
    var cacheKey = "SCHEMA_PACKAGE_LOG_V5"; // Bump version
    var cached = Service_Cache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length === this.PACKAGE_LOG_EXPECTED_LENGTH) {
      return cached;
    }

    var schema = this._readSchemaFromConfig(this.PACKAGE_LOG_CONFIG_KEY);
    if (!schema) {
      schema = this.DEFAULT_PACKAGE_LOG_SCHEMA.slice();
      this.syncSchemaToConfig(schema); // Persist default if missing
    }

    var validation = this.validateSchema(schema);
    if (!validation.valid) {
      console.error("SCHEMA_Package_Log mismatch: " + validation.error);
      schema = this.DEFAULT_PACKAGE_LOG_SCHEMA.slice(); // Fallback to hardcoded truth
    }

    Service_Cache.put(cacheKey, schema, this.CACHE_TTL_SECONDS);
    return schema;
  },

  validatePackageLogSheet: function(sheet) {
    if (!sheet) return { valid: false, error: "ไม่พบชีท " + SHEET_NAMES.PACKAGE_LOG };

    var schema = this.getPackageLogSchema();
    var lastCol = Math.max(1, sheet.getLastColumn());
    
    // Read only the first 16 columns to verify core schema
    var headers = sheet.getRange(1, 1, 1, Math.min(lastCol, this.PACKAGE_LOG_EXPECTED_LENGTH)).getValues()[0].map(function(h) {
      return String(h || "").trim();
    });

    if (lastCol > this.PACKAGE_LOG_EXPECTED_LENGTH) {
      return {
        valid: false,
        error: "พบคอลัมน์เกิน (Phantom Columns): พบ " + lastCol + " คอลัมน์ (คาดหวัง " + this.PACKAGE_LOG_EXPECTED_LENGTH + ")",
        phantomDetected: true
      };
    }

    if (headers.length < this.PACKAGE_LOG_EXPECTED_LENGTH) {
      return {
        valid: false,
        error: "จำนวนคอลัมน์ไม่ครบ: พบ " + headers.length + " (คาดหวัง " + this.PACKAGE_LOG_EXPECTED_LENGTH + ")"
      };
    }

    for (var i = 0; i < schema.length; i++) {
      if (headers[i] !== schema[i]) {
        return {
          valid: false,
          error: "หัวคอลัมน์ลำดับ " + (i + 1) + " ไม่ถูกต้อง: พบ '" + headers[i] + "' (คาดหวัง '" + schema[i] + "')"
        };
      }
    }

    return { valid: true, schema: schema };
  },

  repairPackageLogHeaders: function() {
    if (typeof repairProjectSheetHeaders === "function") {
      return repairProjectSheetHeaders();
    }
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      var ssId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : SPREADSHEET_ID;
      var ss = SpreadsheetApp.openById(ssId);
      
      // 1. Repair Package_Log
      var sheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) : ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
      if (sheet) {
        var schema = this.getPackageLogSchema();
        this._forceSchemaAndDimensions(sheet, schema);
      }

      // 2. Repair System_Stats
      var statsSheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(ss, SHEET_NAMES.SYSTEM_STATS) : ss.getSheetByName(SHEET_NAMES.SYSTEM_STATS);
      if (statsSheet) {
        this._forceSchemaAndDimensions(statsSheet, this.DEFAULT_SYSTEM_STATS_SCHEMA);
      }

      // 3. Apply status-based conditional formatting
      this.setupStatusConditionalFormatting();

      return {
        success: true,
        message: "ปรับปรุงหัวตารางและขนาดชีทสำเร็จ (รายการพัสดุ: 18, สถิติระบบ: 4)",
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * [Hardening] Force schema and delete extra columns.
   * @private
   */
  _forceSchemaAndDimensions: function(sheet, schema) {
    // Set headers
    sheet.getRange(1, 1, 1, schema.length).setValues([schema]);
    sheet.getRange(1, 1, 1, schema.length)
      .setBackground("#0d9488")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // Aggressive Truncation
    var maxCols = sheet.getMaxColumns();
    if (maxCols > schema.length) {
      sheet.deleteColumns(schema.length + 1, maxCols - schema.length);
    }
    
    // Freeze header
    sheet.setFrozenRows(1);
  },

  syncSchemaToConfig: function(schema) {
    try {
      var ssId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : SPREADSHEET_ID;
      var ss = SpreadsheetApp.openById(ssId);
      var sheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIGS) || ss.getSheetByName(SHEET_NAMES.CONFIG);
      if (!sheet) return false;

      var data = sheet.getDataRange().getValues();
      var keyRow = -1;
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === this.PACKAGE_LOG_CONFIG_KEY) {
          keyRow = i + 1;
          break;
        }
      }

      var value = JSON.stringify(schema);
      if (keyRow > 0) {
        var valueColIdx = getHeaderIndex(data[0], ["ค่าที่ตั้งไว้", "Value"]);
        var valueCol = valueColIdx === -1 ? 2 : valueColIdx + 1;
        sheet.getRange(keyRow, valueCol).setValue(value);
      } else {
        sheet.appendRow([this.PACKAGE_LOG_CONFIG_KEY, value]);
      }
      return true;
    } catch (e) {
      console.error("syncSchemaToConfig failed: " + e.message);
      return false;
    }
  },

  validateSchema: function(schema) {
    if (!Array.isArray(schema)) return { valid: false, error: "Schema must be an array" };
    if (schema.length !== this.PACKAGE_LOG_EXPECTED_LENGTH) {
      return { valid: false, error: "Expected " + this.PACKAGE_LOG_EXPECTED_LENGTH + " columns, found " + schema.length };
    }
    return { valid: true };
  },

  _readSchemaFromConfig: function(key) {
    try {
      var ssId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : SPREADSHEET_ID;
      var ss = SpreadsheetApp.openById(ssId);
      var sheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIGS) || ss.getSheetByName(SHEET_NAMES.CONFIG);
      if (!sheet) return null;

      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === key) {
          var raw = data[i][1];
          if (!raw) return null;
          return JSON.parse(String(raw));
        }
      }
    } catch (e) {
      console.error("Schema config read failed: " + e.message);
    }
    return null;
  },

  /**
   * [Visual] Apply conditional formatting rules for the สถานะ (Status) column.
   * Covers the three canonical status values used by the system:
   *   รอนำจ่าย → Amber | ส่งมอบแล้ว → Green | มีปัญหา/ตีกลับ → Red
   */
  setupStatusConditionalFormatting: function() {
    var ssId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : SPREADSHEET_ID;
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) : ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
    if (!sheet) return { success: false, error: "ไม่พบชีท " + SHEET_NAMES.PACKAGE_LOG };

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var statusIdx = getHeaderIndex(headers, "สถานะ");
    if (statusIdx === -1) return { success: false, error: "ไม่พบคอลัมน์สถานะ" };

    var statusCol = statusIdx + 1; // 1-indexed
    var lastRow = Math.max(sheet.getLastRow(), 1000);
    var range = sheet.getRange(2, statusCol, lastRow - 1, 1);

    // Clear existing rules on this range first
    var existingRules = sheet.getConditionalFormatRules();
    var otherRules = existingRules.filter(function(rule) {
      var ranges = rule.getRanges();
      return !ranges.some(function(r) {
        return r.getColumn() === statusCol && r.getRow() === 2;
      });
    });

    // Define status → color mapping
    var statusColors = [
      { text: "รอนำจ่าย", bg: "#FEF3C7", fg: "#92400E" },
      { text: "ส่งมอบแล้ว", bg: "#DCFCE7", fg: "#166534" },
      { text: "มีปัญหา/ตีกลับ", bg: "#FEE2E2", fg: "#991B1B" }
    ];

    var newRules = statusColors.map(function(s) {
      return SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(s.text)
        .setBackground(s.bg)
        .setFontColor(s.fg)
        .setBold(true)
        .setRanges([range])
        .build();
    });

    sheet.setConditionalFormatRules(otherRules.concat(newRules));
    return { success: true, message: "ตั้งค่า Conditional Formatting สำเร็จ " + newRules.length + " rules" };
  }
};
