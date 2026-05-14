function testGetInitialData() {
  var data = AdminService.getInitialData();
  Logger.log("Departments: " + (data.departments ? data.departments.length : 0));
  Logger.log("Personnel: " + (data.personnel ? data.personnel.length : 0));
  Logger.log("Positions: " + (data.positions ? data.positions.length : 0));
  Logger.log("Reps: " + (data.representatives ? data.representatives.length : 0));
  
  if (data.personnel && data.personnel.length > 0) {
    Logger.log("Sample Personnel: " + JSON.stringify(data.personnel[0]));
  }
  if (data.positions && data.positions.length > 0) {
    Logger.log("Sample Position: " + JSON.stringify(data.positions[0]));
  }
}
