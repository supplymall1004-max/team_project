# Unity WebGL 빌드 스크립트
# 사용법: .\scripts\build-unity-webgl.ps1

param(
    [string]$UnityProjectPath = "E:\team\team_project\unity-project",
    [string]$BuildOutputPath = "E:\team\team_project\public\game\unity-build"
)

Write-Host "=== Unity WebGL 빌드 스크립트 ===" -ForegroundColor Cyan
Write-Host ""

# Unity 설치 경로 찾기
$unityPaths = @(
    "$env:ProgramFiles\Unity\Hub\Editor\*\Editor\Unity.exe",
    "$env:LOCALAPPDATA\Programs\Unity\Hub\Editor\*\Editor\Unity.exe",
    "$env:ProgramFiles(x86)\Unity\Hub\Editor\*\Editor\Unity.exe"
)

$unityExe = $null
foreach ($path in $unityPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $unityExe = $found.FullName
        break
    }
}

if (-not $unityExe) {
    Write-Host "❌ Unity 에디터를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Unity 설치가 필요합니다:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub 다운로드: https://unity.com/download" -ForegroundColor White
    Write-Host "2. Unity 2022.3 LTS 또는 2023.3 LTS 설치" -ForegroundColor White
    Write-Host "3. WebGL Build Support 모듈 설치" -ForegroundColor White
    exit 1
}

Write-Host "✅ Unity 발견: $unityExe" -ForegroundColor Green
Write-Host ""

# 프로젝트 경로 확인
if (-not (Test-Path $UnityProjectPath)) {
    Write-Host "❌ Unity 프로젝트를 찾을 수 없습니다: $UnityProjectPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Unity 프로젝트를 먼저 생성해야 합니다:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub에서 새 프로젝트 생성" -ForegroundColor White
    Write-Host "2. 프로젝트 위치: $UnityProjectPath" -ForegroundColor White
    Write-Host "3. unity-scripts 폴더의 스크립트를 Assets/Scripts로 복사" -ForegroundColor White
    exit 1
}

Write-Host "✅ Unity 프로젝트 확인: $UnityProjectPath" -ForegroundColor Green
Write-Host ""

# 빌드 출력 폴더 생성
if (-not (Test-Path $BuildOutputPath)) {
    New-Item -ItemType Directory -Path $BuildOutputPath -Force | Out-Null
    Write-Host "✅ 빌드 출력 폴더 생성: $BuildOutputPath" -ForegroundColor Green
}

# 빌드 로그 경로
$buildLogPath = Join-Path $PSScriptRoot "..\unity-build.log"
$buildLogPath = Resolve-Path $buildLogPath -ErrorAction SilentlyContinue
if (-not $buildLogPath) {
    $buildLogPath = Join-Path (Get-Location) "unity-build.log"
}

Write-Host "빌드 시작..." -ForegroundColor Cyan
Write-Host "이 작업은 10-30분이 소요될 수 있습니다." -ForegroundColor Yellow
Write-Host "로그 파일: $buildLogPath" -ForegroundColor Gray
Write-Host ""

# Unity 빌드 실행
$buildArgs = @(
    "-batchmode",
    "-quit",
    "-projectPath", $UnityProjectPath,
    "-buildTarget", "WebGL",
    "-executeMethod", "BuildScript.BuildWebGL",
    "-logFile", $buildLogPath
)

try {
    & $unityExe $buildArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Unity 빌드 완료!" -ForegroundColor Green
        Write-Host "빌드 파일 위치: $BuildOutputPath" -ForegroundColor Green
        Write-Host ""
        
        # 빌드 파일 확인
        $loaderFile = Join-Path $BuildOutputPath "Build\CharacterGame.loader.js"
        if (Test-Path $loaderFile) {
            Write-Host "✅ 빌드 파일 확인 완료" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 빌드 파일을 찾을 수 없습니다. 로그를 확인하세요." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "❌ Unity 빌드 실패 (종료 코드: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "로그 파일 확인: $buildLogPath" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ 빌드 실행 중 오류 발생: $_" -ForegroundColor Red
    exit 1
}

