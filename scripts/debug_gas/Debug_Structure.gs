function debugDumpCentralStructure() {
  try {
    var centralId = "1OEb6X2xKykfrBixIPpiNayyzixcKoM3iOT6xzDJ0II0"; // From _getCentralDbId()
    var ss = SpreadsheetApp.openById(centralId);
    var sheets = ss.getSheets();
    var report = sheets.map(function(s) {
      var range = s.getRange(1, 1, 1, Math.max(1, s.getLastColumn()));
      var headers = range.getValues()[0];
      return {
        name: s.getName(),
        headers: headers,
        rowCount: s.getLastRow()
      };
    });
    console.log(JSON.stringify(report, null, 2));
    return report;
  } catch (e) {
    console.error(e.message);
    return e.message;
  }
}
