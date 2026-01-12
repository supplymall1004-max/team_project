# 깔끔한 개발 서버 시작 스크립트
param(
    [switch]$Force
)

Write-Host "🚀 깔끔한 개발 서버 시작..." -ForegroundColor Cyan

# 문제 해결 스크립트 실행
$fixScript = Join-Path $PSScriptRoot "fix-dev-server.ps1"
if (Test-Path $fixScript) {
    & $fixScript
} else {
    Write-Host "⚠️ fix-dev-server.ps1 스크립트를 찾을 수 없습니다." -ForegroundColor Yellow
}

# 프로젝트 루트로 이동
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

# 개발 서버 시작
Write-Host "`n🎯 개발 서버 시작..." -ForegroundColor Cyan
pnpm dev

