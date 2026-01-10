$ErrorActionPreference = "Stop"

Write-Host "Attempting to fix XAMPP Aria Engine..."
$xamppDataPath = "C:\xampp\mysql\data"

# Stop process just in case
Stop-Process -Name "mysqld" -ErrorAction SilentlyContinue

# Remove aria_log_control
$ariaControl = Join-Path $xamppDataPath "aria_log_control"
if (Test-Path $ariaControl) {
    Write-Host "Removing $ariaControl..."
    Remove-Item $ariaControl -Force
} else {
    Write-Host "aria_log_control not found."
}

# Ensure aria_log is gone too (if it came back)
$ariaLog = Join-Path $xamppDataPath "aria_log.00000001"
if (Test-Path $ariaLog) {
    Write-Host "Removing $ariaLog..."
    Remove-Item $ariaLog -Force
}

Write-Host "Done. Please try starting MySQL again."
