# Unity 프로젝트 생성 및 빌드 스크립트
# PowerShell 스크립트

Write-Host "=== Unity WebGL 빌드 자동화 스크립트 ===" -ForegroundColor Cyan

# Unity 설치 경로 확인
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
        Write-Host "✅ Unity 발견: $unityExe" -ForegroundColor Green
        break
    }
}

if (-not $unityExe) {
    Write-Host "❌ Unity 에디터를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Unity 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub 다운로드: https://unity.com/download" -ForegroundColor White
    Write-Host "2. Unity Hub에서 Unity 2022.3 LTS 또는 2023.3 LTS 설치" -ForegroundColor White
    Write-Host "3. WebGL Build Support 모듈 설치 (필수!)" -ForegroundColor White
    Write-Host ""
    Write-Host "Unity 설치 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

# 프로젝트 경로 설정
$projectRoot = "E:\team\team_project"
$unityProjectPath = Join-Path $projectRoot "unity-project"
$buildOutputPath = Join-Path $projectRoot "public\game\unity-build"

Write-Host ""
Write-Host "프로젝트 경로: $unityProjectPath" -ForegroundColor Cyan
Write-Host "빌드 출력 경로: $buildOutputPath" -ForegroundColor Cyan
Write-Host ""

# Unity 프로젝트가 있는지 확인
if (-not (Test-Path $unityProjectPath)) {
    Write-Host "⚠️ Unity 프로젝트가 없습니다. 새 프로젝트를 생성해야 합니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Unity 프로젝트 생성 방법:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub 실행" -ForegroundColor White
    Write-Host "2. Projects 탭 > New Project 클릭" -ForegroundColor White
    Write-Host "3. Template: 2D 또는 3D 선택" -ForegroundColor White
    Write-Host "4. Project Name: CharacterGame" -ForegroundColor White
    Write-Host "5. Location: $unityProjectPath" -ForegroundColor White
    Write-Host "6. Create Project 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "프로젝트 생성 후 unity-scripts 폴더의 스크립트를 Assets/Scripts로 복사하세요." -ForegroundColor Yellow
    exit 1
}

# 빌드 출력 폴더 생성
if (-not (Test-Path $buildOutputPath)) {
    New-Item -ItemType Directory -Path $buildOutputPath -Force | Out-Null
    Write-Host "✅ 빌드 출력 폴더 생성: $buildOutputPath" -ForegroundColor Green
}

# Unity 빌드 실행
Write-Host ""
Write-Host "Unity WebGL 빌드 시작..." -ForegroundColor Cyan
Write-Host "이 작업은 10-30분이 소요될 수 있습니다." -ForegroundColor Yellow
Write-Host ""

$buildLogPath = Join-Path $projectRoot "unity-build.log"

# Unity 빌드 명령 실행
& $unityExe `
    -batchmode `
    -quit `
    -projectPath $unityProjectPath `
    -buildTarget WebGL `
    -buildPath $buildOutputPath `
    -logFile $buildLogPath `
    -executeMethod BuildScript.BuildWebGL

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Unity 빌드 완료!" -ForegroundColor Green
    Write-Host "빌드 파일 위치: $buildOutputPath" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Unity 빌드 실패" -ForegroundColor Red
    Write-Host "로그 파일 확인: $buildLogPath" -ForegroundColor Yellow
    exit 1
}

