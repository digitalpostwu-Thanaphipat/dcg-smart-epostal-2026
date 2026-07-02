function debugCentralUsers() {
  const centralId = SPREADSHEET_IDS.CENTRAL;
  const sheetName = SHEET_NAMES.USERS;
  
  console.log("Checking Central DB ID:", centralId);
  console.log("Checking Sheet Name:", sheetName);
  
  try {
    const ss = SpreadsheetApp.openById(centralId);
    console.log("Spreadsheet Name:", ss.getName());
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error("SHEET NOT FOUND:", sheetName);
      const allSheets = ss.getSheets().map(s => s.getName());
      console.log("Available Sheets:", allSheets);
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log("Data Rows:", data.length);
    if (data.length > 0) {
      console.log("Headers:", data[0]);
    }
    if (data.length > 1) {
      console.log("First User Row:", data[1]);
    }
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
