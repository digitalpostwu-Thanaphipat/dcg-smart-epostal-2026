/**
 * Service_AI.gs
 * Intelligence Service for OCR and Data Extraction using Gemini API
 */

var Service_AI = {
  /**
   * performOCR
   * สกัดข้อมูลจากรูปภาพหน้าพัสดุ (เลขพัสดุ, ชื่อผู้รับ)
   * @param {string} base64Image - รูปภาพในรูปแบบ Base64 (data:image/jpeg;base64,...)
   */
  performOCR: function(base64Image) {
    try {
      // 1. ดึง API Key จากการตั้งค่าระบบ (ถ้าไม่มีจะใช้ตัวจำลองหรือแจ้งเตือน)
      var apiKey = this._getGeminiApiKey();
      if (!apiKey) {
        throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในชีทการตั้งค่าระบบ");
      }

      // 2. เตรียมข้อมูลรูปภาพ (ตัด Prefix ออก)
      var imageData = base64Image.split(',')[1];
      
      // 3. เตรียม Payload สำหรับ Gemini 1.5 Flash
      var payload = {
        "contents": [{
          "parts": [
            { "text": "ช่วยอ่านข้อมูลจากรูปหน้าพัสดุนี้ และตอบกลับเป็น JSON เท่านั้น โดยมีรูปแบบ: { \"trackingNumber\": \"เลขพัสดุ\", \"recipientName\": \"ชื่อผู้รับ\" } หากไม่พบค่าใดให้ระบุว่าเป็น \"-\" ภาษาไทย 100%" },
            {
              "inline_data": {
                "mime_type": "image/jpeg",
                "data": imageData
              }
            }
          ]
        }]
      };

      // 4. เรียกใช้ API
      var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
      var options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };

      var response = UrlFetchApp.fetch(url, options);
      var json = JSON.parse(response.getContentText());

      if (json.error) {
        throw new Error("Gemini API Error: " + json.error.message);
      }

      // 5. สกัด JSON จากผลลัพธ์ที่เป็น Text
      var resultText = json.candidates[0].content.parts[0].text;
      var extractedData = this._parseAIJson(resultText);

      logAction("AI_OCR", "EXTRACT_DATA", JSON.stringify(extractedData));
      
      return {
        success: true,
        data: extractedData
      };

    } catch (e) {
      console.error("OCR Error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /**
   * ดึง API Key จากชีทการตั้งค่าระบบ
   * @private
   */
  _getGeminiApiKey: function() {
    try {
      var sheet = getSheet(SHEET_NAMES.CONFIG);
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === "GEMINI_API_KEY") return data[i][1];
      }
      return null;
    } catch (e) { return null; }
  },

  /**
   * ทำความสะอาดและแปลง Text จาก AI ให้เป็น JSON
   * @private
   */
  _parseAIJson: function(text) {
    try {
      // ค้นหาช่วงที่เป็น JSON ในกรณีที่ AI ตอบเป็น Markdown
      var jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      return { trackingNumber: "-", recipientName: "-" };
    }
  }
};

// Global Alias
function performOCR(base64Image) {
  return Service_AI.performOCR(base64Image);
}
