/**
 * Code.gs - Modular Router [Loki Mode]
 * Refactored to Registry Pattern for Scalability
 */

// 1. Registry defined as a lookup map for zero-logic dispatching

// Security: Role-Based Access Control (RBAC)
const ROLE_PERMISSIONS = {
  Admin: [
    "getInitialData",
    "getDepts",
    "getPersonnel",
    "getPositions",
    "getRepresentatives",
    "savePackageEntry",
    "getPendingDeliveries",
    "confirmDelivery",
    "revertDelivery",
    "reportDeliveryIssue",
    "checkDuplicate",
    "getDailyOperationalStats",
    "searchPackages",
    "submitFeedback",
    "systemHealthCheck",
    "adminGetUsers",
    "adminAddUser",
    "adminUpdateUser",
    "adminDeleteUser",
    "getAnnouncements",
    "createManualBackup",
    "restoreFromBackup",
    "runMaintenance",
    "getSystemConfigs",
    "updateSystemConfig",
    "setupUptimeMonitor",
  "getPublicTrackingLinks",
  "validatePackageLogSchema",
  "repairPackageLogHeaders",
  "repairProjectSheetHeaders",
  "normalizePackageLogStaffNames",
  "normalizePackageLogLegacyValues",
  ],
  Postal: [
    "getInitialData",
    "getDepts",
    "getPersonnel",
    "getPositions",
    "getRepresentatives",
    "savePackageEntry",
    "getPendingDeliveries",
    "confirmDelivery",
    "revertDelivery",
    "reportDeliveryIssue",
    "checkDuplicate",
    "searchPackages",
    "getDailyOperationalStats",
    "getAnnouncements",
    "submitFeedback",
  ],
  Staff: [
    "getInitialData",
    "getDepts",
    "getPersonnel",
    "getPositions",
    "getRepresentatives",
    "savePackageEntry",
    "getPendingDeliveries",
    "confirmDelivery",
    "reportDeliveryIssue",
    "checkDuplicate",
    "searchPackages",
    "getDailyOperationalStats",
    "getAnnouncements",
    "submitFeedback",
  ],
  User: [
    "getInitialData",
    "getDepts",
    "getAnnouncements",
    "submitFeedback",
    "searchPackages",
  ],
};

const PUBLIC_ACTIONS = [
  "handleLogin",
  "requestLoginOtp",
  "verifyLoginOtp",
  "verifySession",
  "systemHealthCheck",
  "getSystemInfo",
  "publicSearchPackages",
  "getPublicTrackingDepartments",
];

var ROUTE_MAP = {
  // Admin Services
  getDepts: () => AdminService.getDepartments(),
  getPersonnel: () => AdminService.getPersonnel(),
  getPositions: () => AdminService.getPositions(),
  getRepresentatives: () => AdminService.getRepresentatives(),
  getSystemInfo: () => AdminService.getSystemInfo(),
  getSystemConfigs: () => AdminService.getSystemConfigs(),
  getInitialData: () => AdminService.getInitialData(),
  updateSystemConfig: (data) =>
    AdminService.updateSystemConfig(data.key, data.value),
  setupUptimeMonitor: () => AdminService.setupUptimeMonitor(),

  // Package Services
  savePackageEntry: (data) => Service_Package.savePackageEntry(data),
  getPendingDeliveries: () => Service_Package.getPendingDeliveries(),
  confirmDelivery: (data) => Service_Package.confirmDelivery(data),
  revertDelivery: (data) => Service_Package.revertDelivery(data),
  reportDeliveryIssue: (data) => Service_Package.reportDeliveryIssue(data),
  checkDuplicate: (data) => Service_Package.checkDuplicate(data.trackingNumber),
  getDailyOperationalStats: (data) =>
    Service_Package.getDailyOperationalStats(data),
  searchPackages: (data) =>
    Service_Package.searchPackages
      ? Service_Package.searchPackages(data)
      : executeSearchPackages(data),
  publicSearchPackages: (data) => publicSearchPackages(data),
  getPublicTrackingLinks: () => getPublicTrackingLinks(),
  getPublicTrackingDepartments: () => getPublicTrackingDepartments(),

  // System Diagnostics & Feedback
  submitFeedback: (data) => Service_Feedback.submitFeedback(data),
  systemHealthCheck: () => Service_Health.systemHealthCheck(),
  manualAuthCheck: () => manualAuthCheck(),

  // Admin User Management
  adminGetUsers: () => AdminService.getUsers(),
  adminAddUser: (data) => AdminService.addUser(data),
  adminUpdateUser: (data) => {
    _clearUserRoleCache(data.email);
    return AdminService.updateUser(data);
  },
  adminDeleteUser: (data) => AdminService.deleteUser(data.email),

  // Authentication
  handleLogin: (data) =>
    Service_Auth.handleLogin(data.email, data.name, data.picture),
  requestLoginOtp: (data) => Service_Auth.requestLoginOtp(data.email),
  verifyLoginOtp: (data) => Service_Auth.verifyLoginOtp(data.email, data.otp),
  verifySession: (data) => Service_Auth.verifySession(data.authToken),

  // Backup & Restore Services
  createManualBackup: () => Service_Backup.createDailyBackup(),
  restoreFromBackup: (data) => Service_Backup.restoreFromBackup(data.fileId),
  runMaintenance: () =>
    typeof Service_DB !== "undefined" && Service_DB.runMaintenance
      ? Service_DB.runMaintenance()
      : maintainDatabaseShards(),
  validatePackageLogSchema: () =>
    Service_Schema.validatePackageLogSheet(
      getSheet(SHEET_NAMES.PACKAGE_LOG, null, { skipSchemaValidation: true }),
    ),
  repairPackageLogHeaders: () => Service_Schema.repairPackageLogHeaders(),
  repairProjectSheetHeaders: () => repairProjectSheetHeaders(),
  normalizePackageLogStaffNames: () => normalizePackageLogStaffNames(),
  normalizePackageLogLegacyValues: () => normalizePackageLogLegacyValues(),

  // Announcement Services
  getAnnouncements: () => Service_DB.getData(SHEET_NAMES.ANNOUNCEMENTS),

  // Unified Metadata Fetch [v4.0]
  getInitialMetadata: () => {
    return {
      depts: AdminService.getDepartments(),
      personnel: AdminService.getPersonnel(),
      positions: AdminService.getPositions(),
      representatives: AdminService.getRepresentatives(),
      configs: AdminService.getSystemConfigs
        ? AdminService.getSystemConfigs().data || {}
        : {},
      announcements: Service_DB.getData(SHEET_NAMES.ANNOUNCEMENTS),
    };
  },
};

/**
 * onOpen - สร้างเมนูพิเศษใน Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 ระบบ Epostal")
    .addItem("🛡️ จัดระเบียบและล็อกหัวตาราง", "runSetup")
    .addItem("🛠️ จัดระเบียบหัวตารางขั้นเด็ดขาด", "repairHeadersWrapper")
    .addSeparator()
    .addItem("🔧 ซ่อมแซมการเชื่อมต่อฐานข้อมูล", "repairWrapper")
    .addSeparator()
    .addItem("📊 คำนวณสถิติใหม่", "recalculateStatsWrapper")
    .addSeparator()
    .addItem("🛡️ ตรวจสอบสถานะระบบ", "manualAuthCheck")
    .addToUi();
}

/**
 * ฟังก์ชันสำหรับรันจากเมนู (Wrapper)
 */
function runSetup() {
  try {
    initializeSystemSheets();
    SpreadsheetApp.getUi().alert(
      "✅ ดำเนินการจัดระเบียบและล็อกหัวตารางเรียบร้อยแล้ว!",
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ เกิดข้อผิดพลาด: " + e.message);
  }
}

/**
 * doGet - Serves the React Frontend (Single File Bundle)
 * Supports PWA manifest and service worker delivery
 */
function doGet(e) {
  // Handle Service Worker delivery
  if (e.parameter.get === "sw") {
    return ContentService.createTextOutput(getServiceWorker()).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  // Handle Manifest delivery
  if (e.parameter.get === "manifest") {
    return ContentService.createTextOutput(getManifest()).setMimeType(
      ContentService.MimeType.JSON,
    );
  }

  // Handle Health check delivery
  if (e.parameter.get === "health") {
    var health = Service_Health.systemHealthCheck();
    return ContentService.createTextOutput(JSON.stringify(health)).setMimeType(
      ContentService.MimeType.JSON,
    );
  }

  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("DCG Smart ePostal")
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * getManifest - ข้อมูลสำหรับติดตั้งเป็นแอป
 */
function getManifest() {
  var manifest = {
    name: "DCG Smart ePostal",
    short_name: "ePostal",
    description: "ระบบบริหารจัดการไปรษณีย์ภัณฑ์ มาตรฐานหน่วยงานดิจิทัล",
    start_url: "./exec",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "https://cdn-icons-png.flaticon.com/512/2331/2331837.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
  return JSON.stringify(manifest);
}

/**
 * getServiceWorker - ระบบจัดการ Offline Caching [Enhanced]
 * VERSION: 4.0.2
 */
function getServiceWorker() {
  var CACHE_NAME = "epostal-v4.0.2";
  var sw =
    "const CACHE_NAME = '" +
    CACHE_NAME +
    "';" +
    "const ASSETS = ['./exec'];" + // Cache the main entry point
    "self.addEventListener('install', (e) => {" +
    "  self.skipWaiting();" +
    "  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));" +
    "});" +
    "self.addEventListener('activate', (e) => {" +
    "  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));" +
    "});" +
    "self.addEventListener('fetch', (e) => {" +
    "  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request).catch(() => {" +
    "    if (e.request.mode === 'navigate') return caches.match('./exec');" +
    "  })));" +
    "});";
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
  } catch (err) {
    console.error("doPost Error: " + err.message);
    return createJSONOutput({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

const SYSTEM_VERSION = "4.0.2";

/**
 * handleRequest - Internal handler that maintains original standard response structure
 */
function handleRequest(action, data) {
  var response = {
    success: false,
    data: null,
    error: null,
    systemVersion: SYSTEM_VERSION,
  };

  try {
    // 0. Version Handshake (v4.0.2 Security Standard)
    // If client version is provided and mismatched, force reload
    if (data && data.clientVersion && data.clientVersion !== SYSTEM_VERSION) {
      throw new Error(
        `STALE_CLIENT: ระบบมีการอัปเดตเป็นเวอร์ชัน ${SYSTEM_VERSION} กรุณารีเฟรชหน้าจอ`,
      );
    }

    // 1. Authentication & RBAC Check
    _verifyAccessV2(action, data);

    // 2. Basic Payload Validation
    _validatePayload(action, data);

    if (ROUTE_MAP[action]) {
      var output = ROUTE_MAP[action](data);

      // Handle services that return their own {success, data, error} structure vs direct data
      if (output && typeof output === "object" && "success" in output) {
        response = output;
      } else {
        response.data = output;
        response.success = true;
      }
    } else {
      throw new Error("ไม่พบคำสั่ง (Unknown action): " + action);
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
    savePackageEntry: ["departmentId", "emsList"],
    confirmDelivery: ["packageIds", "signatureImage"],
    reportDeliveryIssue: ["packageId", "issueType"],
    checkDuplicate: ["trackingNumber"],
    requestLoginOtp: ["email"],
    verifyLoginOtp: ["email", "otp"],
    submitFeedback: ["userEmail"],
    adminAddUser: ["email", "fullName", "role"],
    adminUpdateUser: ["email"],
    adminDeleteUser: ["email"],
    restoreFromBackup: ["fileId"],
  };

  if (SCHEMA[action]) {
    SCHEMA[action].forEach((field) => {
      if (!data || data[field] === undefined || data[field] === null) {
        throw new Error(`ขาดข้อมูลที่จำเป็น: ${field} สำหรับคำสั่ง: ${action}`);
      }
    });
  }
}

function manualAuthCheck() {
  const email = Session.getActiveUser().getEmail();
  // FORCE GmailApp Authorization Prompt
  GmailApp.sendEmail(
    email,
    "ePostal Security Check",
    "Your account has successfully authorized the required scopes for ePostal.",
  );

  const depts = AdminService.getDepartments();
  const test =
    typeof Service_Package.testWriteData === "function"
      ? Service_Package.testWriteData()
      : "Skipped";
  return (
    "สำเร็จ: ตรวจสอบการอนุญาตสิทธิ์เรียบร้อยแล้ว ส่งอีเมลทดสอบไปที่ " +
    email +
    " พบหน่วยงานทั้งหมด: " +
    depts.length
  );
}

function validatePackageLogSchema() {
  return Service_Schema.validatePackageLogSheet(
    getSheet(SHEET_NAMES.PACKAGE_LOG, null, { skipSchemaValidation: true }),
  );
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
  if (
    sessionEmail &&
    payloadEmail &&
    sessionEmail.toLowerCase() !== payloadEmail.toLowerCase()
  ) {
    console.warn(
      `Identity Mismatch Warning: Session(${sessionEmail}) vs Payload(${payloadEmail}). Using Session.`,
    );
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
    const user = users.find(
      (u) => String(u.Email).toLowerCase() === actorEmail.toLowerCase(),
    );

    if (!user) {
      logAction(actorEmail, action, "DENIED: User not in Central DB");
      throw new Error(
        "คุณไม่มีชื่ออยู่ในรายชื่อผู้ใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ",
      );
    }
    role = user.Role || "User";
    // Normalize: "admin" → "Admin", "user" → "User", "staff" → "Staff"
    role = String(role).trim();
    role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    // Cache the role for 15 minutes (900 seconds)
    cache.put(cacheKey, role, 900);
    console.log("Cache Miss: Stored role '" + role + "'");
  } else {
    console.log("Cache Hit: Using cached role '" + role + "'");
  }

  const allowedActions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["User"];

  // 6. RBAC Check
  if (allowedActions.indexOf(action) === -1) {
    logAction(
      actorEmail,
      action,
      "DENIED: Insufficient permissions for role " + role,
    );
    throw new Error(
      `คุณไม่มีสิทธิ์ดำเนินการ: ${action} (สิทธิ์ปัจจุบัน: ${role})`,
    );
  }

  return true;
}

/**
 * _clearUserRoleCache - ล้างข้อมูล Role ของผู้ใช้จาก Cache ทันทีเมื่อ Admin มีการอัปเดต
 */
function _clearUserRoleCache(email) {
  if (!email) return;
  const cacheKey = "user_role_" + String(email).replace(/[^a-zA-Z0-9]/g, "_");
  CacheService.getUserCache().remove(cacheKey);
  console.log(`Cache Cleared: Removed role cache for ${email}`);
}

/**
 * _verifyAccessV2
 * Token-first security gate. Client-provided email/role is never trusted for RBAC.
 */
function _verifyAccessV2(action, data) {
  if (PUBLIC_ACTIONS && PUBLIC_ACTIONS.indexOf(action) !== -1) {
    return true;
  }

  let actorEmail = "";
  const token = data && data.authToken;
  if (token) {
    const session = Service_Auth.verifySessionToken(token);
    actorEmail = session.email;
  } else {
    const sessionEmail = Session.getActiveUser().getEmail();
    if (sessionEmail) actorEmail = sessionEmail;
  }

  if (!actorEmail) {
    throw new Error("ระบบต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่");
  }

  data.staffEmail = actorEmail;
  data.userEmail = actorEmail;

  const cache = CacheService.getUserCache();
  const cacheKey = "user_role_" + actorEmail.replace(/[^a-zA-Z0-9]/g, "_");
  let role = cache.get(cacheKey);

  if (!role) {
    const users = AdminService.getUsers ? AdminService.getUsers() : [];
    const user = users.find(
      (u) => String(u.Email).toLowerCase() === actorEmail.toLowerCase(),
    );

    if (!user) {
      const rootAdmin = PropertiesService.getScriptProperties().getProperty("ROOT_ADMIN_EMAIL");
      if (rootAdmin && actorEmail === rootAdmin) {
        role = "Admin";
      } else {
        logAction(actorEmail, action, "DENIED: User not in Central DB");
        throw new Error(
          "คุณไม่มีชื่ออยู่ในรายชื่อผู้ใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ",
        );
      }
    } else {
      role = String(user.Role || "User").trim();
      role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
    cache.put(cacheKey, role, 900);
  }

  const allowedActions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["User"];
  if (allowedActions.indexOf(action) === -1) {
    logAction(
      actorEmail,
      action,
      "DENIED: Insufficient permissions for role " + role,
    );
    throw new Error(
      `คุณไม่มีสิทธิ์ดำเนินการ: ${action} (สิทธิ์ปัจจุบัน: ${role})`,
    );
  }

  return true;
}

/**
 * [Wrapper] recalculateStatsWrapper
 * Manual trigger for the materialized stats engine
 */
function recalculateStatsWrapper() {
  try {
    var result = Service_Package.recalculateStatsSnapshot();
    if (result.success) {
      SpreadsheetApp.getUi().alert(
        "✅ คำนวณสถิติเรียบร้อยแล้ว!\n\nทั้งหมด: " +
          result.stats.total +
          " รายการ\nรอนำจ่าย: " +
          result.stats.pending +
          " รายการ",
      );
    } else {
      throw new Error(result.error);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ เกิดข้อผิดพลาดในการคำนวณ: " + e.message);
  }
}

/**
 * [Wrapper] repairHeadersWrapper
 */
function repairHeadersWrapper() {
  try {
    var result = Service_Schema.repairPackageLogHeaders();
    SpreadsheetApp.getUi().alert(
      "✅ จัดระเบียบหัวตารางเรียบร้อยแล้ว! (จำนวนคอลัมน์: " +
        result.columnCount +
        ")",
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ เกิดข้อผิดพลาด: " + e.message);
  }
}

/**
 * [Wrapper] repairWrapper
 */
function repairWrapper() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    PropertiesService.getScriptProperties().setProperty(
      "LOCAL_DB_ID",
      ss.getId(),
    );
    SpreadsheetApp.getUi().alert(
      "✅ เชื่อมต่อฐานข้อมูล (Local ID) ใหม่เรียบร้อยแล้ว!",
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ เกิดข้อผิดพลาด: " + e.message);
  }
}
