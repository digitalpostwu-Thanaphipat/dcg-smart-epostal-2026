/**
 * Service_Auth.gs
 * Authentication & Role Management
 *
 * Security hardened per api-security-best-practices skill:
 * - Configurable domain restriction via ALLOWED_DOMAINS config key
 * - Rejected login attempts are logged
 * - Clean email normalization to prevent mismatch
 */

var Service_Auth = {
  handleLogin: function (email, name, picture) {
    // Input validation (api-security-best-practices: Step 2)
    if (!email || typeof email !== "string") {
      logAction("unknown", "LOGIN", JSON.stringify({ reason: "Missing email", status: "REJECTED" }));
      return { success: false, error: "กรุณาระบุอีเมลผู้ใช้งาน" };
    }

    const users = typeof AdminService !== "undefined" ? AdminService.getUsers() : [];
    const cleanEmail = String(email).trim().toLowerCase();

    // 1. ค้นหาผู้ใช้ (Mapping ตามชื่อหัวตารางจริงในชีท)
    const masterUser = users.find((u) => {
      // ลองหาจากหลายชื่อที่เป็นไปได้
      const uEmail = String(u["อีเมล (Google)"] || u["อีเมล"] || u.Email || u.email || "").toLowerCase().trim();
      return uEmail === cleanEmail;
    });

    if (masterUser) {
      // ดึงชื่อและสิทธิ์ตามหัวตารางจริง
      const fullName = masterUser["ชื่อ-นามสกุล"] || masterUser["ชื่อ"] || masterUser.FullName || cleanEmail.split("@")[0];
      const role = masterUser["สิทธิ์ (Admin/User/Postal)"] || masterUser["สิทธิ์"] || masterUser.Role || "User";
      const dept = masterUser["หน่วยงาน"] || masterUser.Department || "ทั่วไป";

      logAction(cleanEmail, "LOGIN", JSON.stringify({ 
        status: "SUCCESS", 
        name: String(fullName).trim(), 
        role: String(role).trim() 
      }));
      
      return {
        Email: cleanEmail,
        FullName: String(fullName).trim(),
        Role: String(role).trim(),
        Department: String(dept).trim()
      };
    }

    // 2. ตรวจสอบ Domain (ถ้ามีการตั้งค่าไว้)
    const allowedDomains = this._getAllowedDomains();
    if (allowedDomains.length > 0) {
      const emailDomain = cleanEmail.split("@")[1] || "";
      const isDomainAllowed = allowedDomains.some(
        (d) => emailDomain === d.trim().toLowerCase(),
      );

      if (!isDomainAllowed) {
        logAction(cleanEmail, "LOGIN", JSON.stringify({ status: "REJECTED", reason: "Domain not allowed" }));
        return { success: false, error: "ไม่อนุญาตให้เข้าใช้งานด้วยอีเมลโดเมนนี้ (" + emailDomain + ")" };
      }
    }

    // 3. ลงทะเบียนอัตโนมัติเป็นผู้ใช้ทั่วไป
    const defaultName = email.split("@")[0];
    logAction(cleanEmail, "LOGIN", JSON.stringify({ 
      status: "SUCCESS", 
      name: defaultName, 
      role: "User", 
      note: "Auto-registered new user" 
    }));
    return {
      Email: email,
      FullName: defaultName,
      Role: "User",
      Department: "ทั่วไป",
      Picture: picture || "",
    };
  },

  /**
   * Get allowed email domains from SystemConfig.
   * Returns empty array if not configured (= allow all).
   * @private
   */
  _getAllowedDomains: function () {
    try {
      const configSheet = typeof getSheet === "function" ? getSheet(SHEET_NAMES.CONFIG) : null;
      if (!configSheet) return [];
      
      const data = configSheet.getDataRange().getValues();
      if (data.length < 2) return [];

      let allowedStr = "";
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === "ALLOWED_DOMAINS") {
          allowedStr = data[i][1];
          break;
        }
      }

      if (!allowedStr || String(allowedStr).trim() === "") {
        return []; 
      }
      return String(allowedStr)
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
    } catch (_) {
      return []; 
    }
  }
};

// Global Alias
function handleLogin(email, name, picture) {
  return Service_Auth.handleLogin(email, name, picture);
}
