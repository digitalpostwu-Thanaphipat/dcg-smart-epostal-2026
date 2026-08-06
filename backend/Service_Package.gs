/**
 * Service_Package.gs - VERSION 35 (PRODUCTION HARDENED)
 * Standardized response structure and robust shard retrieval.
 */
var Service_Package = {
  /**
   * [Security] Private helper to verify user role.
   * @private
   */
  _verifyRole: function (email, allowedRoles) {
    if (!email) return false;
    const cleanEmail = String(email).trim().toLowerCase();
    const cache = CacheService.getUserCache();
    const cacheKey = "user_role_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
    let role = cache.get(cacheKey);

    if (!role) {
      const users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      const user = users.find((u) => String(u.Email).toLowerCase() === cleanEmail);
      if (!user) return false;
      role = String(user.Role || "User").trim();
      cache.put(cacheKey, role, 900);
    }
    return allowedRoles.some((r) => r.toLowerCase() === role.toLowerCase());
  },

  initSheet: function () {
    var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG, null, { skipSchemaValidation: true });
    if (!sheet) {
      // Sheet doesn't exist - create it in the local database
      try {
        var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL);
        sheet = ss.insertSheet(SHEET_NAMES.PACKAGE_LOG);
        console.log("Created missing PACKAGE_LOG sheet");
      } catch (e) {
        console.error("Failed to create PACKAGE_LOG sheet: " + e.message);
        return null;
      }
    }
    if (sheet.getLastRow() === 0) {
      var headers = [
        "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับไปรษณีย์ภัณฑ์", "สถานะ",
        "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับตามจ่าหน้า", "ลายเซ็น",
        "รูปภาพ", "พิกัด GPS", "วิธีการส่งมอบ", "ประเภทการใช้", "หมายเหตุ / Line",
        "ผู้บันทึก", "ผู้อัปเดตล่าสุด"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground("#0d9488")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  },

  /**
   * [Materialized] updateStatsSnapshot
   * Updates the pre-calculated stats sheet.
   */
  /**
   * [Materialized] recalculateStatsSnapshot
   * Force rebuilds the stats sheet by scanning the full log.
   */
  recalculateStatsSnapshot: function() {
    // 1. Harden Schema first
    Service_Schema.repairPackageLogHeaders();
    
    var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
    var data = sheet.getDataRange().getValues();
    
    var overall = { 
      total: 0, pending: 0, delivered: 0, 
      personal: 0, reg: 0, ord: 0 
    };
    var deptStats = {}; // { "DeptName": { total: 0, pending: 0, delivered: 0, personal: 0, reg: 0, ord: 0 } }
    var yoyLocal = {}; // Current year YoY stats
    
    if (data.length > 1) {
      var headers = data[0];
      var statusIdx = getHeaderIndex(headers, "สถานะ");
      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department"]);
      var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type"]);
      var useTypeIdx = getHeaderIndex(headers, ["ประเภทการใช้", "Use Type"]);
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Received At"]);
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var s = String(row[statusIdx] || "").trim();
        var d = String(row[deptIdx] || "ไม่ระบุหน่วยงาน").trim();
        var t = String(row[typeIdx] || "").trim();
        var u = String(row[useTypeIdx] || "").trim();
        var rawDate = row[dateIdx];
        
        if (!deptStats[d]) deptStats[d] = { total: 0, pending: 0, delivered: 0, personal: 0, reg: 0, ord: 0 };
        
        overall.total++;
        deptStats[d].total++;
        
        // Status checks
        var isPending = s === "รอนำจ่าย" || s === "รอจ่าย" || s.toLowerCase() === "pending";
        var isDelivered = s === "จ่ายสำเร็จ" || s === "จ่ายแล้ว" || s === "ส่งมอบแล้ว" || s.toLowerCase() === "delivered";
        
        if (isPending) { overall.pending++; deptStats[d].pending++; }
        if (isDelivered) { overall.delivered++; deptStats[d].delivered++; }

        // Use Type checks (Personal vs Work)
        var isPersonal = u.indexOf("ส่วนบุคคล") > -1 || u.indexOf("ส่วนตัว") > -1 || u.toLowerCase().includes("personal");
        if (isPersonal) { overall.personal++; deptStats[d].personal++; }

        // Item Type checks (Reg/EMS vs Ord)
        var isReg = t.indexOf("ลงทะเบียน") > -1 || t.indexOf("EMS") > -1 || t.toLowerCase().includes("reg");
        if (isReg) { overall.reg++; deptStats[d].reg++; }
        else { overall.ord++; deptStats[d].ord++; }

        // YoY tracking for current log (Hardened Fiscal Year Logic)
        var dObj = (rawDate instanceof Date) ? rawDate : Service_Utils.parseDate(rawDate);
        if (dObj) {
          var fy = Service_Utils.getThaiFiscalYear(dObj);
          if (!yoyLocal[fy]) yoyLocal[fy] = { total: 0, completed: 0 };
          yoyLocal[fy].total++;
          if (isDelivered) yoyLocal[fy].completed++;
        }
      }
    }
    
    // Calculate successDepts and pendingDepts
    var pendingDepts = 0;
    var successDepts = 0;
    Object.keys(deptStats).forEach(function(dept) {
      if (deptStats[dept].pending > 0) pendingDepts++;
      else if (deptStats[dept].delivered > 0) successDepts++;
    });

    // Clear and rewrite snapshot with hardened dimensions
    var statsSheet = getSheet(SHEET_NAMES.SYSTEM_STATS);
    statsSheet.clearContents();
    
    var rows = [["หมวดหมู่", "ตัวชี้วัด", "ค่าตัวเลข", "อัปเดตล่าสุด"]];
    var now = new Date();
    
    // Add Overall Metrics
    rows.push(["ภาพรวม", "ทั้งหมด", overall.total, now]);
    rows.push(["ภาพรวม", "รอนำจ่าย", overall.pending, now]);
    rows.push(["ภาพรวม", "ส่งมอบแล้ว", overall.delivered, now]);
    rows.push(["ภาพรวม", "ส่วนบุคคล", overall.personal, now]);
    rows.push(["ภาพรวม", "ลงทะเบียน/EMS", overall.reg, now]);
    rows.push(["ภาพรวม", "ธรรมดา", overall.ord, now]);
    rows.push(["ภาพรวม", "หน่วยงานที่ส่งครบ", successDepts, now]);
    rows.push(["ภาพรวม", "หน่วยงานที่ค้างส่ง", pendingDepts, now]);
    
    // Add YoY from historical shards + current
    var yoyCache = {};
    try {
      var cachedStr = PropertiesService.getScriptProperties().getProperty("YOY_STATS_CACHE");
      if (cachedStr) yoyCache = JSON.parse(cachedStr);
    } catch(e) {
      console.warn("Failed to parse YOY_STATS_CACHE: " + e.message);
    }
    
    // Merge current year data into yoyCache
    Object.keys(yoyLocal).forEach(function(yr) {
      yoyCache[yr] = yoyLocal[yr];
    });

    Object.keys(yoyCache).sort().reverse().forEach(function(yr) {
      rows.push(["เปรียบเทียบปี", yr + "_total", yoyCache[yr].total, now]);
      rows.push(["เปรียบเทียบปี", yr + "_completed", yoyCache[yr].completed, now]);
    });

    // Add Per Department Metrics
    Object.keys(deptStats).sort().forEach(function(dept) {
      var ds = deptStats[dept];
      rows.push(["หน่วยงาน: " + dept, "ทั้งหมด", ds.total, now]);
      rows.push(["หน่วยงาน: " + dept, "รอนำจ่าย", ds.pending, now]);
      rows.push(["หน่วยงาน: " + dept, "ส่งมอบแล้ว", ds.delivered, now]);
      rows.push(["หน่วยงาน: " + dept, "ส่วนบุคคล", ds.personal, now]);
      rows.push(["หน่วยงาน: " + dept, "ลงทะเบียน/EMS", ds.reg, now]);
      rows.push(["หน่วยงาน: " + dept, "ธรรมดา", ds.ord, now]);
    });
    
    if (rows.length > 1) {
      statsSheet.getRange(1, 1, rows.length, 4).setValues(rows);
    }
    
    return { success: true, stats: overall, departmentCount: Object.keys(deptStats).length };
  },

  /**
   * [Integrity] normalizeTracking
   * Standardizes tracking numbers (Trim + UpperCase) to prevent case-sensitivity bypass.
   */
  _normalizeTracking: function(no) {
    if (!no || no === "-") return "-";
    return String(no).trim().toUpperCase();
  },

  _updateStatsSnapshot: function(updates, category = "ภาพรวม") {
    try {
      var sheet = getSheet(SHEET_NAMES.SYSTEM_STATS);
      if (!sheet) return;
      var data = sheet.getDataRange().getValues();
      var now = new Date();
      var changes = false;

      // Create a map for faster lookup
      var metricsMap = {};
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === category) {
          metricsMap[data[i][1]] = i + 1; // Store row number
        }
      }

      Object.keys(updates).forEach(function(metric) {
        var increment = updates[metric];
        var metricAliases = metric === "ส่วนบุคคล" ? ["ส่วนบุคคล", "ส่วนตัว"] : [metric];
        var rowIdx = 0;
        metricAliases.some(function(alias) {
          if (metricsMap[alias]) {
            rowIdx = metricsMap[alias];
            return true;
          }
          return false;
        });
        if (rowIdx) {
          var currentVal = Number(data[rowIdx - 1][2]) || 0;
          var metricCol = getHeaderIndex(data[0], "ตัวชี้วัด");
          var valueCol = getHeaderIndex(data[0], "ค่าตัวเลข");
          var updateCol = getHeaderIndex(data[0], "อัปเดตล่าสุด");
          metricCol = (metricCol === -1 ? 2 : metricCol + 1);
          valueCol = (valueCol === -1 ? 3 : valueCol + 1);
          updateCol = (updateCol === -1 ? 4 : updateCol + 1);
          
          sheet.getRange(rowIdx, metricCol).setValue(metric);
          sheet.getRange(rowIdx, valueCol).setValue(currentVal + increment);
          sheet.getRange(rowIdx, updateCol).setValue(now);
          changes = true;
        } else {
          sheet.appendRow([category, metric, increment, now]);
          changes = true;
        }
      });
      
      return changes;
    } catch (e) {
      console.error("Stats update failed: " + e.message);
    }
  },

  savePackageEntry: function (payload) {
    var lock = LockService.getScriptLock();
    try {
      var staffEmail = payload.userEmail || payload.staffEmail || "system";
      if (!this._verifyRole(staffEmail, ["Admin", "Postal", "Staff"])) {
        throw new Error("คุณไม่มีสิทธิ์ในการบันทึกข้อมูล");
      }

      // [P2-2 Idempotency] กันข้อมูลซ้ำจาก retry/sync ถ้าส่งซ้ำด้วย key เดิม → คืนผลเดิม
      if (payload.idempotencyKey) {
        var idemCacheKey = "saveEntry_idem_" + String(payload.idempotencyKey).replace(/[^a-zA-Z0-9-]/g, "_");
        var cached = CacheService.getScriptCache().get(idemCacheKey);
        if (cached) {
          // เคยประมวลผลแล้ว → คืนผลเดิม ไม่สร้างซ้ำ
          console.log("Idempotency hit: saveEntry key=" + payload.idempotencyKey + " → return cached");
          return JSON.parse(cached);
        }
      }

      lock.waitLock(30000);
      this.initSheet();
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG, null, { skipSchemaValidation: true });
      if (!sheet) {
        throw new Error("ไม่พบชีทรายการพัสดุ กรุณาติดต่อผู้ดูแลระบบ");
      }
      var lastRow = sheet.getLastRow();
      var deptName = sanitizeForSheet(payload.departmentName || payload.deptName);
      if (!deptName) throw new Error("ไม่พบชื่อหน่วยงาน");

      var now = new Date();
      var fullDateTimeStr = typeof Service_Utils !== "undefined" 
        ? Service_Utils.formatThaiDateTime(now) 
        : now.toLocaleString("th-TH");

      // [Hardening] Read headers dynamically for header-mapped writes
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var colCount = headers.length;

      // [Hardening] Email → FullName resolution
      var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      var userMap = {};
      users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });
      var staffName = userMap[String(staffEmail).toLowerCase()] || staffEmail;

      /** Build a row array mapped by header index */
      function buildRow(data) {
        var row = new Array(colCount).fill("");
        var aliases = {
          "ชื่อผู้รับไปรษณีย์ภัณฑ์": ["ชื่อผู้รับไปรษณีย์ภัณฑ์", "ชื่อผู้รับ"]
        };
        Object.keys(data).forEach(function(key) {
          var idx = getHeaderIndex(headers, aliases[key] || key);
          if (idx > -1) row[idx] = data[key];
        });
        // [P1-5] Default version to 1 for new rows
        var vIdx = getHeaderIndex(headers, ["version", "Version"]);
        if (vIdx > -1 && !row[vIdx]) row[vIdx] = 1;
        return row;
      }
      
      var recipientName = sanitizeForSheet(payload.recipientName || "เจ้าหน้าที่หน่วยงาน");
      var personalQty = parseInt(payload.personalQty) || 0;
      var workQty = parseInt(payload.workQty) || 0;
      var rowsToAppend = [];
      var count = 0;

      // ORD Processing
      if (personalQty > 0 || workQty > 0) {
        var ordInfo = Service_Utils.getLatestSequence(sheet, "ORD");
        var offset = 1;
        for (var i = 0; i < personalQty; i++) {
          var id = `ORD-${ordInfo.dateStr}-${String(ordInfo.seq + offset++).padStart(4, "0")}`;
          rowsToAppend.push(buildRow({
            "รหัสพัสดุ": id, "เลขพัสดุ": "-", "ประเภท": "ไปรษณีย์ธรรมดา",
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับไปรษณีย์ภัณฑ์": recipientName, "สถานะ": "รอนำจ่าย",
            "เวลาที่บันทึก": fullDateTimeStr, "จนท.ผู้นำจ่าย": staffName,
            "วิธีการส่งมอบ": "ส่งมอบที่หน่วยงาน", "ประเภทการใช้": "ส่วนบุคคล",
            "หมายเหตุ / Line": "-", "ผู้บันทึก": staffName
          }));
          count++;
        }
        for (var j = 0; j < workQty; j++) {
          var id = `ORD-${ordInfo.dateStr}-${String(ordInfo.seq + offset++).padStart(4, "0")}`;
          rowsToAppend.push(buildRow({
            "รหัสพัสดุ": id, "เลขพัสดุ": "-", "ประเภท": "ไปรษณีย์ธรรมดา",
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับไปรษณีย์ภัณฑ์": recipientName, "สถานะ": "รอนำจ่าย",
            "เวลาที่บันทึก": fullDateTimeStr, "จนท.ผู้นำจ่าย": staffName,
            "วิธีการส่งมอบ": "ส่งมอบที่หน่วยงาน", "ประเภทการใช้": "งานมหาวิทยาลัย",
            "หมายเหตุ / Line": "-", "ผู้บันทึก": staffName
          }));
          count++;
        }
        Service_Utils.setLatestSequence("ORD", ordInfo.seq + offset - 1);
      }

      // EMS/REG Processing
      if (payload.emsList && payload.emsList.length > 0) {
        var emsInfo = Service_Utils.getLatestSequence(sheet, "EMS");
        var regInfo = Service_Utils.getLatestSequence(sheet, "REG");
        var eOff = 1, rOff = 1;

        // [Security] Pre-check for duplicate tracking numbers in current sheet
        var existingTracking = [];
        if (lastRow > 0) {
           existingTracking = sheet.getRange(1, 2, lastRow, 1).getValues().flat().map(function(t) { return String(t || "").trim(); });
        }

        payload.emsList.forEach(function (item) {
          var trackingNo = Service_Package._normalizeTracking(item.trackingNumber || item.trackingNo || "-");
          if (trackingNo !== "-" && existingTracking.indexOf(trackingNo) > -1) {
            throw new Error("เลขพัสดุ " + trackingNo + " ถูกบันทึกเข้าระบบไปแล้ว ไม่สามารถบันทึกซ้ำได้");
          }

          var isEms = item.itemType === "EMS" || item.itemType === "ไปรษณีย์ด่วนพิเศษ (EMS)";
          var info = isEms ? emsInfo : regInfo;
          var off = isEms ? eOff++ : rOff++;
          var id = `${isEms ? 'EMS' : 'REG'}-${info.dateStr}-${String(info.seq + off).padStart(4, "0")}`;
          
          var recipientNameInRow = sanitizeForSheet(item.recipientName || item.receiverName || recipientName);
          var thaiItemType = isEms ? "ไปรษณีย์ด่วนพิเศษ (EMS)" : "ไปรษณีย์ลงทะเบียน";
          
          rowsToAppend.push(buildRow({
            "รหัสพัสดุ": id, "เลขพัสดุ": trackingNo, "ประเภท": thaiItemType,
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับไปรษณีย์ภัณฑ์": recipientNameInRow, "สถานะ": "รอนำจ่าย",
            "เวลาที่บันทึก": fullDateTimeStr, "จนท.ผู้นำจ่าย": staffName,
            "วิธีการส่งมอบ": "ส่งมอบที่หน่วยงาน",
            "ประเภทการใช้": item.isPersonal ? "ส่วนบุคคล" : "งานมหาวิทยาลัย",
            "หมายเหตุ / Line": sanitizeForSheet(item.notes || "-"), "ผู้บันทึก": staffName
          }));
          count++;
        });
        
        if (eOff > 1) Service_Utils.setLatestSequence("EMS", emsInfo.seq + eOff - 1);
        if (rOff > 1) Service_Utils.setLatestSequence("REG", regInfo.seq + rOff - 1);
      }

      if (rowsToAppend.length > 0) {
        sheet.getRange(lastRow + 1, 1, rowsToAppend.length, colCount).setValues(rowsToAppend);
      
        // Update Stats Snapshot (Real-time Batch)
        var overallUpdates = { "ทั้งหมด": count, "รอนำจ่าย": count };
        var deptUpdates = { "ทั้งหมด": count, "รอนำจ่าย": count };

        // Detail counts for expanded stats
        var pCount = 0, rCount = 0, oCount = 0;
        rowsToAppend.forEach(function(r) {
          var type = r[getHeaderIndex(headers, "ประเภท")];
          var use = r[getHeaderIndex(headers, "ประเภทการใช้")];
          if (use === "ส่วนบุคคล" || use === "ส่วนตัว" || use === "ธุระส่วนตัว (ส่วนบุคคล)") pCount++;
          if (type.indexOf("ลงทะเบียน") > -1 || type.indexOf("EMS") > -1) rCount++;
          else oCount++;
        });

        overallUpdates["ส่วนบุคคล"] = pCount;
        overallUpdates["ลงทะเบียน/EMS"] = rCount;
        overallUpdates["ธรรมดา"] = oCount;
        
        deptUpdates["ส่วนบุคคล"] = pCount;
        deptUpdates["ลงทะเบียน/EMS"] = rCount;
        deptUpdates["ธรรมดา"] = oCount;

        this._updateStatsSnapshot(overallUpdates, "ภาพรวม");
        this._updateStatsSnapshot(deptUpdates, "หน่วยงาน: " + deptName);
      }

      var result = { success: true, count: count, message: "บันทึกสำเร็จ " + count + " รายการ" };

      // [P2-2 Idempotency] เก็บผลลัพธ์ไว้ 15 นาที เพื่อ dedupe retry
      if (payload.idempotencyKey) {
        var idemKey = "saveEntry_idem_" + String(payload.idempotencyKey).replace(/[^a-zA-Z0-9-]/g, "_");
        CacheService.getScriptCache().put(idemKey, JSON.stringify(result), 900);
      }

      return result;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  getPendingDeliveries: function () {
    try {
      this.initSheet();
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      if (!sheet) return { success: false, error: "ไม่พบชีทข้อมูล" };
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { success: true, data: [] };

      var data = sheet.getRange(1, 1, lastRow, 17).getValues();
      var headers = data[0];
      var idIdx = getHeaderIndex(headers, ["รหัสพัสดุ", "Package ID", "ID"]);
      var trackIdx = getHeaderIndex(headers, ["เลขพัสดุ", "Tracking No", "Tracking Number"]);
      var typeIdx = getHeaderIndex(headers, ["ประเภท", "Type", "Item Type"]);
      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department", "Dept Name"]);
      var recIdx = getHeaderIndex(headers, ["ชื่อผู้รับไปรษณีย์ภัณฑ์", "ชื่อผู้รับ", "Receiver Name", "Recipient Name"]);
      var statusIdx = getHeaderIndex(headers, ["สถานะ", "Status"]);
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Created At", "Received At"]);
      var delivererIdx = getHeaderIndex(headers, ["จนท.ผู้นำจ่าย", "Staff", "Deliverer"]);
      var versionIdx = getHeaderIndex(headers, ["version", "Version"]);

      if (idIdx === -1 || statusIdx === -1) {
        console.error("Header Error: idIdx=" + idIdx + ", statusIdx=" + statusIdx + " | Headers: " + JSON.stringify(headers));
        return { success: false, error: "โครงสร้างหัวตารางไม่ถูกต้อง (ไม่พบคอลัมน์ ID หรือ Status)" };
      }

      var depts = typeof AdminService !== "undefined" ? AdminService.getDepartments() : [];
      var deptMap = {};
      if (Array.isArray(depts)) {
        depts.forEach(function (d) { deptMap[d.DeptName] = { building: d.Building, floor: d.Floor }; });
      }

      // Fetch users for email-to-name mapping
      var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      var userMap = {};
      users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });

      var pending = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var sStatus = String(row[statusIdx] || "").trim();
        
        // Status Mapping for UI (Handle both Thai and English keys)
        var isPending = sStatus === "รอนำจ่าย" || sStatus === "รอจ่าย" || sStatus.toLowerCase() === "pending";
        
        if (isPending) {
          var dName = String(row[deptIdx] || "ไม่ระบุหน่วยงาน").trim();
          if (dName === "-" || dName === "") dName = "ไม่ระบุหน่วยงาน";
          
          var bInfo = deptMap[dName] || { building: "-", floor: "-" };
          var rawDate = row[dateIdx];
          var formattedDate = (rawDate instanceof Date) 
            ? Service_Utils.formatThaiDateTime(rawDate) 
            : String(rawDate);
            
          var staffEmail = String(row[delivererIdx] || "").toLowerCase();

          pending.push({
            id: row[idIdx],
            packageId: row[idIdx],
            trackingNo: row[trackIdx] || "-",
            trackingNumber: row[trackIdx] || "-",
            itemType: row[typeIdx] || "พัสดุ",
            type: row[typeIdx] || "พัสดุ",
            deptName: dName,
            department: dName,
            recipientName: row[recIdx] || "ไม่ระบุชื่อ",
            status: row[statusIdx],
            receivedAt: formattedDate,
            date: formattedDate,
            building: bInfo.building,
            floor: bInfo.floor,
            deliverer: userMap[staffEmail] || staffEmail || "-",
            version: versionIdx !== -1 ? (parseInt(row[versionIdx], 10) || 0) : 0
          });
        }
      }
      return { success: true, data: pending };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  confirmDelivery: function (data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var headers = pData[0];
      var idIdx = getHeaderIndex(headers, "รหัสพัสดุ");
      var statusIdx = getHeaderIndex(headers, "สถานะ");
      var timeOutIdx = getHeaderIndex(headers, "เวลาที่จ่าย");
      var receiverIdx = getHeaderIndex(headers, ["ผู้รับตามจ่าหน้า", "ผู้รับจริง", "Signer", "Actual Receiver"]);
      var methodIdx = getHeaderIndex(headers, "วิธีการส่งมอบ");
      var staffIdx = getHeaderIndex(headers, "จนท.ผู้นำจ่าย");
      var signIdx = getHeaderIndex(headers, "ลายเซ็น");
      var photoIdx = getHeaderIndex(headers, "รูปภาพ");
      var gpsIdx = getHeaderIndex(headers, "พิกัด GPS");
      var updaterIdx = getHeaderIndex(headers, "ผู้อัปเดตล่าสุด");
      var versionIdx = getHeaderIndex(headers, ["version", "Version"]);

      var pkgIds = data.packageIds || [];
      var count = 0;
      var nowStr = typeof Service_Utils !== "undefined" ? Service_Utils.formatThaiDateTime(new Date()) : new Date().toLocaleString("th-TH");

      // [Hardening] Email → FullName resolution
      var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      var userMap = {};
      users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });
      var staffName = data.staffEmail ? (userMap[String(data.staffEmail).toLowerCase()] || data.staffEmail) : "";
      var signatureImage = String(data.signatureImage || "");
      // [Security] Signature is mandatory — reject empty
      if (!signatureImage) {
        return { success: false, error: "กรุณาลงลายเซ็นก่อนยืนยันนำจ่าย" };
      }
      // [Security] Strict base64 validation — reject URLs, text, or malformed input
      if (!/^data:image\/[a-z]+;base64,.+/.test(signatureImage)) {
        return { success: false, error: "ลายเซ็นต้องเป็นรูปแบบ data:image/...;base64,... เท่านั้น" };
      }

      // [P1-5] Conflict control — check versions BEFORE saving signature to Drive
      var expectedVersions = data.expectedVersions || {};
      if (versionIdx !== -1 && Object.keys(expectedVersions).length > 0) {
        var conflicts = [];
        for (var i = 1; i < pData.length; i++) {
          var pId = String(pData[i][idIdx]);
          if (pkgIds.indexOf(pId) > -1) {
            var currentVersion = parseInt(pData[i][versionIdx], 10) || 0;
            var expectedVersion = parseInt(expectedVersions[pId], 10) || 0;
            if (expectedVersion > 0 && currentVersion !== expectedVersion) {
              conflicts.push({
                packageId: pId,
                expected: expectedVersion,
                current: currentVersion,
                currentStatus: String(pData[i][statusIdx] || "")
              });
            }
          }
        }
        if (conflicts.length > 0) {
          return { success: false, error: "CONFLICT", conflicts: conflicts };
        }
      }

      // Save signature only after version check passes
      var signatureUrl = "";
      if (typeof Service_Utils === "undefined" || !Service_Utils.saveBase64ToDrive) {
        return { success: false, error: "ระบบบันทึกลายเซ็นไม่พร้อมใช้งาน" };
      }
      signatureUrl = Service_Utils.saveBase64ToDrive(signatureImage, "signature_" + nowStr.replace(/[^\dA-Za-zก-๙]+/g, "_"));
      if (!signatureUrl) {
        return { success: false, error: "ไม่สามารถบันทึกลายเซ็นได้ กรุณาลองใหม่" };
      }
      // [Security] Store file ID directly — frontend fetches via authenticated endpoint
      var signatureFormula = signatureUrl || "";

      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department"]);
      var updateColumns = [statusIdx, timeOutIdx, receiverIdx, methodIdx];
      var useSignatureFormula = signIdx !== -1 && data.signatureImage && signatureFormula;
      if (staffName && staffIdx !== -1) updateColumns.push(staffIdx);
      if (signIdx !== -1 && data.signatureImage && !useSignatureFormula) updateColumns.push(signIdx);
      if (photoIdx !== -1 && data.photoImage) updateColumns.push(photoIdx);
      if (gpsIdx !== -1 && data.gpsCoordinates) updateColumns.push(gpsIdx);
      if (updaterIdx !== -1 && staffName) updateColumns.push(updaterIdx);
      updateColumns = updateColumns.filter(function(idx, pos, arr) {
        return idx !== -1 && arr.indexOf(idx) === pos;
      }).sort(function(a, b) { return a - b; });
      var columnGroups = [];
      updateColumns.forEach(function(idx) {
        var lastGroup = columnGroups[columnGroups.length - 1];
        if (lastGroup && lastGroup.end + 1 === idx) {
          lastGroup.end = idx;
        } else {
          columnGroups.push({ start: idx, end: idx });
        }
      });
      var updatedRows = [];
      var deptCounts = {};
      function setRowValue(rowValues, idx, value) {
        if (idx !== -1) rowValues[idx] = value;
      }

      for (var i = 1; i < pData.length; i++) {
        var pId = String(pData[i][idIdx]);
        if (pkgIds.indexOf(pId) > -1) {
          var row = i + 1;
          var pDept = String(pData[i][deptIdx] || "ไม่ระบุหน่วยงาน").trim();
          
          setRowValue(pData[i], statusIdx, "ส่งมอบแล้ว");
          setRowValue(pData[i], timeOutIdx, nowStr);
          setRowValue(pData[i], receiverIdx, sanitizeForSheet(data.signatureName || "เซ็นรับผ่านระบบ"));
          setRowValue(pData[i], methodIdx, sanitizeForSheet(data.deliveryMethod || "ส่งมอบที่หน่วยงาน"));
          if (staffName) setRowValue(pData[i], staffIdx, staffName);
          
          // Signature is written via setValues in columnGroups below (useSignatureFormula path)
          setRowValue(pData[i], photoIdx, data.photoImage);
          setRowValue(pData[i], gpsIdx, data.gpsCoordinates);
          if (staffName) setRowValue(pData[i], updaterIdx, staffName);

          updatedRows.push(row);
          deptCounts[pDept] = (deptCounts[pDept] || 0) + 1;
          count++;
        }
      }
      if (count > 0 && columnGroups.length > 0) {
        var rowGroups = [];
        updatedRows.sort(function(a, b) { return a - b; }).forEach(function(row) {
          var lastGroup = rowGroups[rowGroups.length - 1];
          if (lastGroup && lastGroup.end + 1 === row) {
            lastGroup.end = row;
          } else {
            rowGroups.push({ start: row, end: row });
          }
        });
        rowGroups.forEach(function(rowGroup) {
          columnGroups.forEach(function(colGroup) {
            var values = [];
            for (var rowNum = rowGroup.start; rowNum <= rowGroup.end; rowNum++) {
              values.push(pData[rowNum - 1].slice(colGroup.start, colGroup.end + 1));
            }
            sheet.getRange(
              rowGroup.start,
              colGroup.start + 1,
              rowGroup.end - rowGroup.start + 1,
              colGroup.end - colGroup.start + 1
            ).setValues(values);
          });
          if (useSignatureFormula) {
            // [Security] Store file ID as value (not formula) — frontend fetches via authenticated endpoint
            var sigValues = [];
            for (var formulaRow = rowGroup.start; formulaRow <= rowGroup.end; formulaRow++) {
              sigValues.push([signatureFormula]);
            }
            sheet.getRange(
              rowGroup.start,
              signIdx + 1,
              rowGroup.end - rowGroup.start + 1,
              1
            ).setValues(sigValues);
          }
        });
        // [P1-5] Increment version for all updated rows
        if (versionIdx !== -1) {
          updatedRows.forEach(function(row) {
            var curVer = parseInt(pData[row - 1][versionIdx], 10) || 0;
            sheet.getRange(row, versionIdx + 1).setValue(curVer + 1);
          });
        }
        this._updateStatsSnapshot({ "รอนำจ่าย": -count, "ส่งมอบแล้ว": count }, "ภาพรวม");
        Object.keys(deptCounts).forEach(function(deptName) {
          var deptCount = deptCounts[deptName];
          this._updateStatsSnapshot({ "รอนำจ่าย": -deptCount, "ส่งมอบแล้ว": deptCount }, "หน่วยงาน: " + deptName);
        }, this);
      }
      
      return { success: true, count: count };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  getDailyOperationalStats: function (filters) {
    try {
      var stats = {
        todayReceived: 0,
        pendingDelivery: 0,
        deliveredToday: 0,
        personalCount: 0,
        regCount: 0,
        ordCount: 0,
        successDepts: 0,
        pendingDepts: 0,
        yoy: {}
      };

      // 1. Try to fetch from Materialized Snapshot (Priority 1)
      var statsSheet = getSheet(SHEET_NAMES.SYSTEM_STATS);
      var targetDept = filters && filters.departmentName ? filters.departmentName : null;
      var hasDateFilter = filters && (filters.startDate || filters.endDate);
      
      if (statsSheet && !hasDateFilter) {
        var snapshotData = statsSheet.getDataRange().getValues();
        var categoryToFind = targetDept ? "หน่วยงาน: " + targetDept : "ภาพรวม";
        var foundAny = false;

        snapshotData.forEach(function(row) {
          var cat = String(row[0]);
          var metric = String(row[1]);
          var val = Number(row[2]) || 0;

          if (cat === categoryToFind) {
            if (metric === "ทั้งหมด") { stats.todayReceived = val; foundAny = true; }
            if (metric === "รอนำจ่าย") { stats.pendingDelivery = val; foundAny = true; }
            if (metric === "ส่งมอบแล้ว" || metric === "จ่ายสำเร็จ") { stats.deliveredToday = val; foundAny = true; }
            if (metric === "ส่วนบุคคล" || metric === "ส่วนตัว") { stats.personalCount = val; foundAny = true; }
            if (metric === "ลงทะเบียน/EMS") { stats.regCount = val; foundAny = true; }
            if (metric === "ธรรมดา") { stats.ordCount = val; foundAny = true; }
            if (metric === "หน่วยงานที่ส่งครบ") { stats.successDepts = val; foundAny = true; }
            if (metric === "หน่วยงานที่ค้างส่ง") { stats.pendingDepts = val; foundAny = true; }
          }
          
          // YoY stats are always under "เปรียบเทียบปี"
          if (cat === "เปรียบเทียบปี") {
            var yrParts = metric.split("_");
            var yr = yrParts[0];
            var type = yrParts[1];
            if (!stats.yoy[yr]) stats.yoy[yr] = { total: 0, completed: 0 };
            if (type === "total") stats.yoy[yr].total = val;
            if (type === "completed") stats.yoy[yr].completed = val;
          }
        });

        if (foundAny) {
           return { success: true, data: stats, source: "snapshot" };
        }
      }

      // 2. Perform Scan if snapshot missing or date filter active
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return { success: true, data: stats };

      var headers = data[0];
      var statusIdx = getHeaderIndex(headers, "สถานะ");
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Received At"]);
      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department"]);
      var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type"]);
      var useTypeIdx = getHeaderIndex(headers, ["ประเภทการใช้", "Use Type"]);

      // Helper for comparable date strings (YYYYMMDD)
      var toComparableDate = function(dateInput) {
        if (!dateInput) return "";
        var d = (dateInput instanceof Date) ? dateInput : Service_Utils.parseDate(dateInput);
        if (!d) return "";
        var y = d.getFullYear();
        var m = ("0" + (d.getMonth() + 1)).slice(-2);
        var day = ("0" + d.getDate()).slice(-2);
        return y + m + day;
      };

      var startDateComp = filters && filters.startDate ? toComparableDate(filters.startDate) : toComparableDate(new Date());
      var endDateComp = filters && filters.endDate ? toComparableDate(filters.endDate) : startDateComp;

      var pendingDeptSet = {};
      var allDepts = {};
      var deliveredDeptSet = {};

      // Reset for scan
      stats.todayReceived = 0;
      stats.pendingDelivery = 0;
      stats.deliveredToday = 0;

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rawStatus = String(row[statusIdx] || "").trim();
        var sStatus = rawStatus.toLowerCase();
        var isPending = sStatus === "รอนำจ่าย" || sStatus === "รอจ่าย" || sStatus === "pending";
        var isDelivered = sStatus === "จ่ายสำเร็จ" || sStatus === "จ่ายแล้ว" || sStatus === "ส่งมอบแล้ว" || sStatus === "delivered";
        
        var rawDate = row[dateIdx];
        var sDateComp = toComparableDate(rawDate);
        
        var sDept = String(row[deptIdx] || "ไม่ระบุหน่วยงาน").trim();
        var sType = String(row[typeIdx] || "").trim();
        var sUseType = String(row[useTypeIdx] || "").trim();

        var isInRange = sDateComp >= startDateComp && sDateComp <= endDateComp;
        var isMatchDept = !targetDept || sDept === targetDept;

        if (isInRange && isMatchDept) {
          stats.todayReceived++;
          if (isDelivered) stats.deliveredToday++;
          
          if (sUseType.indexOf("ส่วนบุคคล") > -1 || sUseType.indexOf("ส่วนตัว") > -1 || sUseType.toLowerCase().includes("personal")) stats.personalCount++;
          
          if (sType.indexOf("ลงทะเบียน") > -1 || sType.indexOf("EMS") > -1 || sType.toLowerCase().includes("reg")) {
            stats.regCount++;
          } else {
            stats.ordCount++;
          }
        }

        if (isPending) {
          pendingDeptSet[sDept] = true;
          stats.pendingDelivery++;
        }
        if (isDelivered) deliveredDeptSet[sDept] = true;
        if (sDept) allDepts[sDept] = true;

        var year = rawDate instanceof Date ? rawDate.getFullYear() : parseInt(sDateComp ? sDateComp.substring(0,4) : "2026");
        var thaiYear = year > 2400 ? year : year + 543; // [BugFix] Prevent double-adding BE year
        if (!stats.yoy[thaiYear]) stats.yoy[thaiYear] = { total: 0, completed: 0 };
        stats.yoy[thaiYear].total++;
        if (isDelivered) stats.yoy[thaiYear].completed++;
      }

      var deptList = Object.keys(allDepts);
      stats.pendingDepts = Object.keys(pendingDeptSet).length;
      stats.successDepts = deptList.filter(function(d) { return !pendingDeptSet[d] && deliveredDeptSet[d]; }).length;

      return { success: true, data: stats };
    } catch (e) {
      console.error("getDailyOperationalStats Error:", e.message);
      return { success: false, error: e.message };
    }
  },

  revertDelivery: function (data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(20000);
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var headers = pData[0];
      var idIdx = getHeaderIndex(headers, "รหัสพัสดุ");
      var statusIdx = getHeaderIndex(headers, "สถานะ");
      var remarksIdx = getHeaderIndex(headers, "หมายเหตุ / Line");
      var deptIdx = getHeaderIndex(headers, "ชื่อหน่วยงาน");

      for (var i = 1; i < pData.length; i++) {
        if (String(pData[i][idIdx]) === String(data.packageId)) {
          var row = i + 1;
          var prevStatus = String(pData[i][statusIdx] || "").trim();
          var pkgDept = String(pData[i][deptIdx] || "").trim();
          sheet.getRange(row, statusIdx + 1).setValue("รอนำจ่าย");
          sheet.getRange(row, remarksIdx + 1).setValue("ยกเลิก: " + (sanitizeForSheet(data.reason) || "ไม่ระบุ"));

          // [P2-4 Fix] Reconcile stats snapshot — เดิม revert ไม่อัปเดตทำให้ dashboard ผิด
          // ปรับเฉพาะถ้าสถานะเดิมเป็น "ส่งมอบแล้ว" (กัน double-count)
          if (prevStatus === "ส่งมอบแล้ว") {
            try {
              this._updateStatsSnapshot({ "รอนำจ่าย": 1, "ส่งมอบแล้ว": -1 }, "ภาพรวม");
              if (pkgDept) {
                this._updateStatsSnapshot({ "รอนำจ่าย": 1, "ส่งมอบแล้ว": -1 }, "หน่วยงาน: " + pkgDept);
              }
            } catch (statsErr) {
              console.error("Revert stats reconcile failed: " + statsErr.message);
            }
          }

          return { success: true };
        }
      }
      throw new Error("ไม่พบพัสดุในระบบ");
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  reportDeliveryIssue: function (data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(20000);
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var headers = pData[0];
      var idIdx = getHeaderIndex(headers, "รหัสพัสดุ");
      var statusIdx = getHeaderIndex(headers, "สถานะ");
      var remarksIdx = getHeaderIndex(headers, "หมายเหตุ / Line");

      for (var i = 1; i < pData.length; i++) {
        if (String(pData[i][idIdx]) === String(data.packageId)) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue("มีปัญหา/ตีกลับ");
          sheet.getRange(row, remarksIdx + 1).setValue("มีปัญหา: " + sanitizeForSheet(data.issueType) + (data.reason ? " - " + sanitizeForSheet(data.reason) : ""));
          return { success: true };
        }
      }
      throw new Error("ไม่พบพัสดุในระบบ");
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  checkDuplicate: function (trackingNumber) {
    try {
      if (!trackingNumber || trackingNumber === "-") return { success: true, isDuplicate: false };
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var trackIdx = getHeaderIndex(pData[0], "เลขพัสดุ");
      var dateIdx = getHeaderIndex(pData[0], "เวลาที่บันทึก");

      var normTarget = this._normalizeTracking(trackingNumber);
      if (normTarget === "-") return { success: true, isDuplicate: false };

      for (var i = pData.length - 1; i >= 1; i--) {
        if (this._normalizeTracking(pData[i][trackIdx]) === normTarget) {
          return { success: true, isDuplicate: true, lastSeen: pData[i][dateIdx] };
        }
      }
      return { success: true, isDuplicate: false };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

function _normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

function _parseSearchDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  var text = String(value).trim();
  var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  var parts = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (parts) {
    var year = Number(parts[3]);
    if (year > 2400) year -= 543;
    return new Date(year, Number(parts[2]) - 1, Number(parts[1]));
  }

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return null;
}

function _statusMatchesFilter(rowStatus, filterStatus) {
  var status = _normalizeSearchValue(rowStatus);
  var filter = String(filterStatus || "").trim();
  if (!filter || filter === "all") return true;
  if (filter === "Pending") {
    return status.indexOf("pending") > -1 || status.indexOf("รอนำจ่าย") > -1 || status.indexOf("รอจ่าย") > -1;
  }
  if (filter === "Delivered") {
    return status.indexOf("delivered") > -1 || status.indexOf("ส่งมอบแล้ว") > -1 || status.indexOf("จ่ายแล้ว") > -1 || status.indexOf("จ่ายสำเร็จ") > -1;
  }
  return status === filter.toLowerCase();
}

function _searchSourcesForFiscalYear(filters) {
  var registry = typeof _getShardRegistry === "function" ? _getShardRegistry() : {};
  var ssList = [SpreadsheetApp.openById(SPREADSHEET_ID)];
  if (!filters || !filters.fiscalYear || filters.fiscalYear === "all") {
    var years = Object.keys(registry).sort(function(a, b) { return Number(b) - Number(a); });
    years.forEach(function(y) {
      if (registry[y] !== SPREADSHEET_ID) {
        try { ssList.push(SpreadsheetApp.openById(registry[y])); } catch (e) {
          console.warn("Failed to open spreadsheet shard for year " + y + ": " + e.message);
        }
      }
    });
  } else if (registry[filters.fiscalYear] && registry[filters.fiscalYear] !== SPREADSHEET_ID) {
    try { ssList.push(SpreadsheetApp.openById(registry[filters.fiscalYear])); } catch (e) {
      console.warn("Failed to open spreadsheet shard for fiscalYear " + filters.fiscalYear + ": " + e.message);
    }
  }
  return ssList;
}

function _publicTrackingSecret() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty("PUBLIC_TRACKING_SECRET");
  if (!secret) {
    secret = Utilities.getUuid();
    props.setProperty("PUBLIC_TRACKING_SECRET", secret);
  }
  return secret;
}

function _publicTrackingTokenForDept(deptId, deptName) {
  var props = PropertiesService.getScriptProperties();
  var overrides = {};
  try { overrides = JSON.parse(props.getProperty("PUBLIC_TRACKING_TOKENS") || "{}"); } catch (e) { overrides = {}; }
  if (overrides[deptId]) return String(overrides[deptId]);
  if (overrides[deptName]) return String(overrides[deptName]);
  var bytes = Utilities.computeHmacSha256Signature(String(deptId || deptName), _publicTrackingSecret());
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, "").slice(0, 28);
}

function _resolvePublicTrackingDept(deptId, token) {
  if (!deptId || !token) throw new Error("Missing public tracking link data");
  var departments = typeof AdminService !== "undefined" && AdminService.getDepartments ? AdminService.getDepartments() : [];
  var wanted = String(deptId).trim();
  var found = null;
  departments.forEach(function(dept) {
    var currentId = String(dept.DeptID || dept.id || "").trim();
    var currentName = String(dept.DeptName || dept.name || "").trim();
    if (!found && (currentId === wanted || currentName === wanted)) found = dept;
  });
  if (!found) throw new Error("Department not found");
  var resolvedId = String(found.DeptID || found.id || found.DeptName || found.name || "").trim();
  var resolvedName = String(found.DeptName || found.name || found.DeptID || found.id || "").trim();
  var expected = _publicTrackingTokenForDept(resolvedId, resolvedName);
  if (String(token).trim() !== expected) throw new Error("Invalid public tracking link");
  return { id: resolvedId, name: resolvedName };
}

function _resolvePublicTrackingDeptName(deptId) {
  if (!deptId) return "";
  var departments = typeof AdminService !== "undefined" && AdminService.getDepartments ? AdminService.getDepartments() : [];
  var wanted = String(deptId).trim();
  var foundName = "";
  departments.forEach(function(dept) {
    var currentId = String(dept.DeptID || dept.id || "").trim();
    var currentName = String(dept.DeptName || dept.name || "").trim();
    if (!foundName && (currentId === wanted || currentName === wanted)) foundName = currentName || currentId;
  });
  return foundName;
}

function getPublicTrackingLinks() {
  var departments = typeof AdminService !== "undefined" && AdminService.getDepartments ? AdminService.getDepartments() : [];
  var baseUrl = "";
  try { baseUrl = ScriptApp.getService().getUrl(); } catch (e) {
    console.warn("Failed to get service URL: " + e.message);
  }
  var centralLink = {
    deptId: "ALL",
    department: "ลิงก์กลางสำหรับทุกหน่วยงาน",
    token: "",
    url: baseUrl ? baseUrl + "#/tracking" : ""
  };
  departments.map(function(dept) {
    var deptId = String(dept.DeptID || dept.id || dept.DeptName || dept.name || "").trim();
    var deptName = String(dept.DeptName || dept.name || deptId).trim();
    _publicTrackingTokenForDept(deptId, deptName);
  });
  return [centralLink];
}

function _extractImageFormulaUrl(formula) {
  var text = String(formula || "").trim();
  if (!text) return "";
  var match = text.match(/^=IMAGE\("([^"]+)"/i);
  return match ? match[1] : "";
}

function publicSearchPackages(filters) {
  filters = filters || {};
  var keyword = String(filters.keyword || "").trim();
  var dept = { id: "", name: "" };
  var hasDeptToken = filters.deptId && filters.token;

  if (hasDeptToken) {
    if (typeof checkRateLimit === "function") {
      checkRateLimit("public_search_" + filters.deptId, 15, 60); // Max 15 requests per minute per department link
    }
    dept = _resolvePublicTrackingDept(filters.deptId, filters.token);
  } else {
    if (!filters.authToken) {
      throw new Error("กรุณาเข้าสู่ระบบด้วยอีเมลและ OTP ก่อนค้นหาพัสดุ");
    }
    var session = Service_Auth.verifySessionToken(filters.authToken);
    var user = Service_Auth._findUserByEmail(session.email);
    if (!user) throw new Error("ไม่พบอีเมลนี้ในฐานข้อมูลผู้ใช้");
    var userPayload = Service_Auth._publicUserPayload(user);
    var userDept = String(userPayload.Department || "").trim();
    if (!userDept) throw new Error("ไม่พบหน่วยงานของผู้ใช้นี้");
    if (keyword.length < 4) {
      throw new Error("กรุณาค้นด้วยเลขพัสดุหรือชื่อผู้รับไปรษณีย์ภัณฑ์อย่างน้อย 4 ตัวอักษร");
    }
    dept = {
      id: userDept,
      name: userDept
    };
  }

  var result = executeSearchPackages({
    keyword: keyword,
    status: filters.status || "",
    type: filters.type || "",
    department: dept.name,
    dateFrom: filters.dateFrom || "",
    dateTo: filters.dateTo || "",
    fiscalYear: filters.fiscalYear || "all",
    publicMode: true
  });
  if (result && result.success) result.department = dept.name;
  return result;
}

/**
 * Global Search Function for Waterfall API
 */
function executeSearchPackages(filters) {
  try {
    filters = filters || {};
    var ssList = _searchSourcesForFiscalYear(filters);
    var results = [];
    var maxResults = 100;
    var dateFrom = _parseSearchDate(filters.dateFrom);
    var dateTo = _parseSearchDate(filters.dateTo);
    if (dateTo) dateTo = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999);
    var typeFilter = _normalizeSearchValue(filters.type);
    var deptFilter = _normalizeSearchValue(filters.department);

    // Fetch users for email-to-name mapping
    var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
    var userMap = {};
    users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });

    ssList.forEach(function(ss) {
      if (results.length >= maxResults) return;
      var sheet = typeof _getSheetByCanonicalName === "function" ? _getSheetByCanonicalName(ss, SHEET_NAMES.PACKAGE_LOG) : (ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG) || ss.getSheetByName("Package_Log"));
      if (!sheet) return;
      
      var range = sheet.getDataRange();
      var data = range.getValues();
      var formulas = range.getFormulas();
      var headers = data[0];
      var idIdx = getHeaderIndex(headers, ["รหัสพัสดุ", "Package ID", "ID"]);
      var trackIdx = getHeaderIndex(headers, ["เลขพัสดุ", "Tracking No", "Tracking Number"]);
      var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type", "Type"]);
      var recIdx = getHeaderIndex(headers, ["ชื่อผู้รับไปรษณีย์ภัณฑ์", "ชื่อผู้รับ", "Receiver Name", "Recipient Name"]);
      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department", "Dept Name"]);
      var statusIdx = getHeaderIndex(headers, ["สถานะ", "Status"]);
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Created At", "Received At"]);
      var outIdx = getHeaderIndex(headers, ["เวลาที่จ่าย", "Delivered At", "Out At"]);
      var receiverIdx = getHeaderIndex(headers, ["ผู้รับตามจ่าหน้า", "ผู้รับจริง", "Signer", "Actual Receiver"]);
      var delivererIdx = getHeaderIndex(headers, ["จนท.ผู้นำจ่าย", "Staff", "Deliverer"]);
      var signIdx = getHeaderIndex(headers, ["ลายเซ็น", "Signature"]);
      var photoIdx = getHeaderIndex(headers, ["รูปภาพ", "Photo"]);
      var methodIdx = getHeaderIndex(headers, ["วิธีการส่งมอบ", "Method"]);
      var useTypeIdx = getHeaderIndex(headers, ["ประเภทการใช้", "Use Type"]);
      var noteIdx = getHeaderIndex(headers, ["หมายเหตุ / Line", "Note"]);

      for (var i = 1; i < data.length; i++) {
        if (results.length >= maxResults) break;
        var row = data[i];
        var match = true;
        if (filters.keyword) {
          var kw = String(filters.keyword).toLowerCase();
          var content = [row[idIdx], row[trackIdx], row[recIdx], row[deptIdx], row[receiverIdx]].join(" ").toLowerCase();
          if (content.indexOf(kw) === -1) match = false;
        }
        if (match && filters.status && filters.status !== "all") {
          var rowStatus = String(row[statusIdx] || "").trim().toLowerCase();
          var filterStatus = String(filters.status).trim();
          
          if (filterStatus === "Pending") {
            if (rowStatus.indexOf("รอจ่าย") === -1 && rowStatus.indexOf("รอนำจ่าย") === -1 && rowStatus.indexOf("pending") === -1) match = false;
          } else if (filterStatus === "Delivered") {
            if (rowStatus.indexOf("ส่งมอบแล้ว") === -1 && rowStatus.indexOf("จ่ายแล้ว") === -1 && rowStatus.indexOf("จ่ายสำเร็จ") === -1 && rowStatus.indexOf("delivered") === -1) match = false;
          } else {
            if (rowStatus !== filterStatus.toLowerCase()) match = false;
          }
        }
        
        if (match && typeFilter && typeFilter !== "all" && _normalizeSearchValue(row[typeIdx]).indexOf(typeFilter) === -1) match = false;
        if (match && deptFilter && deptFilter !== "all" && _normalizeSearchValue(row[deptIdx]) !== deptFilter) match = false;
        if (match && (dateFrom || dateTo)) {
          var rowDate = _parseSearchDate(row[dateIdx]);
          if (!rowDate) match = false;
          if (match && dateFrom && rowDate < dateFrom) match = false;
          if (match && dateTo && rowDate > dateTo) match = false;
        }

        if (match) {
          var dateVal = row[dateIdx];
          var formattedDate = dateVal instanceof Date 
            ? Service_Utils.formatThaiDateTime(dateVal) 
            : String(dateVal || "-");
          
          var outVal = row[outIdx];
          var formattedOut = outVal instanceof Date
            ? Service_Utils.formatThaiDateTime(outVal)
            : String(outVal || "-");

          var staffValue = String(row[delivererIdx] || "").trim();
          var staffEmail = staffValue.toLowerCase();
          var signatureUrl = signIdx !== -1 ? (_extractImageFormulaUrl((formulas[i] || [])[signIdx]) || row[signIdx] || "") : "";

          results.push({
            id: row[idIdx] || "-", 
            trackingNo: row[trackIdx] || "-",
            trackingNumber: row[trackIdx] || "-",
            recipientName: row[recIdx] || "ไม่ระบุชื่อ", 
            receiverName: row[recIdx] || "ไม่ระบุชื่อ",
            signerName: row[receiverIdx] || "-",
            deliverer: userMap[staffEmail] || staffValue || "-",
            department: row[deptIdx] || "-",
            status: row[statusIdx] || "-", 
            date: formattedDate,
            deliveredAt: formattedOut,
            type: row[typeIdx] || "พัสดุ",
            itemType: row[typeIdx] || "พัสดุ",
            signature: signatureUrl,
            photo: row[photoIdx] || "",
            method: row[methodIdx] || "-",
            useType: row[useTypeIdx] || "-",
            note: row[noteIdx] || "-"
          });
        }
      }
    });

    if (filters.publicMode) {
      results = results.map(function(item) {
        item.signature = "";
        item.photo = "";
        item.signerName = "";
        item.deliverer = "";
        return item;
      });
    }

    return { success: true, data: results };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
