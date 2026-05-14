function debugDumpHeaders() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.LOCAL);
    var sheet = ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
    if (!sheet) {
      return "Error: Sheet " + SHEET_NAMES.PACKAGE_LOG + " not found";
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return {
      sheetName: sheet.getName(),
      headers: headers,
      headersJson: JSON.stringify(headers),
      spreadsheetName: ss.getName()
    };
  } catch (e) {
    return "Error: " + e.message;
  }
}
