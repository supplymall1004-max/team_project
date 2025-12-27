# Three.js 프로젝트 설정 스크립트

Write-Host "=== Three.js 프로젝트 설정 ===" -ForegroundColor Cyan
Write-Host "Unity 대신 Three.js를 사용하여 게임을 구현합니다." -ForegroundColor Gray
Write-Host ""

# 패키지 설치
Write-Host "Three.js 패키지 설치 중..." -ForegroundColor Cyan

# Three.js 핵심 패키지
$packages = @(
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@types/three"
)

foreach ($package in $packages) {
    Write-Host "  설치 중: $package" -ForegroundColor Gray
    pnpm add $package
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $package 설치 완료" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $package 설치 실패" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== 설치 완료 ===" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. components/game/threejs-game-canvas.tsx 생성" -ForegroundColor White
Write-Host "2. components/game/character-game-view.tsx 수정" -ForegroundColor White
Write-Host "3. Three.js 컴포넌트 구현" -ForegroundColor White
Write-Host ""
Write-Host "참고 문서: docs/threejs-integration-plan.md" -ForegroundColor Gray
Write-Host ""

