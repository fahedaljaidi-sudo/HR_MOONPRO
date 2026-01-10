$ErrorActionPreference = "Stop"

Write-Host "Attempting to repair XAMPP MySQL..."
$xamppDataPath = "C:\xampp\mysql\data"

if (-not (Test-Path $xamppDataPath)) {
    Write-Error "XAMPP data folder not found at $xamppDataPath"
    exit 1
}

# Stop MySQL process if running
Write-Host "Stopping any running mysqld processes..."
Stop-Process -Name "mysqld" -ErrorAction SilentlyContinue

# Backup
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backupPath = "C:\xampp\mysql\data_backup_$timestamp"
Write-Host "Backing up data folder to $backupPath..."
try {
    Copy-Item -Path $xamppDataPath -Destination $backupPath -Recurse
} catch {
    Write-Error "Failed to create backup. Aborting repair to prevent data loss."
    exit 1
}

# Remove problematic files
# Common culprits for "shutdown unexpectedly" are corrupted log files or PID files
$filesToRemove = @("ib_logfile0", "ib_logfile1", "mysql.pid", "aria_log.00000001")

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $xamppDataPath $file
    if (Test-Path $fullPath) {
        Write-Host "Removing $fullPath..."
        Remove-Item $fullPath -Force
    }
}

Write-Host "---------------------------------------------------"
Write-Host "Repair steps completed."
Write-Host "1. A backup was created at: $backupPath"
Write-Host "2. Lock files and log files have been reset."
Write-Host "Please try clicking 'Start' on MySQL in the XAMPP Control Panel now."
