/**
 * Service_Monitor.gs
 * Automated Uptime Monitoring & Status Alerts
 * [Loki Mode] Proactive Health Engine
 */

var Service_Monitor = {
  /**
   * checkSystemUptime
   * Runs as a time-driven trigger to check system health and notify if issues occur.
   */
  checkSystemUptime: function () {
    const health = systemHealthCheck();
    
    if (health.status !== "healthy") {
      this._sendAlert(health);
    }
    
    // Optional: Log the heartbeat
    console.log(`[Heartbeat] ${health.timestamp}: ${health.status.toUpperCase()}`);
  },

  /**
   * _sendAlert
   * Formats and sends a LINE notification about system issues.
   * @private
   */
  _sendAlert: function (health) {
    const failedChecks = health.checks.filter(c => c.status !== "pass");
    const details = failedChecks.map(c => `- ${c.name}: ${c.detail}`).join("\n");
    
    const message = 
      `\n⚠️ [ePostal Alert] ระบบพบปัญหา!\n` +
      `--------------------------\n` +
      `สถานะ: ${health.status.toUpperCase()}\n` +
      `เวลา: ${health.timestamp}\n\n` +
      `รายละเอียดปัญหา:\n${details}\n` +
      `--------------------------\n` +
      `กรุณาตรวจสอบระบบด่วน!`;

    sendLineNotify(message);
  },

  /**
   * setupUptimeTrigger
   * Creates a trigger to run health checks every 10 minutes.
   */
  setupUptimeTrigger: function () {
    // Delete existing if any
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getHandlerFunction() === "checkSystemUptime") {
        ScriptApp.deleteTrigger(t);
      }
    });

    // Create new 10-minute trigger
    ScriptApp.newTrigger("checkSystemUptime")
      .timeBased()
      .everyMinutes(10)
      .create();
      
    return { success: true, message: "ติดตั้งระบบติดตาม Uptime (ทุก 10 นาที) เรียบร้อยแล้ว" };
  }
};

// Global Aliases
function checkSystemUptime() {
  Service_Monitor.checkSystemUptime();
}

function setupUptimeMonitor() {
  return Service_Monitor.setupUptimeTrigger();
}
