# Unity Hub 및 Unity 에디터 설치 스크립트
# 관리자 권한이 필요할 수 있습니다.

Write-Host "=== Unity 설치 스크립트 ===" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️ 관리자 권한이 필요할 수 있습니다." -ForegroundColor Yellow
    Write-Host ""
}

# Unity Hub 다운로드 URL
$unityHubUrl = "https://public-cdn.cloud.unity3d.com/hub/prod/UnityHubSetup.exe"
$tempDir = "$env:TEMP\UnityInstall"
$installerPath = Join-Path $tempDir "UnityHubSetup.exe"

# 임시 디렉토리 생성
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Write-Host "✅ 임시 디렉토리 생성: $tempDir" -ForegroundColor Green
}

# Unity Hub가 이미 설치되어 있는지 확인
$unityHubPaths = @(
    "$env:ProgramFiles\Unity Hub\Unity Hub.exe",
    "$env:LOCALAPPDATA\Programs\Unity Hub\Unity Hub.exe",
    "$env:ProgramFiles(x86)\Unity Hub\Unity Hub.exe"
)

$unityHubExe = $null
foreach ($path in $unityHubPaths) {
    if (Test-Path $path) {
        $unityHubExe = $path
        Write-Host "✅ Unity Hub가 이미 설치되어 있습니다: $unityHubExe" -ForegroundColor Green
        break
    }
}

# Unity Hub 설치
if (-not $unityHubExe) {
    Write-Host "Unity Hub 다운로드 중..." -ForegroundColor Cyan
    Write-Host "URL: $unityHubUrl" -ForegroundColor Gray
    
    try {
        # 다운로드
        Invoke-WebRequest -Uri $unityHubUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ Unity Hub 다운로드 완료" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Unity Hub 설치 시작..." -ForegroundColor Cyan
        Write-Host "설치 창이 열리면 설치를 완료해주세요." -ForegroundColor Yellow
        Write-Host ""
        
        # 설치 실행
        Start-Process -FilePath $installerPath -Wait
        
        Write-Host "✅ Unity Hub 설치 완료" -ForegroundColor Green
        Write-Host ""
        
        # 설치 후 Unity Hub 경로 다시 확인
        Start-Sleep -Seconds 3
        foreach ($path in $unityHubPaths) {
            if (Test-Path $path) {
                $unityHubExe = $path
                break
            }
        }
    } catch {
        Write-Host "❌ Unity Hub 다운로드 실패: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "수동 설치 방법:" -ForegroundColor Yellow
        Write-Host "1. https://unity.com/download 접속" -ForegroundColor White
        Write-Host "2. Unity Hub 다운로드 및 설치" -ForegroundColor White
        exit 1
    }
}

# Unity 에디터 설치 안내
Write-Host "=== Unity 에디터 설치 안내 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Unity Hub가 설치되었습니다. 다음 단계를 진행하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Unity Hub 실행" -ForegroundColor White
if ($unityHubExe) {
    Write-Host "   경로: $unityHubExe" -ForegroundColor Gray
}
Write-Host ""
Write-Host "2. Unity 계정 로그인 (또는 계정 생성)" -ForegroundColor White
Write-Host ""
Write-Host "3. Installs 탭 > Install Editor 클릭" -ForegroundColor White
Write-Host "   - Unity 2022.3 LTS 또는 2023.3 LTS 선택" -ForegroundColor Gray
Write-Host "   - WebGL Build Support 모듈 체크 (필수!)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 설치 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor White
Write-Host ""

# Unity Hub 실행 제안
if ($unityHubExe) {
    $response = Read-Host "Unity Hub를 지금 실행하시겠습니까? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Unity Hub 실행 중..." -ForegroundColor Cyan
        Start-Process -FilePath $unityHubExe
    }
}

Write-Host ""
Write-Host "Unity 에디터 설치가 완료되면 다음 명령으로 빌드를 진행하세요:" -ForegroundColor Yellow
Write-Host "  .\scripts\build-unity-webgl.ps1" -ForegroundColor White
Write-Host ""


