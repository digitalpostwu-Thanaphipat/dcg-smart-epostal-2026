/**
 * Service_Backup.gs - DCG Smart Flow v4.0 Standard
 * Automated Backup & Retention Policy (30 Days)
 */

function runAutoBackup() {
  const props = PropertiesService.getScriptProperties();
  const backupFolderId = props.getProperty("BACKUP_FOLDER_ID");
  
  if (!backupFolderId) {
    console.warn("BACKUP_FOLDER_ID not set. Skipping auto-backup.");
    return;
  }

  try {
    const mainSsId = getActiveDatabaseId();
    const mainFile = DriveApp.getFileById(mainSsId);
    const folder = DriveApp.getFolderById(backupFolderId);
    
    // 1. Create Snapshot
    const timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HHmm");
    const backupName = `BACKUP_ePostal_${timestamp}`;
    mainFile.makeCopy(backupName, folder);
    console.log(`Backup created: ${backupName}`);

    // 2. Retention Policy (30 Days)
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const files = folder.getFiles();
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith("BACKUP_") && file.getDateCreated() < cutoffDate) {
        file.setTrashed(true);
        deletedCount++;
      }
    }
    console.log(`Retention policy applied: Deleted ${deletedCount} old backups.`);
    
  } catch (e) {
    console.error("Backup Error: " + e.message);
  }
}

function createDailyBackup() {
  return runAutoBackup();
}
