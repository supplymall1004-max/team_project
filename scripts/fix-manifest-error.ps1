# Next.js page_client-reference-manifest.js 에러 해결 스크립트

Write-Host "🔧 Next.js manifest 에러 해결 스크립트 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. 모든 Node.js 프로세스 종료
Write-Host "1️⃣ 모든 Node.js 프로세스 종료 중..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "   종료 중: PID $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
Write-Host "   ✅ 완료" -ForegroundColor Green
Write-Host ""

# 2. 포트 3000 해제
Write-Host "2️⃣ 포트 3000 해제 중..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        $pid = $_.OwningProcess
        if ($pid -and $pid -ne 0) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "   포트 3000 프로세스 종료: PID $pid" -ForegroundColor Gray
            } catch {
                Write-Host "   ⚠️ 프로세스 종료 실패: PID $pid" -ForegroundColor Yellow
            }
        }
    }
    Start-Sleep -Seconds 2
}
Write-Host "   ✅ 완료" -ForegroundColor Green
Write-Host ""

# 3. .next 폴더 완전 삭제
Write-Host "3️⃣ .next 폴더 삭제 중..." -ForegroundColor Yellow
if (Test-Path .next) {
    try {
        # 파일 잠금 해제를 위해 여러 번 시도
        $maxAttempts = 5
        $attempt = 0
        $deleted = $false
        
        while ($attempt -lt $maxAttempts -and -not $deleted) {
            $attempt++
            Write-Host "   시도 $attempt/$maxAttempts..." -ForegroundColor Gray
            try {
                Get-ChildItem -Path .next -Recurse -Force -ErrorAction Stop | Remove-Item -Force -Recurse -ErrorAction Stop
                Remove-Item -Path .next -Force -Recurse -ErrorAction Stop
                $deleted = $true
                Write-Host "   ✅ .next 폴더 삭제 완료" -ForegroundColor Green
            } catch {
                if ($attempt -lt $maxAttempts) {
                    Write-Host "   ⚠️ 일부 파일이 잠겨있습니다. 재시도 중..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 2
                } else {
                    Write-Host "   ❌ .next 폴더 삭제 실패" -ForegroundColor Red
                    Write-Host "   💡 수동으로 삭제해주세요: Remove-Item -Recurse -Force .next" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        Write-Host "   ❌ 오류 발생: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ℹ️ .next 폴더가 없습니다" -ForegroundColor Gray
}
Write-Host ""

# 4. 캐시 폴더 삭제
Write-Host "4️⃣ 캐시 폴더 삭제 중..." -ForegroundColor Yellow
$cachePaths = @(
    "node_modules\.cache",
    ".turbo",
    ".next",
    "node_modules\.vite"
)

foreach ($cachePath in $cachePaths) {
    if (Test-Path $cachePath) {
        try {
            Remove-Item -Recurse -Force $cachePath -ErrorAction SilentlyContinue
            Write-Host "   ✅ $cachePath 삭제 완료" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ $cachePath 삭제 실패 (무시)" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# 5. 완료 메시지
Write-Host "✅ 정리 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 다음 명령어로 서버를 시작하세요:" -ForegroundColor Cyan
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 만약 에러가 계속 발생하면:" -ForegroundColor Yellow
Write-Host "   1. 관리자 권한으로 PowerShell 실행" -ForegroundColor White
Write-Host "   2. 이 스크립트 다시 실행" -ForegroundColor White
Write-Host "   3. pnpm dev 실행" -ForegroundColor White
Write-Host ""

