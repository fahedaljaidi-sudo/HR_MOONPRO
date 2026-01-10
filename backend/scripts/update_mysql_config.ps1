$iniPath = "C:\xampp\mysql\bin\my.ini"
$content = Get-Content $iniPath

$hasSetting = $content | Select-String "innodb_force_recovery"
if ($hasSetting) {
    Write-Host "Setting already exists. Updating to 1..."
    $content = $content -replace "innodb_force_recovery\s*=.*", "innodb_force_recovery = 1"
} else {
    Write-Host "Setting not found. Adding under [mysqld]..."
    $newContent = @()
    foreach ($line in $content) {
        $newContent += $line
        if ($line.Trim() -eq "[mysqld]") {
            $newContent += "innodb_force_recovery = 1"
        }
    }
    $content = $newContent
}

Set-Content $iniPath $content
Write-Host "Updated $iniPath with innodb_force_recovery = 1"
