# Unity 설치 상태 빠른 확인 스크립트

Write-Host "Unity 설치 상태 확인 중..." -ForegroundColor Cyan
Write-Host ""

# Unity 에디터 확인
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
                    Write-Host "✅ Unity 에디터 설치됨: $($editor.Name)" -ForegroundColor Green
                    Write-Host "   경로: $unityEditor" -ForegroundColor Gray
                    break
                }
            }
            if ($unityEditor) { break }
        }
    }
}

if ($unityEditor) {
    Write-Host ""
    Write-Host "✅ Unity 에디터 설치 확인 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계 진행 가능:" -ForegroundColor Yellow
    Write-Host "  .\scripts\complete-unity-setup.ps1" -ForegroundColor White
} else {
    Write-Host "❌ Unity 에디터가 아직 설치되지 않았습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Unity Hub에서 Unity 에디터를 설치해주세요." -ForegroundColor Yellow
}

