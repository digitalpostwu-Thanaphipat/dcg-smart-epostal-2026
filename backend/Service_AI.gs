/**
 * Service_AI.gs
 * Legacy AI/OCR service.
 *
 * OCR entry is intentionally retired. Postal entry should use manual typing or
 * barcode scanning only, because misread tracking numbers create operational risk.
 */

var Service_AI = {
  performOCR: function() {
    return {
      success: false,
      error: "OCR_RETIRED",
      message: "OCR has been retired. Use manual entry or barcode scanning."
    };
  }
};

function performOCR() {
  return Service_AI.performOCR();
}
