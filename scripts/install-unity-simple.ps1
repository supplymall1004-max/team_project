# Unity 에디터 간단 설치 가이드 (Unity Hub 없이)
# Unity Archive에서 직접 다운로드하는 방법

Write-Host "=== Unity 에디터 직접 설치 가이드 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Unity Hub 없이 Unity 에디터를 설치하는 방법:" -ForegroundColor Yellow
Write-Host ""

Write-Host "방법 1: Unity Archive에서 직접 다운로드 (권장)" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Unity Archive 페이지 열기:" -ForegroundColor White
Write-Host "   https://unity.com/releases/editor/archive" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Unity 버전 선택:" -ForegroundColor White
Write-Host "   - Unity 2022.3 LTS (권장)" -ForegroundColor Green
Write-Host "   - 또는 Unity 2023.3 LTS" -ForegroundColor Green
Write-Host ""
Write-Host "3. 다운로드:" -ForegroundColor White
Write-Host "   - 'Unity Editor' 다운로드 (약 1-2GB)" -ForegroundColor White
Write-Host "   - 'WebGL Build Support' 다운로드 (필수!)" -ForegroundColor White
Write-Host ""
Write-Host "4. 설치:" -ForegroundColor White
Write-Host "   - Unity Editor 설치 파일 실행" -ForegroundColor White
Write-Host "   - WebGL Build Support 설치 파일 실행" -ForegroundColor White
Write-Host ""

# Unity Archive 페이지 자동 열기
Write-Host "Unity Archive 페이지 열기..." -ForegroundColor Cyan
Start-Process "https://unity.com/releases/editor/archive"

Write-Host ""
Write-Host "방법 2: Chocolatey를 통한 설치 (자동화)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chocolatey가 설치되어 있다면:" -ForegroundColor White
Write-Host "  choco install unity -y" -ForegroundColor Gray
Write-Host ""
Write-Host "하지만 WebGL 모듈은 별도로 설치해야 합니다." -ForegroundColor Yellow
Write-Host ""

Write-Host "방법 3: 기존 Unity 프로젝트에서 Unity 버전 확인" -ForegroundColor Cyan
Write-Host ""
Write-Host "이미 Unity 프로젝트가 있다면:" -ForegroundColor White
Write-Host "1. 프로젝트 폴더의 ProjectSettings/ProjectVersion.txt 확인" -ForegroundColor White
Write-Host "2. 해당 버전의 Unity 에디터만 설치" -ForegroundColor White
Write-Host ""

Write-Host "=== 설치 후 확인 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "설치 완료 후 다음 명령으로 확인:" -ForegroundColor Yellow
Write-Host "  .\scripts\check-unity-ready.ps1" -ForegroundColor White
Write-Host ""

