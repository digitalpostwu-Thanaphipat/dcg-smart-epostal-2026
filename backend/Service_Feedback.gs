/**
 * Service_Feedback.gs
 * Handles User Feedback Submission
 * [Fix M6] Uses Service_Batch.insertRows for Atomic Write
 * [Fix M1-partial] Uses Single Source of Truth: Service_Utils.formatThaiDateTime
 */

var Service_Feedback = {
  submitFeedback: function (payload) {
    try {
      // [Loki: Guardrail] Input Validation
      if (!payload || !payload.userEmail) {
        return { success: false, error: "payload.userEmail required" };
      }

      var timestamp = new Date();
      // Use SSOT: Service_Utils.formatThaiDateTime
      var thaiTime = Service_Utils.formatThaiDateTime(timestamp);

      // payload: { category, rating, comment, url, userEmail, userAgent }
      var rowData = [
        timestamp, // A: Timestamp (Object)
        thaiTime, // B: Thai Time String
        payload.userEmail, // C: User
        payload.category || "", // D: Category (Bug, Feature, Other)
        payload.rating || 0, // E: Rating (1-5)
        payload.comment || "", // F: Comment
        payload.url || "", // G: Page URL
        payload.userAgent || "", // H: Browser Info
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

      // Atomic Write via Service_Batch.insertRows
      Service_Batch.insertRows(SHEET_NAMES.FEEDBACK_LOG, [rowData], "BOTTOM");

      return { success: true, message: "ขอบคุณสำหรับความคิดเห็นครับ" };
    } catch (e) {
      Logger.log("Feedback Error: " + e.toString());
      return { success: false, error: e.toString() };
    }
  },
};

// Global Alias for Dispatcher
function submitFeedback(payload) {
  return Service_Feedback.submitFeedback(payload);
}
