/**
 * Service_Utils.gs
 * Shared Utilities for Date Formatting, ID Generation, and Helpers
 * [Loki Mode] Refactored to Object Pattern (Sec 3.5, 3.6 Compliance)
 */

var Service_Utils = {
  createJSONOutput: function (data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
      ContentService.MimeType.JSON,
    );
  },

  // [Extreme Optimized] Get current sequence using PropertiesService for speed
  getLatestSequence: function (sheet, prefix) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;
    const propKey = `SEQ_${prefix}_${dateStr}`;
    
    // 1. Try Script Properties first (Fastest)
    const props = PropertiesService.getScriptProperties();
    let seq = props.getProperty(propKey);
    
    if (seq !== null) {
      return { dateStr: dateStr, seq: parseInt(seq, 10), fromCache: true };
    }

    // 2. Fallback to Sheet Scan (Only once per day or server restart)
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { dateStr: dateStr, seq: 0, fromCache: false };

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIdx = this.findHeader(headers, ["รหัส", "ID"]);
    const idTop = sheet.getRange(2, idIdx + 1).getValue();
    const idBottom = sheet.getRange(lastRow, idIdx + 1).getValue();
    const lastId = String(idTop) > String(idBottom) ? idTop : idBottom;

    const parts = String(lastId).split("-");
    if (parts.length === 3 && parts[1] === dateStr) {
      seq = parseInt(parts[2], 10) || 0;
      props.setProperty(propKey, seq.toString());
      return { dateStr: dateStr, seq: seq, fromCache: false };
    }
    
    props.setProperty(propKey, "0");
    return { dateStr: dateStr, seq: 0, fromCache: false };
  },

  // Save the new sequence back to PropertiesService after batch save
  setLatestSequence: function (prefix, seq) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;
    const propKey = `SEQ_${prefix}_${dateStr}`;
    PropertiesService.getScriptProperties().setProperty(propKey, seq.toString());
  },

  // Refactored generateNextId to support batch increments
  generateNextId: function (sheet, prefix, batchOffset) {
    const info = this.getLatestSequence(sheet, prefix);
    const nextSeq = (info.seq || 0) + (batchOffset || 1);
    const seqStr = String(nextSeq).padStart(4, "0");
    return `${prefix}-${info.dateStr}-${seqStr}`;
  },

  // Helper to parse date handles Buddhist Year transparently
  parseDate: function (dateVal) {
    if (!dateVal) return null;

    let date;
    if (dateVal instanceof Date) {
      date = new Date(dateVal); // Clone
      // T-016: Normalize Buddhist Year in Date object if necessary
      if (date.getFullYear() > 2400) {
        date.setFullYear(date.getFullYear() - 543);
      }
    } else if (typeof dateVal === "string") {
      const cleanVal = dateVal.trim();
      // Handle YYYY-MM-DD (ISO)
      if (cleanVal.includes("-")) {
        date = new Date(cleanVal);
      } else if (cleanVal.includes("/")) {
        // Handle D/M/YYYY
        const parts = cleanVal.split("/");
        if (parts.length === 3) {
          let yearPart = parts[2];
          let timePart = "00:00:00";

          if (yearPart.includes(" ")) {
            const splitYear = yearPart.split(" ");
            yearPart = splitYear[0];
            timePart = splitYear.slice(1).join(" ");
          }

          let year = parseInt(yearPart, 10);
          // Handle Buddhist Year
          if (year > 2400) year -= 543;

          const [hours, minutes, seconds] = timePart
            .split(":")
            .map((val) => parseInt(val, 10) || 0);

          date = new Date(
            year,
            parts[1] - 1,
            parts[0],
            hours,
            minutes,
            seconds,
          );
        } else {
          date = new Date(cleanVal);
        }
      } else {
        date = new Date(cleanVal);
      }
    } else {
      return null;
    }

    if (date && !isNaN(date.getTime())) {
      // Ensure we normalize to Gregorian if still > 2400 (safety double-check)
      if (date.getFullYear() > 2400) {
        date.setFullYear(date.getFullYear() - 543);
      }
      return date;
    }
    return null;
  },

  /**
   * getThaiFiscalYear
   * Thai FY starts Oct 1st. FY 2567 = 1 Oct 2023 to 30 Sep 2024.
   * @param {Date|string} dateInput
   * @returns {number} Thai BE Fiscal Year
   */
  getThaiFiscalYear: function (dateInput) {
    const d = this.parseDate(dateInput) || new Date();
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    let fy = month >= 10 ? year + 1 : year;
    return fy + 543;
  },

  logAction: function (actor, action, details) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const sheet = typeof getSheet === "function" ? getSheet(SHEET_NAMES.LOGS_AUDIT) : null; 
      if (sheet) sheet.appendRow([new Date(), actor, action, details, ""]);
    } catch (e) {
      console.error("Log failed: " + e.message);
    } finally {
      lock.releaseLock();
    }
  },

  formatThaiDateTime: function (date) {
    if (!date) return "";
    var d = this.parseDate(date);
    if (!d) return String(date);
    
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear() + 543;
    var hours = d.getHours();
    var minutes = d.getMinutes();
    return `${day}/${month}/${year} ${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
  },

  getFiscalYear: function (date) {
    var d = date || new Date();
    var year = d.getFullYear() + 543;
    var month = d.getMonth() + 1;
    // Thai Fiscal Year starts in October
    if (month >= 10) year += 1;
    return year;
  },

  getThaiDate: function (date) {
     var d = date || new Date();
     return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
  },

  getThaiTime: function (date) {
     var d = date || new Date();
     return `${d.getHours()}:${d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()}`;
  },

  getDeptById: function(deptId) {
     if (!deptId) return null;
     var depts = typeof getCentralDepts === 'function' ? getCentralDepts() : [];
     return depts.find(function(d) {
        return String(d.DeptID) === String(deptId) || String(d.name) === String(deptId);
     });
  },

  /**
   * getHeaderMap (Retained for Backward Compatibility)
   * Creates a map of headers to their column index (0-based)
   * @param {Array} headers 
   */
  getHeaderMap: function(headers) {
    var map = {};
    headers.forEach(function(h, i) {
      if (h) map[h.toString().trim()] = i;
    });
    return map;
  },

  /**
   * findHeader (Retained for Backward Compatibility)
   * Finds a header index that contains any of the given keywords
   * @param {Array} headers 
   * @param {Array} keywords 
   */
  findHeader: function(headers, keywords) {
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i] ? headers[i].toString().toLowerCase() : "";
      for (var k = 0; k < keywords.length; k++) {
        if (h.indexOf(keywords[k].toLowerCase()) > -1) return i;
      }
    }
    return -1;
  },

  /**
   * saveBase64ToDrive
   * Decodes a base64 data URL, saves it as a PNG to Google Drive,
   * and returns a publicly viewable thumbnail URL.
   * @param {string} base64DataUrl - A data:image/png;base64,... string
   * @param {string} fileName - Desired file name (without extension)
   * @returns {string} Public thumbnail URL or empty string on failure
   */
  saveBase64ToDrive: function(base64DataUrl, fileName) {
    try {
      if (!base64DataUrl || !base64DataUrl.startsWith('data:image')) return '';
      
      // Extract base64 content (remove "data:image/png;base64," prefix)
      var base64Content = base64DataUrl.split(',')[1];
      if (!base64Content) return '';
      
      var decoded = Utilities.base64Decode(base64Content);
      var blob = Utilities.newBlob(decoded, 'image/png', fileName + '.png');
      
      // Get or create the "ePostal_Signatures" folder
      var folderName = 'ePostal_Signatures';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Return a direct viewable thumbnail URL
      var fileId = file.getId();
      return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    } catch (e) {
      console.error('saveBase64ToDrive error:', e.message);
      return '';
    }
  },

  /**
   * sendLineNotify
   * Sends a message via LINE Notify API using the token from script properties.
   * @param {string} message - The message to send.
   */
  sendLineNotify: function (message) {
    try {
      const token = PropertiesService.getScriptProperties().getProperty("LINE_NOTIFY_TOKEN");
      if (!token) return { success: false, error: "LINE Notify Token not set" };

      const options = {
        method: "post",
        headers: { Authorization: "Bearer " + token },
        payload: { message: message },
      };

      const res = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
      return { success: res.getResponseCode() === 200 };
    } catch (e) {
      console.error("LINE Notify Error:", e.message);
      return { success: false, error: e.message };
    }
  },

  checkRateLimit: function (action, limit, periodSeconds) {
    try {
      var cache = CacheService.getScriptCache();
      var key = "rate_limit_" + action;
      var current = cache.get(key);
      if (current === null) {
        cache.put(key, "1", periodSeconds);
      } else {
        var count = parseInt(current, 10);
        if (count >= limit) {
          throw new Error("RATE_LIMIT_EXCEEDED: มีการเรียกใช้งานถี่เกินไป กรุณารอสักครู่");
        }
        cache.put(key, String(count + 1), periodSeconds);
      }
    } catch (e) {
      if (e.message && e.message.indexOf("RATE_LIMIT_EXCEEDED") !== -1) {
        throw e;
      }
      console.warn("Rate limit check warning: " + e.message);
    }
  }
};

// Global Aliases for Backward Compatibility
function createJSONOutput(data) {
  return Service_Utils.createJSONOutput(data);
}
function generateNextId(sheet, prefix) {
  return Service_Utils.generateNextId(sheet, prefix);
}
function formatThaiDateTime(date) {
  return Service_Utils.formatThaiDateTime(date);
}
function parseDate(d) {
  return Service_Utils.parseDate(d);
}
function logAction(actor, action, details) {
  return Service_Utils.logAction(actor, action, details);
}
function sendLineNotify(msg) {
  return Service_Utils.sendLineNotify(msg);
}
function checkRateLimit(action, limit, periodSeconds) {
  return Service_Utils.checkRateLimit(action, limit, periodSeconds);
}
