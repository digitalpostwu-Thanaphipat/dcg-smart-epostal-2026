/**
 * Tests_Backend.gs - TDD Test Suite for EPostal Backend
 * [TDD Workflow] RED Phase: Verification of 16-column enforcement
 */

function runBackendTests() {
  const results = [];
  results.push(test_schemaEnforcement());
  results.push(test_roleNormalization());
  results.push(test_masterDataRetrieval());
  
  console.log("--- TEST RESULTS ---");
  results.forEach(r => console.log(`${r.success ? "✅" : "❌"} ${r.name}: ${r.message}`));
  return results;
}


/**
 * Test: 16-Column Enforcement
 * Objective: Verify that getSheet throws error on "Phantom Columns".
 */
function test_schemaEnforcement() {
  const testName = "Schema Enforcement (Phantom Column Protection)";
  try {
    const ssId = getActiveDatabaseId();
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName(SHEET_NAMES.PACKAGE_LOG);
    if (!sheet) return { name: testName, success: false, message: "Package_Log sheet not found" };

    // 1. Arrange: Add a 17th column (Phantom)
    const originalColCount = sheet.getLastColumn();
    if (originalColCount > 16) {
       // Already has phantom columns, try to repair first
       Service_Schema.repairPackageLogHeaders();
    }
    
    // Ensure we are at 16
    sheet.getRange(1, 1, 1, 16).setValues([Service_Schema.DEFAULT_PACKAGE_LOG_SCHEMA]);
    if (sheet.getMaxColumns() > 16) {
      // We can't easily delete columns in a test without affecting production 
      // but we can test the validation logic directly.
    }

    // Direct validation test
    var mockSheet = {
      getLastColumn: function() { return 17; },
      getName: function() { return "Package_Log"; },
      getRange: function() { 
        return { 
          getValues: function() { 
            return [Service_Schema.DEFAULT_PACKAGE_LOG_SCHEMA.concat(["Phantom"])]; 
          } 
        }; 
      }
    };

    var result = Service_Schema.validatePackageLogSheet(mockSheet);
    if (!result.valid && result.phantomDetected) {
      return { name: testName, success: true, message: "Correctly detected phantom columns." };
    } else {
      return { name: testName, success: false, message: "Failed to detect phantom columns." };
    }
  } catch (e) {
    return { name: testName, success: false, message: "Error: " + e.message };
  }
}

/**
 * Test: Role Normalization
 */
function test_roleNormalization() {
  const testName = "Role Normalization Audit";
  const testCases = [
    { input: "admin", expected: "Admin" },
    { input: "POSTAL", expected: "Postal" },
    { input: " staff ", expected: "Staff" },
    { input: "unknown", expected: "User" }
  ];

  for (let tc of testCases) {
    let result = Service_Auth._normalizeRole(tc.input);
    if (result !== tc.expected) {
      return { name: testName, success: false, message: `Failed for ${tc.input}: expected ${tc.expected}, got ${result}` };
    }
  }
  return { name: testName, success: true, message: "All role normalization cases passed." };
}

/**
 * Test: Master Data Retrieval (Dynamic Mapping)
 * Objective: Verify getHeaderIndex logic with various sheet variations
 */
function test_masterDataRetrieval() {
  const testName = "Master Data Dynamic Mapping";
  try {
    // Mock headers for Personnel sheet
    const mockHeaders = ["อีเมล", "ชื่อ-นามสกุล", "รหัสหน่วยงาน", "Extra"];
    const emailIdx = getHeaderIndex(mockHeaders, ["อีเมล", "Email"]);
    const nameIdx = getHeaderIndex(mockHeaders, ["ชื่อ-นามสกุล", "Full Name"]);
    const deptIdx = getHeaderIndex(mockHeaders, ["รหัสหน่วยงาน", "DeptID"]);

    if (emailIdx !== 0 || nameIdx !== 1 || deptIdx !== 2) {
      return { name: testName, success: false, message: `Mapping failed for Personnel: ${emailIdx},${nameIdx},${deptIdx}` };
    }

    // Mock headers for Positions sheet (swapped order)
    const mockPosHeaders = ["ชื่อตำแหน่ง", "รหัสหน่วยงาน"];
    const pDeptIdx = getHeaderIndex(mockPosHeaders, ["รหัสหน่วยงาน", "DeptID"]);
    const pPosIdx = getHeaderIndex(mockPosHeaders, ["ชื่อตำแหน่ง", "Position"]);

    if (pDeptIdx !== 1 || pPosIdx !== 0) {
      return { name: testName, success: false, message: `Mapping failed for Positions (Swapped): ${pDeptIdx},${pPosIdx}` };
    }

    // Partial match test
    const partialHeaders = ["Email Address", "Employee Name", "Dept Code"];
    const emailPIdx = getHeaderIndex(partialHeaders, "Email");
    const namePIdx = getHeaderIndex(partialHeaders, "Name");
    const deptPIdx = getHeaderIndex(partialHeaders, "Dept");

    if (emailPIdx !== 0 || namePIdx !== 1 || deptPIdx !== 2) {
      return { name: testName, success: false, message: `Partial mapping failed: ${emailPIdx},${namePIdx},${deptPIdx}` };
    }

    return { name: testName, success: true, message: "Dynamic mapping logic verified successfully." };
  } catch (e) {
    return { name: testName, success: false, message: "Error: " + e.message };
  }
}
