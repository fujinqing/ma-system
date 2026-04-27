# M-A System V1.0 Package Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "M-A System V1.0 Packaging" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SOURCE = "D:\M-A_SYSTEM\frontend\dist"
$DEST = "D:\M-A_SYSTEM\V1.0\frontend"
$SERVER_SOURCE = "D:\M-A_SYSTEM\frontend\server"
$SERVER_DEST = "D:\M-A_SYSTEM\V1.0\server"

Write-Host "[1/3] Creating directories..." -ForegroundColor Yellow
if (!(Test-Path $DEST)) {
    New-Item -ItemType Directory -Path $DEST | Out-Null
}
Write-Host "OK: Frontend directory created" -ForegroundColor Green

if (!(Test-Path $SERVER_DEST)) {
    New-Item -ItemType Directory -Path $SERVER_DEST | Out-Null
}
Write-Host "OK: Server directory created" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Copying frontend files..." -ForegroundColor Yellow
Get-ChildItem -Path $SOURCE | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $DEST -Recurse -Force
    Write-Host "  Copied: $($_.Name)" -ForegroundColor Gray
}
Write-Host "OK: Frontend files copied" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Copying server files..." -ForegroundColor Yellow
Copy-Item -Path "$SERVER_SOURCE\*" -Destination $SERVER_DEST -Recurse -Force -Exclude "node_modules"
Write-Host "OK: Server files copied" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUCCESS: Package created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Location: D:\M-A_SYSTEM\V1.0" -ForegroundColor Yellow
Write-Host ""
