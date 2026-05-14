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
      const props = PropertiesService.getScriptProperties().getProperties();
      checks.push({
        name: "config",
        status: Object.keys(props).length > 0 ? "pass" : "warn",
        detail: "พบการตั้งค่าระบบ " + Object.keys(props).length + " รายการ",
      });
    } catch (e) {
      checks.push({ name: "config", status: "fail", detail: e.message });
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

    // 6. Sharding Status Check [Phase 5]
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
      version: "1.0.0 (ePostal Native)",
      timestamp: Service_Utils.formatThaiDateTime(new Date()),
    };
  },

  /**
   * Core Integrity Check (ePostal Custom Schema)
   */
  _checkDatabaseIntegrity: function () {
    const localSchemas = {
      [SHEET_NAMES.PACKAGE_LOG]: [
        "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับ", "สถานะ",
        "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับจริง", "ลายเซ็น",
        "รูปภาพ", "พิกัด GPS", "วิธีการส่งมอบ", "ประเภทการใช้", "หมายเหตุ / Line"
      ],
      [SHEET_NAMES.LOGS_AUDIT]: ["Timestamp", "Actor", "Action", "Details", "Status"],
    };

    let errors = [];

    // Check Local DB
    const localSS = SpreadsheetApp.openById(SPREADSHEET_ID);
    for (let sheetName in localSchemas) {
      const sheet = localSS.getSheetByName(sheetName);
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
    const centralSS = SpreadsheetApp.openById(CENTRAL_SPREADSHEET_ID);
    const requiredCentralSheets = [SHEET_NAMES.PERSONNEL, SHEET_NAMES.DEPTS, SHEET_NAMES.USERS];
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
    const folderName = "ePostal_Backups";
    const folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) {
      return { status: "fail", detail: "ไม่พบโฟลเดอร์สำรองข้อมูล (ePostal_Backups)" };
    }
    
    const folder = folders.next();
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
