/**
 * Service_Auth.gs
 * Authentication & Role Management
 *
 * Budget-zero model:
 * - Google Sheets remains the user directory.
 * - First/session login is verified by email OTP via MailApp.
 * - All protected API calls use a signed session token.
 */

var Service_Auth = {
  OTP_TTL_SECONDS: 600,
  SESSION_TTL_SECONDS: 604800, // 7 days

  requestLoginOtp: function(email) {
    try {
      var user = this._findUserByEmail(email);
      if (!user) {
        logAction(String(email || "unknown").toLowerCase(), "LOGIN_OTP", JSON.stringify({ status: "REJECTED", reason: "User not found" }));
        return { success: false, error: "ไม่พบอีเมลนี้ในรายชื่อผู้ใช้งานระบบ" };
      }

      var cleanEmail = String(user.Email).trim().toLowerCase();
      var otp = String(Math.floor(100000 + Math.random() * 900000));
      var salt = Utilities.getUuid();
      var cacheKey = this._otpCacheKey(cleanEmail);

      CacheService.getScriptCache().put(cacheKey, JSON.stringify({
        hash: this._sha256(otp + ":" + salt),
        salt: salt,
        attempts: 0,
        createdAt: Date.now()
      }), this.OTP_TTL_SECONDS);

      GmailApp.sendEmail(
        cleanEmail,
        "รหัสยืนยันเข้าใช้งาน DCG Smart ePostal",
        "รหัสยืนยันของคุณคือ " + otp + "\n\nรหัสนี้ใช้ได้ 10 นาที หากไม่ได้เป็นผู้ร้องขอ กรุณาแจ้งผู้ดูแลระบบ"
      );

      logAction(cleanEmail, "LOGIN_OTP", JSON.stringify({ status: "SENT" }));
      return {
        success: true,
        requiresOtp: true,
        email: cleanEmail,
        message: "ส่งรหัสยืนยันไปที่อีเมลแล้ว"
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  verifyLoginOtp: function(email, otp) {
    try {
      var user = this._findUserByEmail(email);
      if (!user) return { success: false, error: "ไม่พบอีเมลนี้ในรายชื่อผู้ใช้งานระบบ" };

      var cleanEmail = String(user.Email).trim().toLowerCase();
      var cache = CacheService.getScriptCache();
      var cacheKey = this._otpCacheKey(cleanEmail);
      var raw = cache.get(cacheKey);
      if (!raw) return { success: false, error: "รหัสยืนยันหมดอายุ กรุณาขอรหัสใหม่" };

      var record = JSON.parse(raw);
      if ((record.attempts || 0) >= 5) {
        cache.remove(cacheKey);
        return { success: false, error: "กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่" };
      }

      var expected = this._sha256(String(otp || "").trim() + ":" + record.salt);
      if (expected !== record.hash) {
        record.attempts = (record.attempts || 0) + 1;
        cache.put(cacheKey, JSON.stringify(record), this.OTP_TTL_SECONDS);
        return { success: false, error: "รหัสยืนยันไม่ถูกต้อง" };
      }

      cache.remove(cacheKey);
      var payload = this._publicUserPayload(user);
      payload.sessionToken = this.issueSessionToken(cleanEmail);

      logAction(cleanEmail, "LOGIN", JSON.stringify({ status: "SUCCESS", role: payload.Role }));
      return { success: true, data: payload };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  verifySession: function(token) {
    try {
      var session = this.verifySessionToken(token);
      var user = this._findUserByEmail(session.email);
      if (!user) return { success: false, error: "บัญชีผู้ใช้ถูกยกเลิกหรือไม่พบในระบบ" };
      return { success: true, data: this._publicUserPayload(user) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Backward-compatible public action. It now starts OTP instead of logging in directly.
  handleLogin: function(email) {
    return this.requestLoginOtp(email);
  },

  issueSessionToken: function(email) {
    var now = Math.floor(Date.now() / 1000);
    var payload = {
      email: String(email).trim().toLowerCase(),
      iat: now,
      exp: now + this.SESSION_TTL_SECONDS
    };
    var header = { alg: "HS256", typ: "JWT" };
    var unsigned = this._base64Url(JSON.stringify(header)) + "." + this._base64Url(JSON.stringify(payload));
    return unsigned + "." + this._sign(unsigned);
  },

  verifySessionToken: function(token) {
    // [SECURITY] mock-token bypass REMOVED for production safety (2026-07-01)
    // DEV bypass was: if ENV=DEV && token=mock-token, auto-authenticate as ROOT_ADMIN
    // This was dangerous because ENV=DEV leaking to production would grant ROOT_ADMIN to anyone

    if (!token || typeof token !== "string") throw new Error("ต้องเข้าสู่ระบบก่อนใช้งาน");

    var parts = token.split(".");
    if (parts.length !== 3) throw new Error("Session token ไม่ถูกต้อง");

    var unsigned = parts[0] + "." + parts[1];
    if (this._sign(unsigned) !== parts[2]) throw new Error("Session token ไม่ผ่านการตรวจสอบ");

    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    var now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
    return payload;
  },

  _findUserByEmail: function(email) {
    if (!email || typeof email !== "string") return null;
    var users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
    var cleanEmail = String(email).trim().toLowerCase();

    return users.find(function(u) {
      var uEmail = String(u["อีเมล (Google)"] || u["อีเมล"] || u.Email || u.email || "").toLowerCase().trim();
      return uEmail === cleanEmail;
    }) || null;
  },

  _publicUserPayload: function(user) {
    var cleanEmail = String(user.Email || user.email || user["อีเมล (Google)"] || user["อีเมล"] || "").trim().toLowerCase();
    var fullName = user["ชื่อ-นามสกุล"] || user["ชื่อ"] || user.FullName || cleanEmail.split("@")[0];
    var role = this._normalizeRole(user["สิทธิ์ (Admin/User/Postal)"] || user["สิทธิ์"] || user.Role || "User");
    var dept = user["หน่วยงาน"] || user["หน่วยงาน/แผนก"] || user.Department || "ทั่วไป";

    return {
      Email: cleanEmail,
      FullName: String(fullName).trim(),
      Role: role,
      Department: String(dept).trim(),
      Picture: user.Picture || user.picture || ""
    };
  },

  _normalizeRole: function(role) {
    var raw = String(role || "User").trim().toLowerCase();
    if (raw === "admin") return "Admin";
    if (raw === "postal") return "Postal";
    if (raw === "staff") return "Staff";
    return "User";
  },

  _otpCacheKey: function(email) {
    return "LOGIN_OTP_" + String(email).replace(/[^a-zA-Z0-9]/g, "_");
  },

  _getAuthSecret: function() {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("AUTH_TOKEN_SECRET");
    if (!secret) {
      secret = Utilities.getUuid() + ":" + Utilities.getUuid();
      props.setProperty("AUTH_TOKEN_SECRET", secret);
    }
    return secret;
  },

  _sign: function(input) {
    var bytes = Utilities.computeHmacSha256Signature(input, this._getAuthSecret());
    return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, "");
  },

  _base64Url: function(value) {
    return Utilities.base64EncodeWebSafe(value).replace(/=+$/g, "");
  },

  _sha256: function(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
    return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, "");
  },

  _getAllowedDomains: function() {
    try {
      var configSheet = typeof getSheet === "function" ? getSheet(SHEET_NAMES.CONFIG) : null;
      if (!configSheet) return [];

      var data = configSheet.getDataRange().getValues();
      if (data.length < 2) return [];

      var allowedStr = "";
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === "ALLOWED_DOMAINS") {
          allowedStr = data[i][1];
          break;
        }
      }

      if (!allowedStr || String(allowedStr).trim() === "") return [];
      return String(allowedStr).split(",").map(function(d) {
        return d.trim().toLowerCase();
      }).filter(Boolean);
    } catch (_) {
      return [];
    }
  }
};

function handleLogin(email, name, picture) {
  return Service_Auth.handleLogin(email, name, picture);
}
