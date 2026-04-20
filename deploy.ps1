# DCG Smart ePostal Deployment Script (FY 2569)
# Standard: Enterprise Hardened - Master Blueprint v3.0

$ErrorActionPreference = "Stop"
$logFile = "logs/build.log"
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" -Force | Out-Null }
if (!(Test-Path "backups")) { New-Item -ItemType Directory -Path "backups" -Force | Out-Null }

function Log-Message($msg, $color = "Cyan") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fullMsg = "[$timestamp] $msg"
    Write-Host $fullMsg -ForegroundColor $color
    $fullMsg | Out-File -FilePath $logFile -Append
}

Log-Message "[START] Starting Enterprise Deployment Process..."

# 1. Pre-Build: Cleanup Old Backups (7 Days Policy)
Log-Message "[CLEANUP] Running Cleanup Policy (7 Days)..."
$limit = (Get-Date).AddDays(-7)
Get-ChildItem -Path "backups" -Filter "*.html" | Where-Object { $_.CreationTime -lt $limit } | Remove-Item -Force
Log-Message "[SUCCESS] Cleanup completed."

# 2. Pre-Build: Backup Current index.html
$sourceFile = "frontend/dist/index.html"
if (Test-Path $sourceFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmm"
    $backupFile = "backups/index_$timestamp.html"
    Copy-Item $sourceFile $backupFile
    Log-Message "[BACKUP] Created: $backupFile" -ForegroundColor Yellow
}

# 3. Validation: Directory Check
if (!(Test-Path "frontend")) {
    Log-Message "[ERROR] 'frontend' directory not found!" "Red"
    exit 1
}

# 4. Build Phase with Retry Logic (3 Times)
$maxRetries = 3
$retryCount = 0
$buildSuccess = $false

Log-Message "[BUILD] Compiling Frontend (Vite + Single-file)..."
while ($retryCount -lt $maxRetries -and -not $buildSuccess) {
    try {
        Set-Location frontend
        npm run build:gas
        Set-Location ..
        $buildSuccess = $true
    } catch {
        $retryCount++
        Set-Location ..
        if ($retryCount -lt $maxRetries) {
            Log-Message "[WARNING] Build attempt $retryCount failed. Retrying..." "Yellow"
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $buildSuccess) {
    Log-Message "[ERROR] All build attempts failed. Check logs." "Red"
    exit 1
}

# 5. Verification: Smoke Tests (Playwright)
Log-Message "[TEST] Running Smoke Tests (Playwright)..."
$headed = $false
if ($args -contains "-Headed") {
    $headed = $true
    Log-Message "[INFO] Running in Headed Mode..."
}

try {
    # Using direct npx command for better output visibility in PowerShell
    if ($headed) {
        npx playwright test --project=chromium --headed
    } else {
        npx playwright test --project=chromium
    }
    
    if ($LASTEXITCODE -ne 0) { throw "Tests failed with exit code $LASTEXITCODE" }
    Log-Message "[SUCCESS] Smoke Tests Passed!" "Green"
} catch {
    Log-Message "[ERROR] Smoke Tests Failed or Interrupted! Check 'playwright-report/index.html' for details." "Red"
    Log-Message "[DEBUG] If this is a first-run, you may need to run: npx playwright install chromium" "Yellow"
    exit 1
}

# 6. Size Guardian: Validation
if (Test-Path $sourceFile) {
    $sizeBytes = (Get-Item $sourceFile).Length
    $sizeMB = [Math]::Round($sizeBytes / 1MB, 2)
    
    if ($sizeMB -gt 30) {
        Log-Message "[ERROR] ABORT: File size ($sizeMB MB) exceeds 30MB limit!" "Red"
        exit 1
    } elseif ($sizeMB -gt 1.5) {
        Log-Message "[WARNING] File size ($sizeMB MB) is over 1.5MB." "Yellow"
    } else {
        Log-Message "[SUCCESS] File size check passed: $sizeMB MB" "Green"
    }
}

# 7. Backend Sync & Clasp Deployment
Log-Message "[DEPLOY] Syncing compiled frontend to backend..."
Copy-Item frontend\dist\index.html backend\index.html -Force

Log-Message "[DEPLOY] Pushing code to Google Apps Script..."
Set-Location backend
$pushOutput = clasp push 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Message "[ERROR] clasp push failed: $pushOutput" "Red"
    Set-Location ..
    exit 1
}

Log-Message "[DEPLOY] Creating new live version via clasp deploy..."
$deployDesc = "Auto-Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$deployOutput = clasp deploy -d `"$deployDesc`" 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Message "[ERROR] clasp deploy failed: $deployOutput" "Red"
    Set-Location ..
    exit 1
}

Log-Message "[SUCCESS] All Deployment Steps Finished! $deployOutput" "Green"
Set-Location ..

Log-Message "[FINISH] Deployment Process Completed Successfully." "Cyan"
