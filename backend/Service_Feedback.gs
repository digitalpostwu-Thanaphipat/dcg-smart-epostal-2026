/**
 * Service_Feedback.gs
 * Handles User Feedback Submission
 * [Fix M6] Uses Service_Batch.insertRows for Atomic Write
 * [Fix M1-partial] Uses Single Source of Truth: Service_Utils.formatThaiDateTime
 */

var Service_Feedback = {
  submitFeedback: function (payload) {
    var lock = LockService.getScriptLock();
    var lockHeld = false;
    try {
      // [Security] If doPost already holds the lock, reuse it; otherwise acquire
      if (lock.hasLock()) {
        lockHeld = false;
      } else {
        lock.waitLock(10000);
        lockHeld = true;
      }
      // [Loki: Guardrail] Input Validation
      if (!payload || !payload.userEmail) {
        return { success: false, error: "payload.userEmail required" };
      }

      // [P3-7] Consent gate — reject if user hasn't consented
      if (payload.consent !== true) {
        return { success: false, error: "กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนส่งข้อเสนอแนะ" };
      }

      // [P3-7] Rate-limit: max 5 feedback per user per hour
      var email = String(payload.userEmail).toLowerCase();
      if (typeof checkRateLimit === "function") {
        checkRateLimit("feedback_" + email, 5, 3600);
      }

      var timestamp = new Date();
      // Use SSOT: Service_Utils.formatThaiDateTime
      var thaiTime = Service_Utils.formatThaiDateTime(timestamp);

      // payload: { category, rating, comment, url, userEmail, userAgent }
      // [Security] Sanitize user-controlled free-text fields (formula injection)
      var rowData = [
        timestamp, // A: Timestamp (Object)
        thaiTime, // B: Thai Time String
        payload.userEmail, // C: User
        sanitizeForSheet(payload.category || ""), // D: Category (Bug, Feature, Other)
        payload.rating || 0, // E: Rating (1-5)
        sanitizeForSheet(payload.comment || ""), // F: Comment
        sanitizeForSheet(payload.url || ""), // G: Page URL
        sanitizeForSheet(payload.userAgent || ""), // H: Browser Info
        "New", // I: Status
      ];

      // Auto-create and format Header row if sheet is completely brand new
      var sheet = typeof getSheet === "function" ? getSheet(SHEET_NAMES.FEEDBACK_LOG) : null;
      if (sheet && sheet.getLastRow() === 0) {
        var headers = [
          "Timestamp", "วันที่และเวลา (ไทย)", "ผู้ใช้งาน", "หมวดหมู่", 
          "ระดับความพอใจ (1-5)", "รายละเอียด/ข้อเสนอแนะ", "หน้า URL", "ข้อมูลเบราว์เซอร์", "สถานะ"
        ];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#10b981").setFontColor("white");
      }

      // Atomic Write via Service_Batch.insertRows (already has internal locking, but we lock the whole flow)
      Service_Batch.insertRows(SHEET_NAMES.FEEDBACK_LOG, [rowData], "BOTTOM");

      return { success: true, message: "ขอบคุณสำหรับความคิดเห็นครับ" };
    } catch (e) {
      Logger.log("Feedback Error: " + e.toString());
      return { success: false, error: e.toString() };
    } finally {
      if (lockHeld) lock.releaseLock();
    }
  },
};

// Global Alias for Dispatcher
function submitFeedback(payload) {
  return Service_Feedback.submitFeedback(payload);
}
