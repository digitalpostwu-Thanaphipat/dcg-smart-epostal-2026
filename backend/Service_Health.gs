/**
 * Service_Health.gs (ePostal Custom Version)
 * System & Database Integrity Check
 * [Refactored for ePostal Architecture]
 */

var Service_Health = {
  systemHealthCheck: function () {
    var checks = [];
    var overallStatus = "healthy";

    // 1. Database Integrity Check (ePostal Local & Central)
    try {
      const integrityResult = this._checkDatabaseIntegrity();
      if (integrityResult.status === "fail") {
        checks.push({
          name: "integrity",
          status: "fail",
          detail: "พบความเสียหาย: " + integrityResult.errors.join(", "),
        });
        overallStatus = "down";
      } else {
        checks.push({
          name: "integrity",
          status: "pass",
          detail: "โครงสร้างข้อมูลระดับหัวตารางถูกต้อง 100%",
        });
      }
    } catch (e) {
      checks.push({ name: "integrity", status: "fail", detail: e.message });
      overallStatus = "down";
    }

    // 2. Database Access Check
    try {
      const localSS = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL);
      const centralSS = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
      checks.push({
        name: "access",
        status: "pass",
        detail: `เชื่อมต่อ DB สำเร็จ (Local: ${localSS.getName()}, Central: ${centralSS.getName()})`,
      });
    } catch (e) {
      checks.push({
        name: "access",
        status: "fail",
        detail: "ไม่สามารถเข้าถึงฐานข้อมูลได้: " + e.message,
      });
      overallStatus = "down";
    }

    // 3. Script Properties Config Check
    try {
      const configResult = this._checkProductionConfig();
      checks.push(configResult);
      if (configResult.status === "fail") overallStatus = "down";
      if (configResult.status === "warn" && overallStatus === "healthy") overallStatus = "warn";
    } catch (e) {
      checks.push({ name: "config", status: "fail", detail: e.message });
      overallStatus = "down";
    }

    // 4. Backup Status Check [Hardening Phase]
    try {
      const backupResult = this._checkBackupStatus();
      checks.push({
        name: "backup",
        status: backupResult.status,
        detail: backupResult.detail
      });
      if (backupResult.status === "fail" && overallStatus === "healthy") overallStatus = "warn";
    } catch (e) {
      checks.push({ name: "backup", status: "fail", detail: e.message });
    }

    // 5. Trigger Status Check
    try {
      const triggerResult = this._checkBackupTrigger();
      checks.push({
        name: "trigger",
        status: triggerResult.status,
        detail: triggerResult.detail
      });
      if (triggerResult.status === "fail" && overallStatus === "healthy") overallStatus = "warn";
    } catch (e) {
      checks.push({ name: "trigger", status: "fail", detail: e.message });
    }

    // 6. Monitoring Trigger Status Check
    try {
      const monitorResult = this._checkMonitoringTrigger();
      checks.push({
        name: "monitor",
        status: monitorResult.status,
        detail: monitorResult.detail
      });
      if (monitorResult.status === "fail" && overallStatus === "healthy") overallStatus = "warn";
    } catch (e) {
      checks.push({ name: "monitor", status: "fail", detail: e.message });
    }

    // 7. Sharding Status Check [Phase 5]
    try {
      const shardResult = this._checkShardingStatus();
      checks.push({
        name: "sharding",
        status: shardResult.status,
        detail: shardResult.detail
      });
      if (shardResult.status === "fail" && overallStatus === "healthy") overallStatus = "warn";
    } catch (e) {
      checks.push({ name: "sharding", status: "fail", detail: e.message });
    }

    return {
      status: overallStatus,
      checks: checks,
      version: typeof SYSTEM_VERSION !== "undefined" ? SYSTEM_VERSION : "unknown",
      timestamp: Service_Utils.formatThaiDateTime(new Date()),
    };
  },

  /**
   * _checkProductionConfig - verifies auth-sensitive ScriptProperties without exposing secrets.
   * @private
   */
  _checkProductionConfig: function() {
    const props = PropertiesService.getScriptProperties();
    const allProps = props.getProperties();
    const env = String(props.getProperty("ENV") || "PROD").toUpperCase();
    const missing = [];

    if (!props.getProperty("AUTH_TOKEN_SECRET")) missing.push("AUTH_TOKEN_SECRET");
    if (!props.getProperty("ROOT_ADMIN_EMAIL")) missing.push("ROOT_ADMIN_EMAIL");
    if (!props.getProperty("BACKUP_FOLDER_ID")) missing.push("BACKUP_FOLDER_ID");

    if (env === "DEV") {
      return {
        name: "config",
        status: "fail",
        detail: "ENV=DEV: production must disable mock-token bypass before go-live",
      };
    }

    if (missing.length > 0) {
      return {
        name: "config",
        status: "fail",
        detail: "ขาด ScriptProperties สำคัญ: " + missing.join(", "),
      };
    }

    return {
      name: "config",
      status: Object.keys(allProps).length > 0 ? "pass" : "warn",
      detail: "Production config พร้อมใช้งาน (" + Object.keys(allProps).length + " รายการ, ENV=" + env + ")",
    };
  },

  /**
   * Core Integrity Check (ePostal Custom Schema)
   */
  _checkDatabaseIntegrity: function () {
    const localSchemas = {
      [SHEET_NAMES.PACKAGE_LOG]: [
        "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับไปรษณีย์ภัณฑ์", "สถานะ",
        "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับตามจ่าหน้า", "ลายเซ็น",
        "รูปภาพ", "พิกัด GPS", "วิธีการส่งมอบ", "ประเภทการใช้", "หมายเหตุ / Line"
      ],
      [SHEET_NAMES.LOGS_AUDIT]: ["Timestamp", "Actor", "Action", "Details", "Status"],
    };

    let errors = [];

    // Check Local DB
    const localSS = SpreadsheetApp.openById(SPREADSHEET_ID);
    for (let sheetName in localSchemas) {
      const sheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(localSS, sheetName) : localSS.getSheetByName(sheetName);
      if (!sheet) {
        errors.push(`ไม่พบชีท: ${sheetName}`);
        continue;
      }

      const headers = sheet
        .getRange(1, 1, 1, localSchemas[sheetName].length)
        .getValues()[0];
        
      localSchemas[sheetName].forEach((expected) => {
        const idx = getHeaderIndex(headers, expected);
        if (idx === -1) {
          errors.push(
            `ชีท ${sheetName}: ไม่พบคอลัมน์ที่จำเป็นคือ '${expected}'`
          );
        }
      });
    }

    // Central DB Check (Just verify existence since Service_DB has auto-headers for data)
    const centralSS = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
    const requiredCentralSheets = [SHEET_NAMES.PERSONNEL, SHEET_NAMES.DEPTS, SHEET_NAMES.POSITIONS, SHEET_NAMES.REPS];
    requiredCentralSheets.forEach(sheetName => {
      // Allow fallback names
      let sheet = centralSS.getSheetByName(sheetName);
      if(!sheet && sheetName === "รายชื่อพนักงาน") sheet = centralSS.getSheetByName("Personnel");
      if(!sheet && sheetName === "รายชื่อหน่วยงาน") sheet = centralSS.getSheetByName("Departments");
      if(!sheet && sheetName === "ผู้ใช้งานระบบ") sheet = centralSS.getSheetByName("Users") || centralSS.getSheetByName("Master_Users");

      if (!sheet) {
        errors.push(`Central DB: ไม่พบชีทโครงสร้างหลักเกี่ยวกับ ${sheetName}`);
      }
    });

    return {
      status: errors.length > 0 ? "fail" : "pass",
      errors: errors,
    };
  },

  /**
   * _checkBackupStatus - Verifies recent backups in Drive
   * @private
   */
  _checkBackupStatus: function() {
    const backupFolderId = PropertiesService.getScriptProperties().getProperty("BACKUP_FOLDER_ID");
    let folder = null;

    if (backupFolderId) {
      folder = DriveApp.getFolderById(backupFolderId);
    } else {
      const folders = DriveApp.getFoldersByName("ePostal_Backups");
      if (folders.hasNext()) folder = folders.next();
    }

    if (!folder) {
      return { status: "fail", detail: "ไม่พบโฟลเดอร์สำรองข้อมูล (BACKUP_FOLDER_ID/ePostal_Backups)" };
    }
    
    const files = folder.getFiles();
    if (!files.hasNext()) {
      return { status: "fail", detail: "ไม่พบไฟล์สำรองข้อมูลในโฟลเดอร์" };
    }
    
    // Check if the latest file is within 28 hours (allowing some jitter for daily backup)
    const latestFile = files.next();
    const ageHours = (new Date() - latestFile.getDateCreated()) / (1000 * 60 * 60);
    
    if (ageHours > 28) {
      return { status: "fail", detail: `การสำรองข้อมูลล่าสุดเก่าเกินไป (${Math.round(ageHours)} ชม.)` };
    }
    
    return { status: "pass", detail: `ระบบสำรองข้อมูลเป็นปกติ (ไฟล์ล่าสุด: ${Math.round(ageHours)} ชม. ที่แล้ว)` };
  },

  /**
   * _checkBackupTrigger - Verifies if the daily automation trigger is active
   * @private
   */
  _checkBackupTrigger: function() {
    const triggers = ScriptApp.getProjectTriggers();
    const hasDaily = triggers.some(t => t.getHandlerFunction() === "createDailyBackup");
    
    if (!hasDaily) {
      return { status: "fail", detail: "ไม่พบ Trigger สำหรับสำรองข้อมูลอัตโนมัติ" };
    }
    
    return { status: "pass", detail: "ติดตั้ง Trigger สำรองข้อมูลรายวันเรียบร้อย" };
  },

  /**
   * _checkMonitoringTrigger - verifies uptime monitor trigger is active.
   * @private
   */
  _checkMonitoringTrigger: function() {
    const triggers = ScriptApp.getProjectTriggers();
    const hasMonitor = triggers.some(t => t.getHandlerFunction() === "checkSystemUptime");

    if (!hasMonitor) {
      return { status: "fail", detail: "ไม่พบ Trigger สำหรับติดตาม Uptime" };
    }

    return { status: "pass", detail: "ติดตั้ง Trigger ติดตาม Uptime เรียบร้อย" };
  },

  /**
   * _checkShardingStatus
   * T-005 Component: Verifies the integrity of the Fiscal Year Sharding registry.
   */
  _checkShardingStatus: function() {
    try {
      const props = PropertiesService.getScriptProperties();
      const registryStr = props.getProperty("DB_SHARDS");
      if (!registryStr) return { status: "fail", detail: "ไม่พบการตั้งค่า Sharding Registry" };
      
      const registry = JSON.parse(registryStr);
      const years = Object.keys(registry);
      
      if (years.length === 0) return { status: "warn", detail: "Registry ว่างเปล่า" };
      
      // Check accessibility of the current year shard
      const currentFY = typeof _getCurrentFiscalYear === 'function' ? _getCurrentFiscalYear() : 2569;
      const currentId = registry[String(currentFY)];
      
      if (!currentId) return { status: "warn", detail: `ไม่พบ Shard สำหรับปีงบประมาณปัจจุบัน (${currentFY})` };
      
      try {
        const ss = SpreadsheetApp.openById(currentId);
        return { 
          status: "pass", 
          detail: `Shard Engine พร้อมใช้งาน (${years.length} ปีงบประมาณ, ปีปัจจุบัน: ${ss.getName()})` 
        };
      } catch (fErr) {
        return { status: "fail", detail: "ไม่สามารถเปิดไฟล์ Shard ได้: " + fErr.message };
      }
    } catch (e) {
      return { status: "fail", detail: "Sharding Error: " + e.message };
    }
  }
};

// Global Alias for Dispatcher
function systemHealthCheck() {
  return Service_Health.systemHealthCheck();
}
