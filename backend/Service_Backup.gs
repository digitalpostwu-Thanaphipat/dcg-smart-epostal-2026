/**
 * Service_Backup.gs - DCG Smart Flow v4.0 Standard
 * Automated Backup & Retention Policy (30 Days)
 *
 * [P2-1 Hardening] ปรับปรุง:
 * - สำรองข้อมูลทั้ง LOCAL และ CENTRAL database
 * - implement restoreFromBackup จริง (กู้คืนจาก backup file)
 * - verify-after-backup (ตรวจสอบ backup ใช้งานได้)
 * - ล็อกกัน race condition ระหว่าง backup และ write
 */

var DB_IDS_TO_BACKUP = function () {
  // รวบรวม ID ของทุก spreadsheet ที่ต้องสำรอง (LOCAL + CENTRAL)
  var ids = [];
  try {
    var localId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : null;
    if (localId) ids.push({ id: localId, label: "LOCAL" });
  } catch (e) {
    console.warn("Backup: ไม่สามารถอ่าน LOCAL DB ID: " + e.message);
  }
  try {
    var centralId = null;
    if (typeof SPREADSHEET_IDS !== "undefined" && SPREADSHEET_IDS && SPREADSHEET_IDS.CENTRAL) {
      centralId = SPREADSHEET_IDS.CENTRAL;
    } else {
      // fallback: อ่านจาก ScriptProperties
      var props = PropertiesService.getScriptProperties();
      centralId = props.getProperty("CENTRAL_DB_ID");
    }
    if (centralId) ids.push({ id: centralId, label: "CENTRAL" });
  } catch (e) {
    console.warn("Backup: ไม่สามารถอ่าน CENTRAL DB ID: " + e.message);
  }
  return ids;
};

var Service_Backup = {
  /**
   * runAutoBackup - สำรองข้อมูล LOCAL + CENTRAL ไปยัง BACKUP_FOLDER_ID
   * รันผ่าน trigger createDailyBackup หรือ manual
   * [Hardening] ใช้ LockService กัน race กับ write operations
   */
  runAutoBackup: function () {
    var props = PropertiesService.getScriptProperties();
    var backupFolderId = props.getProperty("BACKUP_FOLDER_ID");

    if (!backupFolderId) {
      console.warn("BACKUP_FOLDER_ID not set. Skipping auto-backup.");
      return { success: false, error: "BACKUP_FOLDER_ID is not set" };
    }

    // [Hardening] Lock 30 วินาทีกัน race กับ write
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return { success: false, error: "ระบบกำลังดำเนินการอยู่ กรุณาลองใหม่ภายหลัง" };
    }

    var results = [];
    var allSuccess = true;
    try {
      var folder = DriveApp.getFolderById(backupFolderId);
      var dbs = DB_IDS_TO_BACKUP();
      var timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HHmm");

      // 1. สำรองทุก spreadsheet
      dbs.forEach(function (db) {
        try {
          var file = DriveApp.getFileById(db.id);
          var backupName = "BACKUP_" + db.label + "_" + timestamp;
          var backupFile = file.makeCopy(backupName, folder);
          var backupId = backupFile.getId();

          // [P2-1] verify-after-backup: ตรวจว่า backup เปิดได้และมีข้อมูล
          var verified = this._verifyBackup(backupId);
          results.push({
            label: db.label,
            backupId: backupId,
            backupName: backupName,
            verified: verified,
          });
          if (!verified) allSuccess = false;
          console.log("Backup created+verified: " + backupName + " (" + (verified ? "OK" : "VERIFY FAILED") + ")");
        } catch (e) {
          allSuccess = false;
          results.push({ label: db.label, error: e.message });
          console.error("Backup failed for " + db.label + ": " + e.message);
        }
      }, this);

      // 2. Retention Policy (30 วัน) — ลบเฉพาะ BACKUP_* เก่า
      var retentionDays = 30;
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      var files = folder.getFiles();
      var deletedCount = 0;
      while (files.hasNext()) {
        var f = files.next();
        if (f.getName().indexOf("BACKUP_") === 0 && f.getDateCreated() < cutoffDate) {
          f.setTrashed(true);
          deletedCount++;
        }
      }
      console.log("Retention: ล้าง backup เก่า " + deletedCount + " ไฟล์");

      return {
        success: allSuccess,
        backupName: "BACKUP_*_" + timestamp,
        results: results,
        deletedCount: deletedCount,
        timestamp: timestamp,
      };
    } catch (e) {
      console.error("Backup Error: " + e.message);
      return { success: false, error: e.message };
    } finally {
      try { lock.releaseLock(); } catch (re) {}
    }
  },

  /**
   * _verifyBackup - ตรวจสอบว่า backup ที่สร้างขึ้นเปิดได้และมีข้อมูลจริง
   * @private
   */
  _verifyBackup: function (backupId) {
    try {
      var ss = SpreadsheetApp.openById(backupId);
      var sheets = ss.getSheets();
      // ต้องมีอย่างน้อย 1 sheet ที่มีข้อมูล
      var hasData = false;
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getLastRow() > 0) {
          hasData = true;
          break;
        }
      }
      return hasData;
    } catch (e) {
      console.error("Verify backup failed: " + e.message);
      return false;
    }
  },

  /**
   * restoreFromBackup - กู้คืนข้อมูลจาก backup file
   *
   * กลยุทธ์: อ่านข้อมูลจาก backup แล้ว copy กลับไปยัง target spreadsheet
   * (ไม่ลบ target ทิ้ง เพื่อกัน data loss ถ้า restore ล้มเหลว — แทนที่ sheet contents)
   *
   * @param {string} fileId - ID ของ backup file ที่จะกู้คืน
   * @param {string} targetLabel - "LOCAL" หรือ "CENTRAL" (optional, default: อนุมานจากชื่อ backup)
   * @returns {Object} result
   */
  restoreFromBackup: function (fileId, targetLabel) {
    if (!fileId) return { success: false, error: "ต้องระบุ fileId ของ backup" };

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return { success: false, error: "ระบบกำลังดำเนินการอยู่ กรุณาลองใหม่ภายหลัง" };
    }

    try {
      // 1. เปิด backup
      var backupSs = SpreadsheetApp.openById(fileId);
      var backupName = DriveApp.getFileById(fileId).getName();
      console.log("Restore: เริ่มกู้คืนจาก " + backupName);

      // 2. อนุมาน target จากชื่อ backup ถ้าไม่ระบุ
      if (!targetLabel) {
        if (backupName.indexOf("CENTRAL") > -1) targetLabel = "CENTRAL";
        else targetLabel = "LOCAL";
      }

      // 3. หา target spreadsheet ID
      var targetId;
      if (targetLabel === "CENTRAL") {
        targetId =
          (typeof SPREADSHEET_IDS !== "undefined" && SPREADSHEET_IDS && SPREADSHEET_IDS.CENTRAL) ||
          PropertiesService.getScriptProperties().getProperty("CENTRAL_DB_ID");
      } else {
        targetId = typeof getActiveDatabaseId === "function" ? getActiveDatabaseId() : null;
      }

      if (!targetId) {
        return { success: false, error: "ไม่พบ target spreadsheet ID สำหรับ " + targetLabel };
      }

      var targetSs = SpreadsheetApp.openById(targetId);

      // 4. สำรอง current state ก่อน restore (safety net)
      try {
        var safetyFolderId = PropertiesService.getScriptProperties().getProperty("BACKUP_FOLDER_ID");
        if (safetyFolderId) {
          DriveApp.getFileById(targetId).makeCopy(
            "PRE_RESTORE_" + targetLabel + "_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss"),
            DriveApp.getFolderById(safetyFolderId)
          );
          console.log("Restore: สำรอง current state ก่อน restore แล้ว (safety net)");
        }
      } catch (safetyErr) {
        console.warn("Restore: ไม่สามารถสำรอง current state: " + safetyErr.message);
      }

      // 5. copy ข้อมูลจาก backup มาที่ target sheet-by-sheet
      var backupSheets = backupSs.getSheets();
      var restored = [];
      var errors = [];

      backupSheets.forEach(function (backupSheet) {
        var sheetName = backupSheet.getName();
        try {
          var targetSheet = targetSs.getSheetByName(sheetName);
          if (!targetSheet) {
            // สร้าง sheet ใหม่ถ้าไม่มี
            targetSheet = targetSs.insertSheet(sheetName);
          }

          var lastRow = backupSheet.getLastRow();
          var lastCol = backupSheet.getLastColumn();

          if (lastRow === 0) {
            restored.push(sheetName + " (ว่าง)");
            return;
          }

          // อ่านข้อมูลจาก backup
          var data = backupSheet.getRange(1, 1, lastRow, lastCol).getValues();

          // ล้าง target sheet (เก็บ header row ไว้ก่อน)
          targetSheet.clearContents();

          // เขียนข้อมูลจาก backup
          targetSheet.getRange(1, 1, lastRow, lastCol).setValues(data);
          restored.push(sheetName + " (" + lastRow + " แถว)");
        } catch (sheetErr) {
          errors.push(sheetName + ": " + sheetErr.message);
        }
      });

      console.log("Restore เสร็จ: " + restored.length + " sheets, " + errors.length + " errors");

      return {
        success: errors.length === 0,
        message: "กู้คืนข้อมูลจาก " + backupName + " เรียบร้อย",
        restored: restored,
        errors: errors,
        targetLabel: targetLabel,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      console.error("Restore Error: " + e.message);
      return { success: false, error: e.message };
    } finally {
      try { lock.releaseLock(); } catch (re) {}
    }
  },
};

// Global functions (เรียกจาก trigger + ROUTE_MAP)
function runAutoBackup() {
  return Service_Backup.runAutoBackup();
}
function createDailyBackup() {
  return Service_Backup.runAutoBackup();
}
function restoreFromBackup(fileId, targetLabel) {
  return Service_Backup.restoreFromBackup(fileId, targetLabel);
}
