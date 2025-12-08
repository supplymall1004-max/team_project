# Next.js 빌드 오류 해결 가이드

## 오류 내용

```
[Error: UNKNOWN: unknown error, open 'E:\team\team_project\.next\server\app\(main)\account\subscription\page.js'] {
  errno: -4094,
  code: 'UNKNOWN',
  syscall: 'open',
  path: 'E:\\team\\team_project\\.next\\server\\app\\(main)\\account\\subscription\\page.js'
}
```

## 오류 원인 분석

이 오류는 **Next.js 빌드 캐시 손상** 또는 **파일 시스템 접근 문제**로 발생합니다.

### 가능한 원인:

1. **빌드 캐시 손상**: `.next` 폴더의 빌드 산출물이 손상되었거나 불완전한 상태
2. **파일 잠금**: 다른 프로세스(개발 서버, IDE 등)가 파일을 사용 중
3. **Windows 경로 문제**: Windows에서 긴 경로나 특수 문자 처리 문제
4. **권한 문제**: 파일/폴더 접근 권한 부족

## 해결 방법

### 1. 즉시 해결 (권장)

**`.next` 폴더 삭제 후 재빌드:**

```powershell
# PowerShell에서 실행
Remove-Item -Recurse -Force .next
pnpm dev
```

또는

```bash
# 개발 서버 중지 후
rm -rf .next
pnpm dev
```

### 2. 추가 해결 방법

#### 방법 A: 개발 서버 완전 재시작

1. 개발 서버 중지 (Ctrl+C)
2. `.next` 폴더 삭제
3. `node_modules/.cache` 폴더 삭제 (있는 경우)
4. 개발 서버 재시작

```powershell
# 개발 서버 중지 후
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
pnpm dev
```

#### 방법 B: 프로덕션 빌드 테스트

```powershell
pnpm build
```

빌드가 성공하면 개발 서버도 정상 작동할 가능성이 높습니다.

#### 방법 C: Node.js 프로세스 확인

다른 Node.js 프로세스가 실행 중인지 확인:

```powershell
Get-Process node | Stop-Process -Force
```

### 3. 근본 원인 해결

#### A. 파일 감시 프로그램 비활성화

일부 안티바이러스나 파일 감시 프로그램이 `.next` 폴더 접근을 차단할 수 있습니다.

- Windows Defender 실시간 보호에서 프로젝트 폴더 제외
- 타사 안티바이러스에서 프로젝트 폴더 제외

#### B. 경로 길이 제한 해결

Windows 경로 길이 제한(260자) 문제일 수 있습니다:

1. 레지스트리에서 긴 경로 활성화:
   - `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
   - `LongPathsEnabled` 값을 `1`로 설정

2. 또는 프로젝트를 더 짧은 경로로 이동

#### C. 권한 확인

프로젝트 폴더에 대한 읽기/쓰기 권한이 있는지 확인:

```powershell
# 현재 사용자 권한 확인
icacls E:\team\team_project
```

## 예방 방법

1. **정기적인 캐시 정리**: 주기적으로 `.next` 폴더 삭제
2. **개발 서버 안전 종료**: Ctrl+C로 정상 종료 후 재시작
3. **IDE 설정**: IDE의 파일 감시 기능 조정
4. **환경 변수 설정**: `NODE_OPTIONS=--max-old-space-size=4096` 설정

## 관련 파일

- `app/(main)/account/subscription/page.tsx`: 문제가 발생한 페이지
- `components/subscription/subscription-manager.tsx`: 사용되는 컴포넌트

## 추가 디버깅

오류가 계속 발생하면:

1. **상세 로그 확인**:
   ```powershell
   $env:NODE_ENV="development"
   pnpm dev --debug
   ```

2. **Next.js 버전 확인**:
   ```powershell
   pnpm list next
   ```

3. **의존성 재설치**:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item pnpm-lock.yaml
   pnpm install
   ```

## 참고

- Next.js 15.5.7 사용 중
- Windows 10 환경
- PowerShell 사용

