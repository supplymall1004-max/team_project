# 개발 서버 문제 해결 스크립트
Write-Host "🔧 개발 서버 문제 해결 시작..." -ForegroundColor Cyan

# 1. 3000 포트 프로세스 종료
Write-Host "`n📍 Step 1: 3000 포트 사용 중인 프로세스 확인 및 종료..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pid in $processes) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  ❌ PID $pid ($($process.ProcessName)) 종료 중..." -ForegroundColor Red
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ PID $pid 종료 완료" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ℹ️ 3000 포트를 사용 중인 프로세스가 없습니다." -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️ 포트 확인 중 오류 발생 (무시): $_" -ForegroundColor Yellow
}

# 2. Node 프로세스 전체 종료 (선택적)
Write-Host "`n📍 Step 2: 모든 Node.js 프로세스 종료..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            Write-Host "  ❌ Node.js PID $($_.Id) 종료 중..." -ForegroundColor Red
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  ✅ 모든 Node.js 프로세스 종료 완료" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️ 실행 중인 Node.js 프로세스가 없습니다." -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️ Node 프로세스 종료 중 오류 발생 (무시): $_" -ForegroundColor Yellow
}

# 3. .next 폴더 삭제
Write-Host "`n📍 Step 3: .next 폴더 삭제..." -ForegroundColor Yellow
$projectRoot = Split-Path $PSScriptRoot -Parent
$nextPath = Join-Path $projectRoot ".next"
if (Test-Path $nextPath) {
    Write-Host "  🗑️ .next 폴더 삭제 중..." -ForegroundColor Red
    try {
        Remove-Item -Path $nextPath -Recurse -Force -ErrorAction Stop
        Write-Host "  ✅ .next 폴더 삭제 완료" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ .next 폴더 삭제 실패: $_" -ForegroundColor Yellow
        Write-Host "  💡 수동으로 삭제해주세요: $nextPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️ .next 폴더가 없습니다." -ForegroundColor Gray
}

# 4. node_modules/.cache 삭제 (선택적)
Write-Host "`n📍 Step 4: node_modules/.cache 폴더 삭제..." -ForegroundColor Yellow
$cachePath = Join-Path $projectRoot "node_modules" | Join-Path -ChildPath ".cache"
if (Test-Path $cachePath) {
    Write-Host "  🗑️ 캐시 폴더 삭제 중..." -ForegroundColor Red
    try {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction Stop
        Write-Host "  ✅ 캐시 폴더 삭제 완료" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ 캐시 폴더 삭제 실패: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️ 캐시 폴더가 없습니다." -ForegroundColor Gray
}

# 5. 대기
Write-Host "`n📍 Step 5: 프로세스 정리 대기 (2초)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 완료 메시지
Write-Host "`n✅ 개발 서버 문제 해결 완료!" -ForegroundColor Green
Write-Host "📌 이제 'pnpm dev' 명령어로 서버를 다시 시작하세요." -ForegroundColor Cyan

