/**
 * Scratch script to initialize the Materialized Stats snapshot.
 */
function runInitialization() {
  try {
    // 1. Initialize sheets if missing
    initializeSystemSheets();
    
    // 2. Recalculate stats from scratch
    var result = Service_Package.recalculateStatsSnapshot();
    console.log("Stats Recalculation Result: " + JSON.stringify(result));
    
  } catch (e) {
    console.error("Initialization failed: " + e.message);
  }
}
