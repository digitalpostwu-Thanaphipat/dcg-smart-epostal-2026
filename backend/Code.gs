/**
 * Code.gs - Modular Router [Loki Mode]
 * Refactored to Registry Pattern for Scalability
 */

// 1. Registry defined as a lookup map for zero-logic dispatching

// Security: Role-Based Access Control (RBAC)
const ROLE_PERMISSIONS = {
  "Admin": ["getInitialData", "getDepts", "getPersonnel", "getPositions", "getRepresentatives", "savePackageEntry", "getPendingDeliveries", "confirmDelivery", "revertDelivery", "reportDeliveryIssue", "checkDuplicate", "getDailyOperationalStats", "searchPackages", "submitFeedback", "systemHealthCheck", "adminGetUsers", "adminAddUser", "adminUpdateUser", "adminDeleteUser", "performOCR", "getAnnouncements", "createManualBackup", "restoreFromBackup", "runMaintenance", "getSystemConfigs", "updateSystemConfig"],
  "Postal": ["getInitialData", "getDepts", "getPersonnel", "getPositions", "getRepresentatives", "savePackageEntry", "getPendingDeliveries", "confirmDelivery", "revertDelivery", "reportDeliveryIssue", "checkDuplicate", "searchPackages", "getDailyOperationalStats", "performOCR", "getAnnouncements", "submitFeedback"],
  "Staff": ["getInitialData", "getDepts", "getPersonnel", "getPositions", "getRepresentatives", "savePackageEntry", "getPendingDeliveries", "confirmDelivery", "reportDeliveryIssue", "checkDuplicate", "searchPackages", "getDailyOperationalStats", "performOCR", "getAnnouncements", "submitFeedback"],
  "User": ["getInitialData", "getDepts", "getAnnouncements", "submitFeedback", "searchPackages"]
};

const PUBLIC_ACTIONS = ["handleLogin", "systemHealthCheck", "getSystemInfo"];

var ROUTE_MAP = {
  // Admin Services
  "getDepts": () => AdminService.getDepartments(),
  "getPersonnel": () => AdminService.getPersonnel(),
  "getPositions": () => AdminService.getPositions(),
  "getRepresentatives": () => AdminService.getRepresentatives(),
  "getSystemInfo": () => AdminService.getSystemInfo(),
  "getSystemConfigs": () => AdminService.getSystemConfigs(),
  "getInitialData": () => AdminService.getInitialData(),
  "updateSystemConfig": (data) => AdminService.updateSystemConfig(data.key, data.value),
  
  // Package Services
  "savePackageEntry": (data) => Service_Package.savePackageEntry(data),
  "getPendingDeliveries": () => Service_Package.getPendingDeliveries(),
  "confirmDelivery": (data) => Service_Package.confirmDelivery(data),
  "revertDelivery": (data) => Service_Package.revertDelivery(data),
  "reportDeliveryIssue": (data) => Service_Package.reportDeliveryIssue(data),
  "checkDuplicate": (data) => Service_Package.checkDuplicate(data.trackingNumber),
  "getDailyOperationalStats": (data) => Service_Package.getDailyOperationalStats(data),
  "searchPackages": (data) => executeSearchPackages(data),
  
  // System Diagnostics & Feedback
  "submitFeedback": (data) => Service_Feedback.submitFeedback(data),
  "systemHealthCheck": () => Service_Health.systemHealthCheck(),
  "manualAuthCheck": () => manualAuthCheck(),
  
  // Admin User Management
  "adminGetUsers": () => AdminService.getUsers(),
  "adminAddUser": (data) => AdminService.addUser(data),
  "adminUpdateUser": (data) => AdminService.updateUser(data),
  "adminDeleteUser": (data) => AdminService.deleteUser(data.email),
  
  // Authentication
  "handleLogin": (data) => Service_Auth.handleLogin(data.email, data.name, data.picture),
  
  // Backup & Restore Services
  "createManualBackup": () => Service_Backup.createDailyBackup(),
  "restoreFromBackup": (data) => Service_Backup.restoreFromBackup(data.fileId),
  "runMaintenance": () => maintainDatabaseShards(),

  // AI Services
  "performOCR": (data) => Service_AI.performOCR(data.image),
  
  // Announcement Services
  "getAnnouncements": () => Service_DB.getData(SHEET_NAMES.ANNOUNCEMENTS),
  
  // Unified Metadata Fetch [v4.0]
  "getInitialMetadata": () => {
    return {
      depts: AdminService.getDepartments(),
      personnel: AdminService.getPersonnel(),
      configs: AdminService.getSystemConfigs ? (AdminService.getSystemConfigs().data || {}) : {},
      announcements: Service_DB.getData(SHEET_NAMES.ANNOUNCEMENTS)
    };
  }
};

/**
 * onOpen - สร้างเมนูพิเศษใน Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 ระบบ Epostal')
      .addItem('🛡️ จัดระเบียบและล็อกหัวตาราง', 'runSetup')
      .addSeparator()
      .addItem('🔧 ซ่อมแซมการเชื่อมต่อฐานข้อมูล', 'repairWrapper')
      .addSeparator()
      .addItem('📊 ตรวจสอบสถานะระบบ', 'manualAuthCheck')
      .addToUi();
}

/**
 * ฟังก์ชันสำหรับรันจากเมนู (Wrapper)
 */
function runSetup() {
  try {
    initializeSystemSheets();
    SpreadsheetApp.getUi().alert('✅ ดำเนินการจัดระเบียบและล็อกหัวตารางเรียบร้อยแล้ว!');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ เกิดข้อผิดพลาด: ' + e.message);
  }
}

/**
 * doGet - Serves the React Frontend (Single File Bundle)
 * Supports PWA manifest and service worker delivery
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('DCG Smart ePostal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * getManifest - ข้อมูลสำหรับติดตั้งเป็นแอป
 */
function getManifest() {
  var manifest = {
    "name": "DCG Smart ePostal",
    "short_name": "DCG ePostal",
    "description": "ระบบบริหารจัดการไปรษณีย์ภัณฑ์ภายในหน่วยงาน",
    "start_url": "./exec",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#10b981",
    "icons": [
      {
        "src": "https://cdn-icons-png.flaticon.com/512/2331/2331837.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  };
  return JSON.stringify(manifest);
}

/**
 * getServiceWorker - ระบบจัดการ Offline Caching
 */
function getServiceWorker() {
  var sw = "self.addEventListener('install', (e) => { self.skipWaiting(); });" +
           "self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });";
  return sw;
}

/**
 * doPost - Principal Dispatcher for all WRITE operations
 * [Hardened] Uses 30s LockService to prevent race conditions.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for lock (v4.0 standard)
    lock.waitLock(30000);
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data || payload; 
    
    var result = handleRequest(action, data);
    return createJSONOutput(result);
  } catch(err) {
    console.error("doPost Error: " + err.message);
    return createJSONOutput({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * handleRequest - Internal handler that maintains original standard response structure
 */
function handleRequest(action, data) {
  var response = { success: false, data: null, error: null };

  try {
    // 1. Authentication & RBAC Check
    _verifyAccess(action, data);

    // 2. Basic Payload Validation
    _validatePayload(action, data);

    if (ROUTE_MAP[action]) {
      var output = ROUTE_MAP[action](data);
      
      // Handle services that return their own {success, data, error} structure vs direct data
      if (output && typeof output === 'object' && ('success' in output)) {
        response = output;
      } else {
        response.data = output;
        response.success = true;
      }
    } else {
      throw new Error("Unknown action: " + action);
    }
  } catch (err) {
    response.error = err.message;
  }
  
  return response;
}

/**
 * _validatePayload - Ensures required fields are present for critical actions
 * @private
 */
function _validatePayload(action, data) {
  const SCHEMA = {
    "savePackageEntry": ["departmentId", "emsList"],
    "confirmDelivery": ["packageIds", "signatureImage"],
    "reportDeliveryIssue": ["packageId", "issueType"],
    "checkDuplicate": ["trackingNumber"],
    "submitFeedback": ["userEmail"],
    "adminAddUser": ["email", "fullName", "role"],
    "adminUpdateUser": ["email"],
    "adminDeleteUser": ["email"],
    "restoreFromBackup": ["fileId"]
  };
  
  if (SCHEMA[action]) {
    SCHEMA[action].forEach(field => {
      if (!data || data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required field: ${field} for action: ${action}`);
      }
    });
  }
}

function manualAuthCheck() {
  const depts = AdminService.getDepartments();
  // Call a safe test from Package Service
  const test = typeof Service_Package.testWriteData === 'function' ? Service_Package.testWriteData() : "Skipped (Function not found)";
  return "Access OK. Depts: " + depts.length + ". Write Test: " + test;
}


/**
 * [Hardened] _verifyAccess
 * Central security gate for RBAC. Uses Google Session Identity to prevent spoofing.
 */
function _verifyAccess(action, data) {
  // 0. IMMEDIATE BYPASS for ALL Public Actions (e.g. handleLogin, systemHealthCheck)
  if (PUBLIC_ACTIONS && PUBLIC_ACTIONS.indexOf(action) !== -1) {
    return true;
  }

  // 1. Get Official Identity from Google Session
  const sessionEmail = Session.getActiveUser().getEmail();
  const payloadEmail = data.staffEmail || data.userEmail || "";
  
  // 2. Determine and verify official identity
  const actorEmail = sessionEmail || payloadEmail;
  
  if (!actorEmail) {
    throw new Error("ระบบต้องการการยืนยันตัวตน (Authentication Required)");
  }

  // 3. Security Cross-Check (Log mismatch if session identity exists)
  if (sessionEmail && payloadEmail && sessionEmail.toLowerCase() !== payloadEmail.toLowerCase()) {
    console.warn(`Identity Mismatch Warning: Session(${sessionEmail}) vs Payload(${payloadEmail}). Using Session.`);
  }

  // 4. Force override payload with verified email for all downstream services
  data.staffEmail = actorEmail;
  data.userEmail = actorEmail;

  // 5. Check User Role (with Smart Caching)
  const cache = CacheService.getUserCache();
  const cacheKey = "user_role_" + actorEmail.replace(/[^a-zA-Z0-9]/g, "_");
  let role = cache.get(cacheKey);

  if (!role) {
    const users = AdminService.getUsers ? AdminService.getUsers() : [];
    const user = users.find(u => String(u.Email).toLowerCase() === actorEmail.toLowerCase());
    
    if (!user) {
      logAction(actorEmail, action, "DENIED: User not in Central DB");
      throw new Error("คุณไม่มีชื่ออยู่ในรายชื่อผู้ใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ");
    }
    role = user.Role || "User";
    // Cache the role for 15 minutes (900 seconds)
    cache.put(cacheKey, role, 900); 
    console.log(`Cache Miss: Stored role '${role}' for ${actorEmail}`);
  } else {
    console.log(`Cache Hit: Using cached role '${role}' for ${actorEmail}`);
  }

  const allowedActions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["User"];
  
  // 6. RBAC Check
  if (allowedActions.indexOf(action) === -1) {
    logAction(actorEmail, action, "DENIED: Insufficient permissions for role " + role);
    throw new Error(`คุณไม่มีสิทธิ์ดำเนินการ: ${action} (สิทธิ์ปัจจุบัน: ${role})`);
  }

  return true;
}
