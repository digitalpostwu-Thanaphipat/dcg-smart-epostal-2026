/**
 * AdminService.gs
 * Handles Master Data from Central DB (Google Sheets)
 * [Loki Mode] Strict Section 11 Compliance
 */

var AdminService = {
  /**
   * linkActiveSpreadsheet 
   * Diagnostic command to "force link" the current database ID into Script Properties.
   */
  linkActiveSpreadsheet: function(id) {
    try {
      if (!id) id = SpreadsheetApp.getActiveSpreadsheet().getId();
      PropertiesService.getScriptProperties().setProperty("LINKED_DB_ID", id);
      return { success: true, message: "เชื่อมต่อฐานข้อมูลใหม่สำเร็จ: " + id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * getSystemInfo
   * Diagnostic info for T-019 synchronization
   * [Security] IDs are masked to prevent full Spreadsheet ID leakage.
   */
  getSystemInfo: function() {
    var linkedRaw = PropertiesService.getScriptProperties().getProperty("LINKED_DB_ID") || "";
    var activeRaw = typeof getActiveDatabaseId === 'function' ? getActiveDatabaseId() : "";
    return {
      version: APP_VERSION,
      timestamp: "2026-04-20",
      linkedDbId: this._maskId(linkedRaw) || "Auto-Discovering",
      activeDbId: this._maskId(activeRaw) || "N/A"
    };
  },

  /**
   * _maskId - ซ่อน Spreadsheet ID เหลือเฉพาะ 4 ตัวแรก/ท้าย (defense-in-depth)
   * @private
   */
  _maskId: function(id) {
    if (!id || typeof id !== "string") return "";
    if (id.length <= 12) return id.charAt(0) + "***";
    return id.substring(0, 4) + "***" + id.substring(id.length - 4);
  },
  /**
   * Get Departments from "รายชื่อหน่วยงาน"
   * Schema (11.1.3): [รหัสหน่วยงาน, ชื่อหน่วยงาน, อาคาร, ชั้น, สายส่ง, ...]
   */
  /**
   * getDepartments (Flexible Matching)
   */
  getDepartments: function() {
    try {
      var depts = getCentralDepts();
      // Ensure uniqueness to prevent duplicate dropdown entries
      var unique = [];
      var seen = {};
      for (var i = 0; i < depts.length; i++) {
         var d = depts[i];
         var key = d.DeptName;
         if (key && !seen[key]) {
            seen[key] = true;
            unique.push(d);
         }
      }
      return unique;
    } catch (e) {
      console.error("Error getDepartments:", e.message);
      return [];
    }
  },

  /**
   * getPersonnel
   */
  getPersonnel: function() {
    try {
      return getCentralPersonnel();
    } catch (e) {
      console.error("Error getPersonnel:", e.message);
      return [];
    }
  },

  /**
   * getPositions
   */
  getPositions: function() {
    try {
      return getCentralPositions();
    } catch (e) {
      console.error("Error getPositions:", e.message);
      return [];
    }
  },

  getRepresentatives: function() {
    try {
      return getCentralReps();
    } catch (e) {
      console.error("Error getRepresentatives:", e.message);
      return [];
    }
  },

  /**
   * updateCentralDbConfig
   * Professional Configuration management for Central DB ID
   * @param {string} id - The Google Sheet ID for Central DB
   */
  updateCentralDbConfig: function(id) {
    if (!id || id.length < 20) return { success: false, error: "Invalid Spreadsheet ID" };
    try {
      PropertiesService.getScriptProperties().setProperty("CENTRAL_DB_ID", id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Diagnostic: List all sheets and their headers in Central DB
   */
  debugStructure: function() {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
      var sheets = ss.getSheets();
      var report = sheets.map(function(s) {
        var data = s.getDataRange().getValues();
        var headers = data.length > 0 ? data[0] : [];
        return {
          sheetName: s.getName(),
          headers: headers,
          rowCount: data.length
        };
      });
      return { 
        spreadsheetName: ss.getName(),
        sheets: report 
      };
    } catch (e) {
      return { error: e.message };
    }
  },

  /**
   * Get all system configurations (including Model Selection)
   */
  getSystemConfigs: function() {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
      var sheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIGS) || this._initSystemConfigSheet(ss);
      var data = sheet.getDataRange().getValues();
      var configs = {};
      
      // Skip header
      for (var i = 1; i < data.length; i++) {
        configs[data[i][0]] = data[i][1];
      }
      return { success: true, data: configs };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Update a specific system configuration
   */
  updateSystemConfig: function(key, value) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.CENTRAL);
      var sheet = ss.getSheetByName(SHEET_NAMES.SYSTEM_CONFIGS) || this._initSystemConfigSheet(ss);
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var keyIdx = getHeaderIndex(headers, ["Key", "หัวข้อ"]);
      var valIdx = getHeaderIndex(headers, ["Value", "ค่า"]);
      var updateIdx = getHeaderIndex(headers, ["LastUpdated", "อัปเดตล่าสุด"]);
      
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][keyIdx] === key) {
          if (valIdx !== -1) sheet.getRange(i + 1, valIdx + 1).setValue(value);
          if (updateIdx !== -1) sheet.getRange(i + 1, updateIdx + 1).setValue(new Date());
          found = true;
          break;
        }
      }
      
      if (!found) {
        // [Security] Use Schema-aware mapping for new rows if possible, or appendRow as fallback
        sheet.appendRow([key, value, "Auto-generated setting", new Date()]);
      }
      
      // Invalidate related cache if necessary
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Internal: Initialize settings sheet if missing
   */
  _initSystemConfigSheet: function(ss) {
    var sheet = ss.insertSheet(SHEET_NAMES.SYSTEM_CONFIGS);
    sheet.appendRow(["Key", "Value", "Description", "LastUpdated"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#f3f3f3");
    // Initial Seed
    sheet.appendRow(["active_ai_model", "gemini-1.5-flash", "Active LLM Model for system tasks", new Date()]);
    return sheet;
  },

  /**
   * getInitialData [Unified Fetch Strategy]
   * Bundles all critical metadata into a single request to reduce frontend latency.
   */
  getInitialData: function() {
    try {
      return {
        departments: this.getDepartments(),
        personnel: this.getPersonnel(),
        positions: this.getPositions(),
        representatives: this.getRepresentatives(),
        systemInfo: this.getSystemInfo(),
      };
    } catch (e) {
      console.error("Error getInitialData:", e.message);
      return { error: e.message };
    }
  },

  /**
   * Project-local user directory.
   * Source of truth: ePostal_2026 > ผู้ใช้งานระบบ
   */
  _getUsersSheet: function(createIfMissing) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL);
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet && createIfMissing) {
      sheet = ss.insertSheet(SHEET_NAMES.USERS);
    }
    if (sheet && sheet.getLastRow() === 0 && createIfMissing) {
      var headers = [
        "\u0e23\u0e2b\u0e31\u0e2a\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19",
        "\u0e2d\u0e35\u0e40\u0e21\u0e25 (Google)",
        "\u0e0a\u0e37\u0e48\u0e2d-\u0e19\u0e32\u0e21\u0e2a\u0e01\u0e38\u0e25",
        "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c (Admin/User/Postal)",
        "\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19/\u0e41\u0e1c\u0e19\u0e01",
        "\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#3f3f46").setFontColor("white");
      sheet.setFrozenRows(1);
    }
    return sheet;
  },

  getUsers: function() {
    const cacheKey = "PROJECT_SYSTEM_USERS_V1";
    try {
      var cached = Service_Cache.get(cacheKey);
      if (cached && cached.length > 0) return cached;

      var sheet = this._getUsersSheet(false);
      if (!sheet) return [];

      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];

      var headers = data[0].map(function(h) { return String(h).trim(); });
      var emailIdx = getHeaderIndex(headers, ["Email", "\u0e2d\u0e35\u0e40\u0e21\u0e25", "\u0e2d\u0e35\u0e40\u0e21\u0e25 (Google)", "Google"]);
      var nameIdx = getHeaderIndex(headers, ["FullName", "Name", "\u0e0a\u0e37\u0e48\u0e2d", "\u0e0a\u0e37\u0e48\u0e2d-\u0e19\u0e32\u0e21\u0e2a\u0e01\u0e38\u0e25"]);
      var roleIdx = getHeaderIndex(headers, ["Role", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c (Admin/User/Postal)"]);
      var deptIdx = getHeaderIndex(headers, ["Department", "Dept", "\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19", "\u0e2a\u0e31\u0e07\u0e01\u0e31\u0e14", "\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19/\u0e41\u0e1c\u0e19\u0e01"]);
      var pictureIdx = getHeaderIndex(headers, ["Picture", "Photo", "\u0e23\u0e39\u0e1b"]);
      if (emailIdx === -1) emailIdx = 1;
      if (nameIdx === -1) nameIdx = 2;
      if (roleIdx === -1) roleIdx = 3;
      if (deptIdx === -1) deptIdx = 4;

      var users = data.slice(1).map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) { obj[h] = row[i]; });

        obj.Email = emailIdx > -1 ? String(row[emailIdx] || "").trim().toLowerCase() : "";
        obj.FullName = nameIdx > -1 ? String(row[nameIdx] || "").trim() : obj.Email;
        obj.Role = roleIdx > -1 ? row[roleIdx] : "User";
        obj.Department = deptIdx > -1 ? row[deptIdx] : "";
        obj.Picture = pictureIdx > -1 ? row[pictureIdx] : "";

        var rawRole = String(obj.Role || "User").trim().toLowerCase();
        if (rawRole === "admin") obj.Role = "Admin";
        else if (rawRole === "postal") obj.Role = "Postal";
        else if (rawRole === "staff") obj.Role = "Staff";
        else obj.Role = "User";
        obj.Department = String(obj.Department || "").trim();

        return obj;
      }).filter(function(u) { return u.Email !== ""; });

      if (users.length > 0) Service_Cache.put(cacheKey, users, 600);
      return users;
    } catch (e) {
      console.error("Error getUsers: " + e.message + " | ID: " + SPREADSHEET_IDS.LOCAL);
      return [];
    }
  },

  addUser: function(userPayload) {
    try {
      var sheet = this._getUsersSheet(true);
      var email = String(userPayload.email).trim().toLowerCase();
      var exists = this.getUsers().find(function(u) { return String(u.Email).toLowerCase() === email; });
      if (exists) return { error: "User already exists with email: " + email };

      var nextId = "USER-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmss");
      // [Security] Validate role against allowlist + sanitize user-controlled strings
      var ALLOWED_ROLES = ["Admin", "User", "Staff", "Postal"];
      var roleVal = String(userPayload.role || "User").trim();
      var roleNorm = roleVal.charAt(0).toUpperCase() + roleVal.slice(1).toLowerCase();
      if (ALLOWED_ROLES.indexOf(roleNorm) === -1) {
        return { error: "สิทธิ์ไม่ถูกต้อง ต้องเป็น Admin/User/Staff/Postal เท่านั้น" };
      }
      var rowData = [
        nextId,
        email,
        sanitizeForSheet(userPayload.fullName || email.split("@")[0]),
        roleNorm,
        sanitizeForSheet(userPayload.department || ""),
        ""
      ];

      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        sheet.appendRow(rowData);
      } finally {
        lock.releaseLock();
      }

      Service_Cache.remove("PROJECT_SYSTEM_USERS_V1");
      Service_Cache.remove("SYSTEM_USERS");
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  },

  updateUser: function(userPayload) {
    try {
      var sheet = this._getUsersSheet(false);
      if (!sheet) return { error: "Project users sheet missing" };
      var data = sheet.getDataRange().getValues();
      if (data.length === 0) return { error: "Empty sheet" };
      var headers = data[0].map(function(h) { return String(h).trim(); });
      var emailIdx = getHeaderIndex(headers, ["Email", "\u0e2d\u0e35\u0e40\u0e21\u0e25", "\u0e2d\u0e35\u0e40\u0e21\u0e25 (Google)", "Google"]);
      var roleIdx = getHeaderIndex(headers, ["Role", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c (Admin/User/Postal)"]);
      var deptIdx = getHeaderIndex(headers, ["Department", "Dept", "\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19", "\u0e2a\u0e31\u0e07\u0e01\u0e31\u0e14", "\u0e2b\u0e19\u0e48\u0e27\u0e22\u0e07\u0e32\u0e19/\u0e41\u0e1c\u0e19\u0e01"]);
      if (emailIdx === -1) emailIdx = 1;
      if (roleIdx === -1) roleIdx = 3;
      if (deptIdx === -1) deptIdx = 4;

      var targetEmail = String(userPayload.email).toLowerCase();

      // [Security] Guards: self-demotion + last-admin (defense-in-depth, RBAC is primary gate)
      var actorEmail = String(userPayload.staffEmail || userPayload.userEmail || "").toLowerCase();
      var newRole = userPayload.newRole ? String(userPayload.newRole).trim() : null;
      var currentRoleOfTarget = null;
      var adminCount = 0;
      for (var s = 1; s < data.length; s++) {
        var r = String(data[s][roleIdx] || "").trim().toLowerCase();
        if (r === "admin") adminCount++;
        if (String(data[s][emailIdx]).toLowerCase() === targetEmail) {
          currentRoleOfTarget = String(data[s][roleIdx] || "").trim().toLowerCase();
        }
      }

      // Self-demotion: ลดสิทธิ์ตัวเอง
      if (actorEmail && targetEmail === actorEmail && newRole && newRole.toLowerCase() !== "admin") {
        return { error: "ไม่สามารถลดสิทธิ์ตัวเองได้ กรุณาให้ผู้ดูแลคนอื่นดำเนินการ" };
      }
      // Last-admin: target กำลังเป็น Admin และจะถูกลดสิทธิ์ ขณะที่เหลือ Admin เพียงคนเดียว
      if (newRole && newRole.toLowerCase() !== "admin" && currentRoleOfTarget === "admin" && adminCount <= 1) {
        return { error: "ไม่สามารถลดสิทธิ์ผู้ดูแลคนสุดท้ายได้ กรุณาแต่งตั้งผู้ดูแลคนอื่นก่อน" };
      }

      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][emailIdx]).toLowerCase() === targetEmail) {
            if (userPayload.newRole && roleIdx > -1) sheet.getRange(i + 1, roleIdx + 1).setValue(sanitizeForSheet(userPayload.newRole));
            if (typeof userPayload.newDepartment !== "undefined" && deptIdx > -1) sheet.getRange(i + 1, deptIdx + 1).setValue(sanitizeForSheet(userPayload.newDepartment));
            Service_Cache.remove("PROJECT_SYSTEM_USERS_V1");
            Service_Cache.remove("SYSTEM_USERS");
            return { success: true };
          }
        }
        return { error: "User not found" };
      } finally {
        lock.releaseLock();
      }
    } catch (e) {
      return { error: e.message };
    }
  },

  deleteUser: function(email, context) {
    try {
      var sheet = this._getUsersSheet(false);
      if (!sheet) return { error: "Project users sheet missing" };
      var data = sheet.getDataRange().getValues();
      if (data.length === 0) return { error: "Empty sheet" };
      var headers = data[0].map(function(h) { return String(h).trim(); });
      var emailIdx = getHeaderIndex(headers, ["Email", "\u0e2d\u0e35\u0e40\u0e21\u0e25", "\u0e2d\u0e35\u0e40\u0e21\u0e25 (Google)", "Google"]);
      var roleIdx = getHeaderIndex(headers, ["Role", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c", "\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c (Admin/User/Postal)"]);
      if (emailIdx === -1) emailIdx = 1;
      if (roleIdx === -1) roleIdx = 3;

      var targetEmail = String(email).toLowerCase();

      // [Security] Guards: self-delete + last-admin
      var ctx = context || {};
      var actorEmail = String(ctx.staffEmail || ctx.userEmail || "").toLowerCase();
      if (actorEmail && targetEmail === actorEmail) {
        return { error: "ไม่สามารถลบบัญชีตัวเองได้" };
      }
      var adminCount = 0;
      var targetIsAdmin = false;
      for (var s = 1; s < data.length; s++) {
        var r = String(data[s][roleIdx] || "").trim().toLowerCase();
        if (r === "admin") {
          adminCount++;
          if (String(data[s][emailIdx]).toLowerCase() === targetEmail) targetIsAdmin = true;
        }
      }
      if (targetIsAdmin && adminCount <= 1) {
        return { error: "ไม่สามารถลบผู้ดูแลคนสุดท้ายได้ กรุณาแต่งตั้งผู้ดูแลคนอื่นก่อน" };
      }

      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        for (var i = data.length - 1; i >= 1; i--) {
          if (String(data[i][emailIdx]).toLowerCase() === targetEmail) {
            sheet.deleteRow(i + 1);
            Service_Cache.remove("PROJECT_SYSTEM_USERS_V1");
            Service_Cache.remove("SYSTEM_USERS");
            return { success: true };
          }
        }
        return { error: "User not found" };
      } finally {
        lock.releaseLock();
      }
    } catch (e) {
      return { error: e.message };
    }
  },

  /**
   * setupUptimeMonitor
   * Installs the time-driven trigger for system health monitoring.
   */
  setupUptimeMonitor: function() {
    try {
      return typeof setupUptimeMonitor === 'function' ? setupUptimeMonitor() : { success: false, error: "Monitor Service not found" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
