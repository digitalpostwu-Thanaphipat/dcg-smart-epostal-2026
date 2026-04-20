/**
 * Service_Batch.gs
 * Centralized service for Batch Operations and Data Consistency.
 * Features: Atomic Writes (LockService) + Batch ID Generation
 * [Loki Mode] Compliance Sec 8.2
 */

var Service_Batch = {
  /**
   * Batch Insert Rows into a Sheet with LockService protection
   * @param {string} sheetName - Target Sheet Name
   * @param {Array<Array<any>>} rows - 2D Array of data
   * @param {string} mode - 'BOTTOM' (Append) or 'TOP' (Insert after header)
   * @returns {number} count of inserted rows
   */
  insertRows: function (sheetName, rows, mode) {
    if (!rows || rows.length === 0) return 0;

    var lock = LockService.getScriptLock();
    try {
      // 15 seconds timeout to wait for other operations to finish
      lock.waitLock(15000); 

      var sheet = getSheet(sheetName);
      if (!sheet) throw new Error("Sheet not found: " + sheetName);

      // Validate width consistency
      var width = rows[0].length;

      if (mode === "TOP") {
        // Insert after header (Row 1)
        sheet.insertRowsAfter(1, rows.length);
        sheet.getRange(2, 1, rows.length, width).setValues(rows);
      } else {
        // BOTTOM (Default)
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, rows.length, width).setValues(rows);
      }

      return rows.length;

    } catch (e) {
      console.error("Batch Insert Error (" + sheetName + "): " + e.message);
      throw e;
    } finally {
      // Always release the lock!
      lock.releaseLock();
    }
  },

  /**
   * Generate Next Sequence ID
   * Standardizes ID generation: PREFIX-YYYYMMDD-XXXX
   * @param {string} sheetName
   * @param {string} prefix e.g. "ORD", "EMS"
   * @returns {string} The new ID
   */
  generateNextId: function (sheetName, prefix) {
    // Delegate to Service_Utils.generateNextId to eliminate duplication
    var sheet = getSheet(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);
    return Service_Utils.generateNextId(sheet, prefix);
  },

  /**
   * Generate Multiple Sequential IDs for Batch Operations
   * @param {string} sheetName - Target Sheet Name (for sequence lookup)
   * @param {string} prefix - ID prefix e.g. "ORD", "EMS"
   * @param {number} count - Number of IDs to generate
   * @returns {Array<string>} Array of sequential IDs
   */
  generateBatchIds: function (sheetName, prefix, count) {
    if (!count || count <= 0) return [];

    var sheet = getSheet(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);

    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    var dateStr = yyyy + mm + dd;

    var fullPrefix = prefix + "-" + dateStr + "-";

    // Find current max sequence for today
    var nextSeq = 1;
    var lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      var lastIdBottom = sheet.getRange(lastRow, 1).getValue();
      var lastIdTop = sheet.getRange(2, 1).getValue();

      var seqBottom = this._parseSeq(lastIdBottom, fullPrefix);
      var seqTop = this._parseSeq(lastIdTop, fullPrefix);

      var maxSeq = Math.max(seqBottom, seqTop);
      if (maxSeq > 0) nextSeq = maxSeq + 1;
    }

    // Generate sequential IDs
    var ids = [];
    for (var i = 0; i < count; i++) {
      ids.push(fullPrefix + String(nextSeq + i).padStart(4, "0"));
    }

    return ids;
  },

  /**
   * Helper to parse the sequence number from an ID string
   */
  _parseSeq: function (idStr, prefix) {
    if (!idStr || typeof idStr !== "string") return 0;
    if (idStr.indexOf(prefix) === 0) {
      var parts = idStr.split("-");
      // Expecting PREFIX-YYYYMMDD-XXXX (3 parts)
      if (parts.length >= 3) {
        return parseInt(parts[parts.length - 1], 10) || 0;
      }
    }
    return 0;
  }
};
