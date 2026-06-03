# Trending Dashboard - Windows PowerShell dev launcher (Scheme 1)
# Maps WSL to Z: for file access, installs and runs Vite inside WSL.

$ErrorActionPreference = "Stop"

$WslProjectPath = "/home/hermes/projects/trending-dashboard"
$ZProject = "Z:\home\hermes\projects\trending-dashboard"

# 1) Ensure Z: drive is mapped (optional, for Explorer / IDE access)
if (-not (Test-Path $ZProject)) {
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    net use Z: \\wsl$\Ubuntu 2>&1 | Out-Null
    $ErrorActionPreference = $prevErrorAction
    if (-not (Test-Path $ZProject)) {
        Write-Host "Tip: run 'net use Z: \\wsl$\\Ubuntu' manually if Z: is not mapped."
    }
}

Write-Host "Trending Dashboard - local dev (Scheme 1)"
Write-Host "Project: $ZProject"
Write-Host ""
Write-Host "Starting in WSL (Node 22 + Vite)..."
Write-Host "Browser: http://localhost:5173/"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

Set-Location $env:USERPROFILE
wsl -d Ubuntu --cd $WslProjectPath -e bash -lc "bash scripts/dev-wsl.sh"
