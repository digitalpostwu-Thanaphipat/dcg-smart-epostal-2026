/**
 * Service_Package.gs - VERSION 32 (EXTREME OPTIMIZED)
 */
var Service_Package = {
  /**
   * [Security] Private helper to verify user role before sensitive actions.
   * [Ultra-Optimized] Uses CacheService (TL 15min) to avoid sheet reads.
   * @private
   */
  _verifyRole: function (email, allowedRoles) {
    if (!email) return false;
    const cleanEmail = String(email).trim().toLowerCase();
    
    // 1. Try Cache first
    const cache = CacheService.getUserCache();
    const cacheKey = "user_role_" + cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
    let role = cache.get(cacheKey);

    if (!role) {
      const users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
      const user = users.find((u) => String(u.Email).toLowerCase() === cleanEmail);
      if (!user) return false;
      role = String(user.Role || "User").trim();
      cache.put(cacheKey, role, 900); // 15 mins
    }

    return allowedRoles.some(
      (r) => r.toLowerCase() === role.toLowerCase(),
    );
  },

  initSheet: function () {
    var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
    if (!sheet) return;
    if (sheet.getLastRow() === 0) {
      var headers = [
        "รหัสอ้างอิง",
        "เลขที่พัสดุ",
        "ประเภทไปรษณีย์ภัณฑ์",
        "หน่วยงานผู้รับ",
        "ชื่อผู้รับปลายทาง",
        "สถานะปัจจุบัน",
        "วันที่และเวลารับเข้า",
        "วันที่และเวลานำจ่าย",
        "เจ้าหน้าที่ผู้บันทึก",
        "ชื่อผู้เซ็นรับของ",
        "หลักฐานลายเซ็น",
        "หลักฐานรูปถ่าย",
        "พิกัดนำจ่าย (GPS)",
        "วิธีการนำจ่าย",
        "ประเภทการใช้งาน",
        "หมายเหตุเพิ่มเติม",
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet
        .getRange(1, 1, 1, headers.length)
        .setBackground("#0d9488")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  },

  /**
   * [Extreme-Performance] savePackageEntry
   * Optimized for Batch Saves < 3 seconds SLA using Property Storage and Hybrid Mapping.
   */
  savePackageEntry: function (payload) {
    var lock = LockService.getScriptLock();
    try {
      // 1. RBAC Check with Cache
      var staffEmail = payload.userEmail || payload.staffEmail || "system";
      if (!this._verifyRole(staffEmail, ["Admin", "Postal", "Staff"])) {
        logAction(staffEmail, "SAVE_ENTRY", JSON.stringify({ status: "DENIED", reason: "Unauthorized Role" }));
        throw new Error("คุณไม่มีสิทธิ์ในการบันทึกข้อมูล (ต้องการสิทธิ์ Admin หรือ Staff)");
      }

      // 2. Wait for up to 30 seconds
      lock.waitLock(30000);

      this.initSheet();
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var lastRow = sheet.getLastRow();

      var deptName = payload.departmentName || payload.departmentId || payload.deptName || payload.deptId;
      if (!deptName) throw new Error("ไม่พบชื่อหน่วยงานในข้อมูลที่ส่งมา");

      var now = new Date();
      var thaiNow = typeof Service_Utils !== "undefined" ? Service_Utils.formatThaiDateTime(now) : now.toLocaleString("th-TH");
      var count = 0;

      // [Extreme Optimized] Lazy Sequence Variables
      let ordInfo = null;
      let emsInfo = null;
      let regInfo = null;
      let ordOffset = 1;
      let emsOffset = 1;
      let regOffset = 1;

      var personalQty = parseInt(payload.personalQty) || 0;
      var workQty = parseInt(payload.workQty) || 0;
      
      if (!personalQty && !workQty && payload.regularQty > 0) {
        if (payload.isPersonal) personalQty = payload.regularQty;
        else workQty = payload.regularQty;
      }

      var rowsToAppend = [];

      // A. Process ORD (Ordinary)
      if (personalQty > 0 || workQty > 0) {
        ordInfo = Service_Utils.getLatestSequence(sheet, "ORD");
        for (var i = 0; i < personalQty; i++) {
          const nextSeq = ordInfo.seq + ordOffset++;
          const id = `ORD-${ordInfo.dateStr}-${String(nextSeq).padStart(4, "0")}`;
          rowsToAppend.push([id, "-", "ไปรษณีย์ภัณฑ์ธรรมดา", deptName, "เจ้าหน้าที่หน่วยงาน", "รอจ่าย", thaiNow, "", staffEmail, "", "", "", "", "เซ็นรับที่เคาน์เตอร์", "ธุระส่วนตัว (ส่วนบุคคล)", ""]);
          count++;
        }
        for (var j = 0; j < workQty; j++) {
          const nextSeq = ordInfo.seq + ordOffset++;
          const id = `ORD-${ordInfo.dateStr}-${String(nextSeq).padStart(4, "0")}`;
          rowsToAppend.push([id, "-", "ไปรษณีย์ภัณฑ์ธรรมดา", deptName, "เจ้าหน้าที่หน่วยงาน", "รอจ่าย", thaiNow, "", staffEmail, "", "", "", "", "เซ็นรับที่เคาน์เตอร์", "งานมหาวิทยาลัย", ""]);
          count++;
        }
      }

      // B. Process EMS / REG
      if (payload.emsList && Array.isArray(payload.emsList) && payload.emsList.length > 0) {
        // [Extreme Optimized Deduplication]
        const headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
        const trackIdx = typeof getHeaderIndex === "function" ? getHeaderIndex(headers, "เลขที่พัสดุ") : -1;
        const trackSet = new Set();
        
        if (lastRow > 1 && trackIdx > -1) {
          const trackData = sheet.getRange(2, trackIdx + 1, lastRow - 1, 1).getValues();
          for (var k = 0; k < trackData.length; k++) {
            let val = String(trackData[k][0]).trim().toUpperCase();
            if (val && val !== "-") trackSet.add(val);
          }
        }

        payload.emsList.forEach(function (item) {
          // [Hybrid Mapping] Support trackingNo or trackingNumber
          const tNo = String(item.trackingNo || item.trackingNumber || "").trim().toUpperCase();
          const rName = item.receiverName || item.recipientName || "-";

          if (tNo && tNo !== "-" && trackSet.has(tNo)) {
            throw new Error("พบหมายเลขพัสดุซ้ำในระบบ: " + tNo);
          }

          let id = "";
          if (item.itemType === "EMS") {
            if (!emsInfo) emsInfo = Service_Utils.getLatestSequence(sheet, "EMS");
            const nextSeq = emsInfo.seq + emsOffset++;
            id = `EMS-${emsInfo.dateStr}-${String(nextSeq).padStart(4, "0")}`;
          } else {
            if (!regInfo) regInfo = Service_Utils.getLatestSequence(sheet, "REG");
            const nextSeq = regInfo.seq + regOffset++;
            id = `REG-${regInfo.dateStr}-${String(nextSeq).padStart(4, "0")}`;
          }

          rowsToAppend.push([
            id, 
            tNo || "-", 
            item.itemType === "EMS" ? "ไปรษณีย์ด่วนพิเศษ (EMS)" : "ไปรษณีย์ลงทะเบียน",
            deptName, 
            rName, 
            "รอจ่าย", 
            thaiNow, 
            "", 
            staffEmail, 
            "", 
            "", 
            "", 
            "", 
            "เซ็นรับผ่านระบบ", 
            item.isPersonal ? "ธุระส่วนตัว (ส่วนบุคคล)" : "งานมหาวิทยาลัย", 
            item.notes || ""
          ]);
          count++;
        });
      }

      // 3. Final Batch Write
      if (rowsToAppend.length > 0) {
        sheet.getRange(lastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
        
        // 4. Persistence: Update Properties for Fast Next Execution
        if (ordInfo) Service_Utils.setLatestSequence("ORD", ordInfo.seq + ordOffset - 1);
        if (emsInfo) Service_Utils.setLatestSequence("EMS", emsInfo.seq + emsOffset - 1);
        if (regInfo) Service_Utils.setLatestSequence("REG", regInfo.seq + regOffset - 1);
      }

      return {
        success: true,
        count: count,
        message: "บันทึกสำเร็จ " + count + " รายการ (Extreme Optimized)",
      };
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
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return [];

      // [Ultra-Optimized] Fetch only specific columns (A-G: Columns 1-7)
      var data = sheet.getRange(1, 1, lastRow, 7).getValues();

      var headers = data[0].map((h) => String(h).trim());
      var idIdx = headers.indexOf("รหัสอ้างอิง");
      var trackIdx = headers.indexOf("เลขที่พัสดุ");
      var typeIdx = headers.indexOf("ประเภทไปรษณีย์ภัณฑ์");
      var deptIdx = headers.indexOf("หน่วยงานผู้รับ");
      var recIdx = headers.indexOf("ชื่อผู้รับปลายทาง");
      var statusIdx = headers.indexOf("สถานะปัจจุบัน");
      var dateIdx = headers.indexOf("วันที่และเวลารับเข้า");

      if (statusIdx === -1 || idIdx === -1) return [];

      // ใช้ระบบ Caching สำหรับหน่วยงานด้วยเพื่อความเร็ว
      var depts = typeof AdminService !== "undefined" ? AdminService.getDepartments() : [];
      var deptMap = {};
      depts.forEach(function (d) {
        deptMap[d.DeptName] = { building: d.Building, floor: d.Floor };
      });

      var pending = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (String(row[statusIdx]).trim() === "รอจ่าย") {
          var dName = row[deptIdx] ? String(row[deptIdx]).trim() : "ไม่ระบุ";
          var bInfo = deptMap[dName] || { building: "-", floor: "-" };

          pending.push({
            packageId: row[idIdx],
            trackingNumber: row[trackIdx] || "-",
            itemType: row[typeIdx],
            recipientName: row[recIdx],
            departmentName: dName,
            building: bInfo.building || "-",
            floor: bInfo.floor || "-",
            receivedAt: row[dateIdx],
          });
        }
      }
      return pending;
    } catch (e) {
      console.error("Pending extraction failed: " + e.message);
      return [];
    }
  },

  updateDeliveryStatus: function (packageId, status, receiverName, signatureUrl, gps, staffEmail) {
    try {
      var lock = LockService.getScriptLock();
      lock.waitLock(30000);

      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      var idIdx = headers.indexOf("รหัสอ้างอิง");
      var statusIdx = headers.indexOf("สถานะปัจจุบัน");
      var dateOutIdx = headers.indexOf("วันที่และเวลานำจ่าย");
      var receiverIdx = headers.indexOf("ชื่อผู้เซ็นรับของ");
      var signIdx = headers.indexOf("หลักฐานลายเซ็น");
      var gpsIdx = headers.indexOf("พิกัดนำจ่าย (GPS)");

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(packageId)) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue(status);
          sheet.getRange(row, dateOutIdx + 1).setValue(typeof Service_Utils !== "undefined" ? Service_Utils.formatThaiDateTime(new Date()) : new Date());
          sheet.getRange(row, receiverIdx + 1).setValue(receiverName);
          sheet.getRange(row, signIdx + 1).setValue(signatureUrl);
          sheet.getRange(row, gpsIdx + 1).setValue(gps);
          return { success: true };
        }
      }
      return { success: false, error: "Package not found" };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  getStats: function () {
    try {
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return { pending: 0, completed: 0, total: 0 };

      var headers = data[0];
      var statusIdx = headers.indexOf("สถานะปัจจุบัน");
      var pending = 0;
      var completed = 0;

      for (var i = 1; i < data.length; i++) {
        var s = String(data[i][statusIdx]).trim();
        if (s === "รอจ่าย") pending++;
        else if (s === "จ่ายแล้ว" || s === "สำเร็จ") completed++;
      }

      return { pending: pending, completed: completed, total: pending + completed };
    } catch (e) {
      return { pending: 0, completed: 0, total: 0 };
    }
  },

  confirmDelivery: function (data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var idIdx = getHeaderIndex(pData[0], "รหัสอ้างอิง");
      var statusIdx = getHeaderIndex(pData[0], "สถานะปัจจุบัน");
      var dateOutIdx = getHeaderIndex(pData[0], "วันที่และเวลานำจ่าย");
      var receiverIdx = getHeaderIndex(pData[0], "ชื่อผู้เซ็นรับของ");
      var signIdx = getHeaderIndex(pData[0], "หลักฐานลายเซ็น");
      var staffIdx = getHeaderIndex(pData[0], "เจ้าหน้าที่ผู้บันทึก");

      var count = 0;
      var now = typeof Service_Utils !== 'undefined' ? Service_Utils.formatThaiDateTime(new Date()) : new Date().toLocaleString("th-TH");
      
      var pkgIds = data.packageIds || [];
      if (pkgIds.length === 0) throw new Error("ไม่พบข้อมูลพัสดุที่ต้องการนำจ่าย");

      for (var i = 1; i < pData.length; i++) {
        var id = String(pData[i][idIdx]);
        if (pkgIds.indexOf(id) > -1) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue("จ่ายแล้ว");
          sheet.getRange(row, dateOutIdx + 1).setValue(now);
          sheet.getRange(row, receiverIdx + 1).setValue(data.signatureName || "เซ็นรับผ่านระบบ");
          if (data.signatureImage) sheet.getRange(row, signIdx + 1).setValue(data.signatureImage);
          if (data.staffEmail) sheet.getRange(row, staffIdx + 1).setValue(data.staffEmail);
          count++;
        }
      }
      return { success: true, count: count };
    } catch(e) {
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  revertDelivery: function (data) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(20000);
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var pData = sheet.getDataRange().getValues();
      var idIdx = getHeaderIndex(pData[0], "รหัสอ้างอิง");
      var statusIdx = getHeaderIndex(pData[0], "สถานะปัจจุบัน");
      var remarksIdx = getHeaderIndex(pData[0], "หมายเหตุเพิ่มเติม");

      for (var i = 1; i < pData.length; i++) {
        if (String(pData[i][idIdx]) === String(data.packageId)) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue("รอจ่าย");
          sheet.getRange(row, remarksIdx + 1).setValue("ยกเลิก: " + data.reason);
          return { success: true };
        }
      }
      throw new Error("ไม่พบพัสดุระบบ");
    } catch(e) {
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
      var idIdx = getHeaderIndex(pData[0], "รหัสอ้างอิง");
      var statusIdx = getHeaderIndex(pData[0], "สถานะปัจจุบัน");
      var remarksIdx = getHeaderIndex(pData[0], "หมายเหตุเพิ่มเติม");

      for (var i = 1; i < pData.length; i++) {
        if (String(pData[i][idIdx]) === String(data.packageId)) {
          var row = i + 1;
          sheet.getRange(row, statusIdx + 1).setValue("มีปัญหา/ตีกลับ");
          sheet.getRange(row, remarksIdx + 1).setValue("มีปัญหา: " + data.issueType + (data.reason ? " - " + data.reason : ""));
          return { success: true };
        }
      }
      throw new Error("ไม่พบพัสดุระบบ");
    } catch(e) {
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
      var trackIdx = getHeaderIndex(pData[0], "เลขที่พัสดุ");
      var dateIdx = getHeaderIndex(pData[0], "วันที่และเวลารับเข้า");

      for (var i = pData.length - 1; i >= 1; i--) {
        if (String(pData[i][trackIdx]).trim().toUpperCase() === String(trackingNumber).trim().toUpperCase()) {
          return { success: true, isDuplicate: true, lastSeen: pData[i][dateIdx] };
        }
      }
      return { success: true, isDuplicate: false };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },


  /**
   * [T-005] YoY Stats & Daily Operations
   */
  getDailyOperationalStats: function (filters) {
    try {
      var sheet = getSheet(SHEET_NAMES.PACKAGE_LOG);
      var data = sheet.getDataRange().getValues();
      
      var yoyCache = {};
      try {
        var prop = PropertiesService.getScriptProperties().getProperty("YOY_STATS_CACHE");
        if (prop) yoyCache = JSON.parse(prop);
      } catch(e) {}

      if (data.length < 2) return { success: true, data: { todayReceived: 0, pendingDepts: 0, pendingDelivery: 0, yoy: yoyCache } };

      var headers = data[0];
      var todayDateStr = typeof Service_Utils !== "undefined" ? Service_Utils.formatThaiDateTime(new Date()).split(' ')[0] : new Date().toLocaleString("th-TH").split(' ')[0];
      
      var stats = {
         todayReceived: 0, regCount: 0, ordCount: 0, personalCount: 0,
         successDepts: 0, deliveredToday: 0, pendingDepts: 0, pendingDelivery: 0,
         yoy: yoyCache
      };
      
      var idIdx = getHeaderIndex(headers, "รหัสอ้างอิง");
      var typeIdx = getHeaderIndex(headers, "ประเภทไปรษณีย์ภัณฑ์");
      var statusIdx = getHeaderIndex(headers, "สถานะปัจจุบัน");
      var dateIdx = getHeaderIndex(headers, "วันที่และเวลารับเข้า");
      var deptIdx = getHeaderIndex(headers, "หน่วยงานผู้รับ");
      var usageIdx = getHeaderIndex(headers, "ประเภทการใช้งาน");

      var pendingDeptSet = {};
      var successDeptSet = {};
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var sDate = String(row[dateIdx]).split(' ')[0];
        var sUsage = String(row[usageIdx]);
        var sType = String(row[typeIdx]);
        var sStatus = String(row[statusIdx]).trim();
        var dName = String(row[deptIdx]).trim();

        if (sDate === todayDateStr) {
           stats.todayReceived++;
           if (sType.indexOf("ลงทะเบียน") > -1) stats.regCount++;
           if (sType.indexOf("ธรรมดา") > -1 || row[idIdx].indexOf("ORD-") > -1) stats.ordCount++;
           if (sUsage.indexOf("ส่วนบุคคล") > -1) stats.personalCount++;
        }

        if (sStatus === "รอจ่าย" || sStatus === "Pending") {
           stats.pendingDelivery++;
           pendingDeptSet[dName] = true;
           delete successDeptSet[dName]; // Cannot be success if still pending
        } else if (sStatus === "จ่ายแล้ว" || sStatus === "สำเร็จ" || sStatus === "ส่งมอบแล้ว") {
           if (sDate === todayDateStr) stats.deliveredToday++;
           if (!pendingDeptSet[dName]) successDeptSet[dName] = true;
        }
      }

      stats.pendingDepts = Object.keys(pendingDeptSet).length;
      stats.successDepts = Object.keys(successDeptSet).length;

      return { success: true, data: stats };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
};

/**
 * [T-005] Global Export: Waterfall Multi-Shard Search
 * Extracting from Service_Package object to fix V8 engine scope bugs
 */
function executeSearchPackages(filters) {
  var registry = typeof _getShardRegistry === 'function' ? _getShardRegistry() : {};
  var results = [];
  var maxResults = 250; 
  var ssList = [];
  
  // Phase 2: Waterfall Search Resolution
  if (filters.fiscalYear && filters.fiscalYear !== "all") {
     // Search specific year only
     var currentFY = typeof _getCurrentFiscalYear === 'function' ? String(_getCurrentFiscalYear()) : String(new Date().getFullYear() + 543);
     if (String(filters.fiscalYear) === currentFY) {
       ssList.push(SpreadsheetApp.openById(SPREADSHEET_ID));
     } else if (registry[filters.fiscalYear]) {
       try { ssList.push(SpreadsheetApp.openById(registry[filters.fiscalYear])); } catch(e) { console.error(e); }
     }
  } else {
     // Global Search (Waterfall: Current -> Oldest)
     ssList.push(SpreadsheetApp.openById(SPREADSHEET_ID));
     var years = Object.keys(registry).sort(function(a,b){return b-a});
     for (var i=0; i<years.length; i++) {
       try { ssList.push(SpreadsheetApp.openById(registry[years[i]])); } catch(e) { console.error(e); }
     }
  }

  for (var s = 0; s < ssList.length; s++) {
     if (results.length >= maxResults) break; 
     
     var sheet;
     try {
       sheet = ssList[s].getSheetByName("Package_Log") || ssList[s].getSheetByName(SHEET_NAMES.PACKAGE_LOG);
     } catch(e) { continue; }
     if (!sheet) continue;
     
     var data = sheet.getDataRange().getValues();
     if (data.length < 2) continue;
     
     var headers = data[0];
     var idIdx = getHeaderIndex(headers, "รหัสอ้างอิง");
     var trackIdx = getHeaderIndex(headers, "เลขที่พัสดุ");
     var typeIdx = getHeaderIndex(headers, "ประเภทไปรษณีย์ภัณฑ์");
     var deptIdx = getHeaderIndex(headers, "หน่วยงานผู้รับ");
     var recIdx = getHeaderIndex(headers, "ชื่อผู้รับปลายทาง");
     var statusIdx = getHeaderIndex(headers, "สถานะปัจจุบัน");
     var dateIdx = getHeaderIndex(headers, "วันที่และเวลารับเข้า");

     for(var r = 1; r < data.length; r++) {
        if (results.length >= maxResults) break;
        var row = data[r];
        var match = true;
        
        if (filters.keyword) {
           var kw = String(filters.keyword).toLowerCase().trim();
           var fId = String(row[idIdx] || "").toLowerCase();
           var fTrack = String(row[trackIdx] || "").toLowerCase();
           var fRec = String(row[recIdx] || "").toLowerCase();
           var fDept = String(row[deptIdx] || "").toLowerCase();
           
           if (fId.indexOf(kw) === -1 && fTrack.indexOf(kw) === -1 && fRec.indexOf(kw) === -1 && fDept.indexOf(kw) === -1) match = false;
        }
        if (match && filters.status && filters.status !== "all") {
           if (String(row[statusIdx]).trim() !== filters.status.trim()) match = false;
        }
        if (match && filters.department) {
           if (String(row[deptIdx]).trim().toLowerCase().indexOf(String(filters.department).toLowerCase().trim()) === -1) match = false;
        }
        
        if (match) {
           results.push({
              id: row[idIdx],
              trackingNumber: row[trackIdx] || "-",
              type: row[typeIdx],
              department: row[deptIdx],
              recipientName: row[recIdx],
              status: row[statusIdx],
              date: row[dateIdx]
           });
        }
     }
  }
  
  return { success: true, results: results };
}
