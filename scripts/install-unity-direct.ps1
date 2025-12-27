# Unity 에디터 직접 설치 스크립트 (Unity Hub 없이)
# Unity Archive에서 직접 다운로드하여 설치

param(
    [string]$UnityVersion = "2022.3.50f1",  # Unity 2022.3 LTS
    [string]$InstallPath = "$env:ProgramFiles\Unity\Editor"
)

Write-Host "=== Unity 에디터 직접 설치 스크립트 ===" -ForegroundColor Cyan
Write-Host "Unity Hub 없이 Unity Archive에서 직접 다운로드합니다." -ForegroundColor Gray
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️ 관리자 권한이 필요합니다." -ForegroundColor Yellow
    Write-Host "PowerShell을 관리자 권한으로 실행해주세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "관리자 권한으로 실행하려면:" -ForegroundColor White
    Write-Host "1. PowerShell을 우클릭" -ForegroundColor White
    Write-Host "2. '관리자 권한으로 실행' 선택" -ForegroundColor White
    Write-Host "3. 이 스크립트를 다시 실행" -ForegroundColor White
    exit 1
}

# Unity Archive 다운로드 URL 구성
# Unity Archive는 버전별로 다운로드 링크를 제공합니다
# 예: https://download.unity3d.com/download_unity/[HASH]/UnitySetup64.exe

Write-Host "Unity 버전: $UnityVersion" -ForegroundColor Cyan
Write-Host ""

# Unity 버전별 해시 (일부 주요 버전)
$unityVersions = @{
    "2022.3.50f1" = "a9906a5b1e6a"
    "2022.3.49f1" = "a9906a5b1e6a"
    "2023.3.0f1" = "a1aa2e0e3b5a"
    "2021.3.50f1" = "a1aa2e0e3b5a"
}

$versionHash = $unityVersions[$UnityVersion]
if (-not $versionHash) {
    Write-Host "⚠️ 지정된 버전의 해시를 찾을 수 없습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Unity Archive에서 직접 다운로드하는 방법:" -ForegroundColor Yellow
    Write-Host "1. https://unity.com/releases/editor/archive 접속" -ForegroundColor White
    Write-Host "2. 원하는 Unity 버전 선택 (권장: 2022.3 LTS)" -ForegroundColor White
    Write-Host "3. 'Unity Editor' 다운로드 링크 클릭" -ForegroundColor White
    Write-Host "4. 다운로드한 설치 파일 실행" -ForegroundColor White
    Write-Host "5. 설치 시 'WebGL Build Support' 모듈 선택" -ForegroundColor White
    Write-Host ""
    Write-Host "또는 Unity Hub를 사용하는 것이 더 간편합니다." -ForegroundColor Yellow
    exit 1
}

# 다운로드 URL 구성
$baseUrl = "https://download.unity3d.com/download_unity"
$unityInstallerUrl = "$baseUrl/$versionHash/UnitySetup64.exe"
$webglModuleUrl = "$baseUrl/$versionHash/UnitySetup64-WebGL-Support-for-Editor-$UnityVersion.exe"

$tempDir = "$env:TEMP\UnityDirectInstall"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

$installerPath = Join-Path $tempDir "UnitySetup64.exe"
$webglModulePath = Join-Path $tempDir "UnitySetup64-WebGL-Support.exe"

Write-Host "다운로드 준비 중..." -ForegroundColor Cyan
Write-Host "Unity 에디터 설치 파일: $unityInstallerUrl" -ForegroundColor Gray
Write-Host ""

# Unity 에디터 다운로드
Write-Host "Unity 에디터 다운로드 중..." -ForegroundColor Cyan
Write-Host "이 작업은 시간이 걸릴 수 있습니다 (약 1-2GB)." -ForegroundColor Yellow
Write-Host ""

try {
    # 다운로드 진행률 표시
    $ProgressPreference = 'Continue'
    Invoke-WebRequest -Uri $unityInstallerUrl -OutFile $installerPath -UseBasicParsing
    
    Write-Host "✅ Unity 에디터 다운로드 완료" -ForegroundColor Green
    Write-Host ""
    
    # WebGL 모듈 다운로드
    Write-Host "WebGL Build Support 모듈 다운로드 중..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $webglModuleUrl -OutFile $webglModulePath -UseBasicParsing
    
    Write-Host "✅ WebGL 모듈 다운로드 완료" -ForegroundColor Green
    Write-Host ""
    
    # 설치 실행
    Write-Host "Unity 에디터 설치 시작..." -ForegroundColor Cyan
    Write-Host "설치 창이 열리면 설치를 완료해주세요." -ForegroundColor Yellow
    Write-Host ""
    
    # Unity 설치 프로그램 실행
    # /S = 자동 설치 (선택적)
    Start-Process -FilePath $installerPath -ArgumentList "/S", "/D=$InstallPath" -Wait
    
    Write-Host "✅ Unity 에디터 설치 완료" -ForegroundColor Green
    Write-Host ""
    
    # WebGL 모듈 설치
    Write-Host "WebGL Build Support 모듈 설치 중..." -ForegroundColor Cyan
    Start-Process -FilePath $webglModulePath -ArgumentList "/S" -Wait
    
    Write-Host "✅ WebGL 모듈 설치 완료" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=== 설치 완료! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Unity 에디터 경로: $InstallPath\Editor\Unity.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Yellow
    Write-Host "1. Unity 프로젝트 생성" -ForegroundColor White
    Write-Host "2. .\scripts\complete-unity-setup.ps1 실행" -ForegroundColor White
    
} catch {
    Write-Host "❌ 다운로드 또는 설치 실패: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://unity.com/releases/editor/archive 접속" -ForegroundColor White
    Write-Host "2. Unity $UnityVersion 선택" -ForegroundColor White
    Write-Host "3. 'Unity Editor' 다운로드" -ForegroundColor White
    Write-Host "4. 'WebGL Build Support' 다운로드" -ForegroundColor White
    Write-Host "5. 두 파일 모두 실행하여 설치" -ForegroundColor White
    exit 1
}

