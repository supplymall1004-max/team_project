# Unity 전체 설정 완료 스크립트
# Unity 에디터 설치 확인 → 프로젝트 생성 → 빌드 준비

Write-Host "=== Unity 전체 설정 완료 스크립트 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Unity Hub 확인
$hubPaths = @(
    "$env:ProgramFiles\Unity Hub\Unity Hub.exe",
    "$env:LOCALAPPDATA\Programs\Unity Hub\Unity Hub.exe",
    "$env:ProgramFiles(x86)\Unity Hub\Unity Hub.exe"
)

$unityHubExe = $null
foreach ($path in $hubPaths) {
    if (Test-Path $path) {
        $unityHubExe = $path
        Write-Host "✅ Unity Hub: $unityHubExe" -ForegroundColor Green
        break
    }
}

if (-not $unityHubExe) {
    Write-Host "❌ Unity Hub를 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

# 2. Unity 에디터 확인
$editorPaths = @(
    "$env:ProgramFiles\Unity\Hub\Editor",
    "$env:LOCALAPPDATA\Programs\Unity\Hub\Editor",
    "$env:ProgramFiles(x86)\Unity\Hub\Editor"
)

$unityEditor = $null
$unityVersion = $null
foreach ($basePath in $editorPaths) {
    if (Test-Path $basePath) {
        $editors = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue
        if ($editors) {
            foreach ($editor in $editors) {
                $unityExe = Join-Path $editor.FullName "Editor\Unity.exe"
                if (Test-Path $unityExe) {
                    $unityEditor = $unityExe
                    $unityVersion = $editor.Name
                    Write-Host "✅ Unity 에디터: $unityEditor" -ForegroundColor Green
                    Write-Host "   버전: $unityVersion" -ForegroundColor Gray
                    break
                }
            }
            if ($unityEditor) { break }
        }
    }
}

if (-not $unityEditor) {
    Write-Host "⚠️ Unity 에디터가 설치되어 있지 않습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Unity 에디터 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub 실행 (이미 열려있을 수 있습니다)" -ForegroundColor White
    Write-Host "2. Installs 탭 > Install Editor 클릭" -ForegroundColor White
    Write-Host "3. Unity 2022.3 LTS 또는 2023.3 LTS 선택" -ForegroundColor White
    Write-Host "4. 모듈 선택:" -ForegroundColor White
    Write-Host "   ✅ WebGL Build Support (필수!)" -ForegroundColor Green
    Write-Host "   ✅ Windows Build Support (IL2CPP)" -ForegroundColor Green
    Write-Host "5. Install 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "Unity Hub 실행 중..." -ForegroundColor Cyan
    Start-Process -FilePath $unityHubExe
    Write-Host ""
    Write-Host "설치 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

# 3. Unity 프로젝트 확인
$unityProjectPath = "E:\team\team_project\unity-project"
$projectExists = Test-Path $unityProjectPath

if (-not $projectExists) {
    Write-Host "⚠️ Unity 프로젝트가 없습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Unity 프로젝트 생성 방법:" -ForegroundColor Yellow
    Write-Host "1. Unity Hub 실행" -ForegroundColor White
    Write-Host "2. Projects 탭 > New Project 클릭" -ForegroundColor White
    Write-Host "3. Template: 2D 또는 3D 선택" -ForegroundColor White
    Write-Host "4. Project Name: CharacterGame" -ForegroundColor White
    Write-Host "5. Location: $unityProjectPath" -ForegroundColor White
    Write-Host "6. Create Project 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "프로젝트 생성 후:" -ForegroundColor Yellow
    Write-Host "1. unity-scripts\BuildScript.cs를 Assets\Scripts로 복사" -ForegroundColor White
    Write-Host "2. File > Build Settings > WebGL 선택 > Switch Platform" -ForegroundColor White
    Write-Host ""
    Write-Host "Unity Hub 실행 중..." -ForegroundColor Cyan
    Start-Process -FilePath $unityHubExe
    Write-Host ""
    Write-Host "프로젝트 생성 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Unity 프로젝트: $unityProjectPath" -ForegroundColor Green

# 4. 빌드 스크립트 확인
$buildScriptPath = "E:\team\team_project\unity-scripts\BuildScript.cs"
if (-not (Test-Path $buildScriptPath)) {
    Write-Host "⚠️ 빌드 스크립트를 찾을 수 없습니다: $buildScriptPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 빌드 스크립트: $buildScriptPath" -ForegroundColor Green

# 5. 빌드 스크립트가 프로젝트에 복사되었는지 확인
$projectScriptPath = Join-Path $unityProjectPath "Assets\Scripts\BuildScript.cs"
if (-not (Test-Path $projectScriptPath)) {
    Write-Host "⚠️ 빌드 스크립트가 프로젝트에 복사되지 않았습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "빌드 스크립트 복사 중..." -ForegroundColor Cyan
    
    # Scripts 폴더 생성
    $scriptsDir = Join-Path $unityProjectPath "Assets\Scripts"
    if (-not (Test-Path $scriptsDir)) {
        New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    }
    
    # 빌드 스크립트 복사
    Copy-Item -Path $buildScriptPath -Destination $projectScriptPath -Force
    Write-Host "✅ 빌드 스크립트 복사 완료: $projectScriptPath" -ForegroundColor Green
} else {
    Write-Host "✅ 빌드 스크립트가 프로젝트에 있습니다." -ForegroundColor Green
}

# 6. 빌드 출력 폴더 확인
$buildOutputPath = "E:\team\team_project\public\game\unity-build"
if (-not (Test-Path $buildOutputPath)) {
    New-Item -ItemType Directory -Path $buildOutputPath -Force | Out-Null
    Write-Host "✅ 빌드 출력 폴더 생성: $buildOutputPath" -ForegroundColor Green
} else {
    Write-Host "✅ 빌드 출력 폴더: $buildOutputPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 모든 준비가 완료되었습니다! ===" -ForegroundColor Green
Write-Host ""
Write-Host "다음 명령으로 Unity WebGL 빌드를 실행하세요:" -ForegroundColor Yellow
Write-Host "  .\scripts\build-unity-webgl.ps1" -ForegroundColor White
Write-Host ""
Write-Host "또는 지금 바로 빌드를 시작하시겠습니까? (Y/N)" -ForegroundColor Cyan
Write-Host ""

