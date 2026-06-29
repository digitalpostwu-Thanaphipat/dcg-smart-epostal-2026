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
    var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
    if (!sheet) return;
    if (sheet.getLastRow() === 0) {
      var headers = [
        "รหัสพัสดุ", "เลขพัสดุ", "ประเภท", "ชื่อหน่วยงาน", "ชื่อผู้รับ", "สถานะ",
        "เวลาที่บันทึก", "เวลาที่จ่าย", "จนท.ผู้นำจ่าย", "ผู้รับจริง", "ลายเซ็น",
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
        var isPersonal = u.indexOf("ส่วนตัว") > -1 || u.toLowerCase().includes("personal");
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
    rows.push(["ภาพรวม", "ส่วนตัว", overall.personal, now]);
    rows.push(["ภาพรวม", "ลงทะเบียน/EMS", overall.reg, now]);
    rows.push(["ภาพรวม", "ธรรมดา", overall.ord, now]);
    rows.push(["ภาพรวม", "หน่วยงานที่ส่งครบ", successDepts, now]);
    rows.push(["ภาพรวม", "หน่วยงานที่ค้างส่ง", pendingDepts, now]);
    
    // Add YoY from historical shards + current
    var yoyCache = {};
    try {
      var cachedStr = PropertiesService.getScriptProperties().getProperty("YOY_STATS_CACHE");
      if (cachedStr) yoyCache = JSON.parse(cachedStr);
    } catch(e) {}
    
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
      rows.push(["หน่วยงาน: " + dept, "ส่วนตัว", ds.personal, now]);
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
        if (metricsMap[metric]) {
          var rowIdx = metricsMap[metric];
          var currentVal = Number(data[rowIdx - 1][2]) || 0;
          sheet.getRange(rowIdx, 3).setValue(currentVal + increment);
          sheet.getRange(rowIdx, 4).setValue(now);
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

      lock.waitLock(30000);
      this.initSheet();
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var lastRow = sheet.getLastRow();
      var deptName = payload.departmentName || payload.deptName;
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
        Object.keys(data).forEach(function(key) {
          var idx = getHeaderIndex(headers, key);
          if (idx > -1) row[idx] = data[key];
        });
        return row;
      }
      
      var recipientName = payload.recipientName || "เจ้าหน้าที่หน่วยงาน";
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
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับ": recipientName, "สถานะ": "รอนำจ่าย",
            "เวลาที่บันทึก": fullDateTimeStr, "จนท.ผู้นำจ่าย": staffName,
            "วิธีการส่งมอบ": "ส่งมอบที่หน่วยงาน", "ประเภทการใช้": "ส่วนตัว",
            "หมายเหตุ / Line": "-", "ผู้บันทึก": staffName
          }));
          count++;
        }
        for (var j = 0; j < workQty; j++) {
          var id = `ORD-${ordInfo.dateStr}-${String(ordInfo.seq + offset++).padStart(4, "0")}`;
          rowsToAppend.push(buildRow({
            "รหัสพัสดุ": id, "เลขพัสดุ": "-", "ประเภท": "ไปรษณีย์ธรรมดา",
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับ": recipientName, "สถานะ": "รอนำจ่าย",
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
          
          var recipientNameInRow = item.recipientName || item.receiverName || recipientName;
          var thaiItemType = isEms ? "ไปรษณีย์ด่วนพิเศษ (EMS)" : "ไปรษณีย์ลงทะเบียน";
          
          rowsToAppend.push(buildRow({
            "รหัสพัสดุ": id, "เลขพัสดุ": trackingNo, "ประเภท": thaiItemType,
            "ชื่อหน่วยงาน": deptName, "ชื่อผู้รับ": recipientNameInRow, "สถานะ": "รอนำจ่าย",
            "เวลาที่บันทึก": fullDateTimeStr, "จนท.ผู้นำจ่าย": staffName,
            "วิธีการส่งมอบ": "ส่งมอบที่หน่วยงาน",
            "ประเภทการใช้": item.isPersonal ? "ส่วนตัว" : "งานมหาวิทยาลัย",
            "หมายเหตุ / Line": item.notes || "-", "ผู้บันทึก": staffName
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
          if (use === "ส่วนตัว") pCount++;
          if (type.indexOf("ลงทะเบียน") > -1 || type.indexOf("EMS") > -1) rCount++;
          else oCount++;
        });

        overallUpdates["ส่วนตัว"] = pCount;
        overallUpdates["ลงทะเบียน/EMS"] = rCount;
        overallUpdates["ธรรมดา"] = oCount;
        
        deptUpdates["ส่วนตัว"] = pCount;
        deptUpdates["ลงทะเบียน/EMS"] = rCount;
        deptUpdates["ธรรมดา"] = oCount;

        this._updateStatsSnapshot(overallUpdates, "ภาพรวม");
        this._updateStatsSnapshot(deptUpdates, "หน่วยงาน: " + deptName);
      }

      return { success: true, count: count, message: "บันทึกสำเร็จ " + count + " รายการ" };
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
      var recIdx = getHeaderIndex(headers, ["ชื่อผู้รับ", "Receiver Name", "Recipient Name"]);
      var statusIdx = getHeaderIndex(headers, ["สถานะ", "Status"]);
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Created At", "Received At"]);
      var delivererIdx = getHeaderIndex(headers, ["จนท.ผู้นำจ่าย", "Staff", "Deliverer"]);

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
            deliverer: userMap[staffEmail] || staffEmail || "-"
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
      var receiverIdx = getHeaderIndex(headers, "ผู้รับจริง");
      var methodIdx = getHeaderIndex(headers, "วิธีการส่งมอบ");
      var staffIdx = getHeaderIndex(headers, "จนท.ผู้นำจ่าย");
      var signIdx = getHeaderIndex(headers, "ลายเซ็น");
      var photoIdx = getHeaderIndex(headers, "รูปภาพ");
      var gpsIdx = getHeaderIndex(headers, "พิกัด GPS");
      var updaterIdx = getHeaderIndex(headers, "ผู้อัปเดตล่าสุด");

      var pkgIds = data.packageIds || [];
      var count = 0;
      var nowStr = typeof Service_Utils !== "undefined" ? Service_Utils.formatThaiDateTime(new Date()) : new Date().toLocaleString("th-TH");

      // [Hardening] Email → FullName resolution
      var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      var userMap = {};
      users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });
      var staffName = data.staffEmail ? (userMap[String(data.staffEmail).toLowerCase()] || data.staffEmail) : "";

      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department"]);

      for (var i = 1; i < pData.length; i++) {
        var pId = String(pData[i][idIdx]);
        if (pkgIds.indexOf(pId) > -1) {
          var row = i + 1;
          var pDept = String(pData[i][deptIdx] || "ไม่ระบุหน่วยงาน").trim();
          
          sheet.getRange(row, statusIdx + 1).setValue("ส่งมอบแล้ว");
          sheet.getRange(row, timeOutIdx + 1).setValue(nowStr);
          sheet.getRange(row, receiverIdx + 1).setValue(data.signatureName || "เซ็นรับผ่านระบบ");
          sheet.getRange(row, methodIdx + 1).setValue(data.deliveryMethod || "เซ็นรับผ่านระบบ");
          if (staffName) sheet.getRange(row, staffIdx + 1).setValue(staffName);
          
          if (signIdx !== -1 && data.signatureImage) sheet.getRange(row, signIdx + 1).setValue(data.signatureImage);
          if (photoIdx !== -1 && data.photoImage) sheet.getRange(row, photoIdx + 1).setValue(data.photoImage);
          if (gpsIdx !== -1 && data.gpsCoordinates) sheet.getRange(row, gpsIdx + 1).setValue(data.gpsCoordinates);
          if (updaterIdx !== -1 && staffName) sheet.getRange(row, updaterIdx + 1).setValue(staffName);
          
          // Real-time Stats Updates (Batch)
          this._updateStatsSnapshot({ "รอนำจ่าย": -1, "ส่งมอบแล้ว": 1 }, "ภาพรวม");
          this._updateStatsSnapshot({ "รอนำจ่าย": -1, "ส่งมอบแล้ว": 1 }, "หน่วยงาน: " + pDept);

          count++;
        }
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
            if (metric === "ส่วนตัว") { stats.personalCount = val; foundAny = true; }
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
          
          if (sUseType.indexOf("ส่วนตัว") > -1 || sUseType.toLowerCase().includes("personal")) stats.personalCount++;
          
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

      for (var i = 1; i < pData.length; i++) {
        if (String(pData[i][idIdx]) === String(data.packageId)) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue("รอนำจ่าย");
          sheet.getRange(row, remarksIdx + 1).setValue("ยกเลิก: " + (data.reason || "ไม่ระบุ"));
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
          sheet.getRange(row, remarksIdx + 1).setValue("มีปัญหา: " + data.issueType + (data.reason ? " - " + data.reason : ""));
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

/**
 * Global Search Function for Waterfall API
 */
function executeSearchPackages(filters) {
  try {
    var registry = typeof _getShardRegistry === "function" ? _getShardRegistry() : {};
    var ssList = [SpreadsheetApp.openById(SPREADSHEET_ID)];
    
    if (!filters.fiscalYear || filters.fiscalYear === "all") {
      var years = Object.keys(registry).sort((a,b) => b-a);
      years.forEach(y => { if(registry[y] !== SPREADSHEET_ID) { try { ssList.push(SpreadsheetApp.openById(registry[y])); } catch(e){} } });
    } else if (registry[filters.fiscalYear]) {
      if(registry[filters.fiscalYear] !== SPREADSHEET_ID) { try { ssList.push(SpreadsheetApp.openById(registry[filters.fiscalYear])); } catch(e){} }
    }

    var results = [];
    var maxResults = 100;

    // Fetch users for email-to-name mapping
    var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
    var userMap = {};
    users.forEach(function(u) { userMap[String(u.Email).toLowerCase()] = u.FullName; });

    ssList.forEach(ss => {
      if (results.length >= maxResults) return;
      var sheet = ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG) || ss.getSheetByName("Package_Log");
      if (!sheet) return;
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idIdx = getHeaderIndex(headers, ["รหัสพัสดุ", "Package ID", "ID"]);
      var trackIdx = getHeaderIndex(headers, ["เลขพัสดุ", "Tracking No", "Tracking Number"]);
      var typeIdx = getHeaderIndex(headers, ["ประเภท", "Item Type", "Type"]);
      var recIdx = getHeaderIndex(headers, ["ชื่อผู้รับ", "Receiver Name", "Recipient Name"]);
      var deptIdx = getHeaderIndex(headers, ["ชื่อหน่วยงาน", "Department", "Dept Name"]);
      var statusIdx = getHeaderIndex(headers, ["สถานะ", "Status"]);
      var dateIdx = getHeaderIndex(headers, ["เวลาที่บันทึก", "Created At", "Received At"]);
      var outIdx = getHeaderIndex(headers, ["เวลาที่จ่าย", "Delivered At", "Out At"]);
      var receiverIdx = getHeaderIndex(headers, ["ผู้รับจริง", "Signer", "Actual Receiver"]);
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
        
        if (match) {
          var dateVal = row[dateIdx];
          var formattedDate = dateVal instanceof Date 
            ? Service_Utils.formatThaiDateTime(dateVal) 
            : String(dateVal || "-");
          
          var outVal = row[outIdx];
          var formattedOut = outVal instanceof Date
            ? Service_Utils.formatThaiDateTime(outVal)
            : String(outVal || "-");

          var staffEmail = String(row[delivererIdx] || "").toLowerCase();

          results.push({
            id: row[idIdx] || "-", 
            trackingNo: row[trackIdx] || "-",
            trackingNumber: row[trackIdx] || "-",
            recipientName: row[recIdx] || "ไม่ระบุชื่อ", 
            receiverName: row[recIdx] || "ไม่ระบุชื่อ",
            signerName: row[receiverIdx] || "-",
            deliverer: userMap[staffEmail] || staffEmail || "-",
            department: row[deptIdx] || "-",
            status: row[statusIdx] || "-", 
            date: formattedDate,
            deliveredAt: formattedOut,
            type: row[typeIdx] || "พัสดุ",
            itemType: row[typeIdx] || "พัสดุ",
            signature: row[signIdx] || "",
            photo: row[photoIdx] || "",
            method: row[methodIdx] || "-",
            useType: row[useTypeIdx] || "-",
            note: row[noteIdx] || "-"
          });
        }
      }
    });

    return { success: true, data: results };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
