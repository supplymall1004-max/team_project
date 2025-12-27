# Unity 에디터 설치 확인 및 안내 스크립트

Write-Host "=== Unity 에디터 설치 확인 ===" -ForegroundColor Cyan
Write-Host ""

# Unity Hub 경로 확인
$hubPaths = @(
    "$env:ProgramFiles\Unity Hub\Unity Hub.exe",
    "$env:LOCALAPPDATA\Programs\Unity Hub\Unity Hub.exe",
    "$env:ProgramFiles(x86)\Unity Hub\Unity Hub.exe"
)

$unityHubExe = $null
foreach ($path in $hubPaths) {
    if (Test-Path $path) {
        $unityHubExe = $path
        Write-Host "✅ Unity Hub 발견: $unityHubExe" -ForegroundColor Green
        break
    }
}

if (-not $unityHubExe) {
    Write-Host "❌ Unity Hub를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "먼저 Unity Hub를 설치해주세요." -ForegroundColor Yellow
    exit 1
}

# Unity 에디터 설치 경로 확인
$editorPaths = @(
    "$env:ProgramFiles\Unity\Hub\Editor",
    "$env:LOCALAPPDATA\Programs\Unity\Hub\Editor",
    "$env:ProgramFiles(x86)\Unity\Hub\Editor"
)

$unityEditor = $null
foreach ($basePath in $editorPaths) {
    if (Test-Path $basePath) {
        $editors = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue
        if ($editors) {
            foreach ($editor in $editors) {
                $unityExe = Join-Path $editor.FullName "Editor\Unity.exe"
                if (Test-Path $unityExe) {
                    $unityEditor = $unityExe
                    Write-Host "✅ Unity 에디터 발견: $unityEditor" -ForegroundColor Green
                    Write-Host "   버전: $($editor.Name)" -ForegroundColor Gray
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
    Write-Host "Unity 에디터 설치가 필요합니다:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Unity Hub 실행" -ForegroundColor White
    Write-Host "   경로: $unityHubExe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Installs 탭 > Install Editor 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Unity 버전 선택 (권장: 2022.3 LTS 또는 2023.3 LTS)" -ForegroundColor White
    Write-Host ""
    Write-Host "4. 모듈 선택 (필수):" -ForegroundColor White
    Write-Host "   ✅ WebGL Build Support" -ForegroundColor Green
    Write-Host "   ✅ Windows Build Support (IL2CPP)" -ForegroundColor Green
    Write-Host ""
    Write-Host "5. Install 클릭하여 설치 완료" -ForegroundColor White
    Write-Host ""
    Write-Host "설치 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    Write-Host ""
    
    # Unity Hub 자동 실행
    Write-Host "Unity Hub 실행 중..." -ForegroundColor Cyan
    Start-Process -FilePath $unityHubExe
    
    Write-Host ""
    Write-Host "Unity Hub가 열렸습니다. 위의 단계를 따라 Unity 에디터를 설치하세요." -ForegroundColor Yellow
    Write-Host "설치 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    
    exit 1
}

Write-Host ""
Write-Host "✅ Unity 에디터 설치 확인 완료!" -ForegroundColor Green
Write-Host ""

# Unity 프로젝트 경로 확인
$unityProjectPath = "E:\team\team_project\unity-project"
if (-not (Test-Path $unityProjectPath)) {
    Write-Host "⚠️ Unity 프로젝트가 없습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Unity 프로젝트 생성이 필요합니다:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Unity Hub 실행" -ForegroundColor White
    Write-Host "2. Projects 탭 > New Project 클릭" -ForegroundColor White
    Write-Host "3. Template 선택: 2D 또는 3D" -ForegroundColor White
    Write-Host "4. Project Name: CharacterGame" -ForegroundColor White
    Write-Host "5. Location: $unityProjectPath" -ForegroundColor White
    Write-Host "6. Create Project 클릭" -ForegroundColor White
    Write-Host ""
    Write-Host "프로젝트 생성 후 다음을 진행하세요:" -ForegroundColor Yellow
    Write-Host "1. unity-scripts 폴더의 BuildScript.cs를 Assets/Scripts로 복사" -ForegroundColor White
    Write-Host "2. File > Build Settings > WebGL 선택 > Switch Platform" -ForegroundColor White
    Write-Host "3. .\scripts\build-unity-webgl.ps1 실행" -ForegroundColor White
    Write-Host ""
    
    # Unity Hub 자동 실행
    Write-Host "Unity Hub 실행 중..." -ForegroundColor Cyan
    Start-Process -FilePath $unityHubExe
    
    Write-Host ""
    Write-Host "Unity Hub가 열렸습니다. 위의 단계를 따라 Unity 프로젝트를 생성하세요." -ForegroundColor Yellow
    Write-Host "프로젝트 생성 완료 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    
    exit 1
}

Write-Host "✅ Unity 프로젝트 확인: $unityProjectPath" -ForegroundColor Green
Write-Host ""

# 빌드 스크립트 확인
$buildScriptPath = "E:\team\team_project\unity-scripts\BuildScript.cs"
if (-not (Test-Path $buildScriptPath)) {
    Write-Host "⚠️ 빌드 스크립트를 찾을 수 없습니다: $buildScriptPath" -ForegroundColor Yellow
    Write-Host "unity-scripts 폴더를 확인하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 빌드 스크립트 확인: $buildScriptPath" -ForegroundColor Green
Write-Host ""

Write-Host "=== 모든 준비가 완료되었습니다! ===" -ForegroundColor Green
Write-Host ""
Write-Host "다음 명령으로 Unity WebGL 빌드를 실행하세요:" -ForegroundColor Yellow
Write-Host "  .\scripts\build-unity-webgl.ps1" -ForegroundColor White
Write-Host ""

