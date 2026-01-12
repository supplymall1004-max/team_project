# 개발 서버 에러 해결 가이드

## 자주 발생하는 에러들

### 1. 포트 3000 충돌 (EADDRINUSE)

**증상:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**원인:**
- 이전에 실행한 Node.js 프로세스가 정상 종료되지 않고 백그라운드에서 계속 실행 중
- 여러 개의 `pnpm dev` 명령어가 중복 실행됨

**해결 방법:**
```bash
# 방법 1: 자동 수정 스크립트 실행
pnpm dev:fix

# 방법 2: 깔끔한 재시작
pnpm dev:clean
```

---

### 2. `.next` 빌드 캐시 손상

**증상:**
```
[Error: UNKNOWN: unknown error, open 'E:\team\team_project\.next\server\app\diet\page.js']
```

**원인:**
- `.next` 폴더의 빌드 캐시가 손상됨
- Hot Module Replacement (HMR) 중 파일 잠금 문제
- 갑작스러운 서버 종료로 인한 파일 손상

**해결 방법:**
```bash
# 방법 1: 자동 수정 스크립트 실행 (.next 삭제 포함)
pnpm dev:fix

# 방법 2: 수동 삭제 후 재시작
Remove-Item -Path ".next" -Recurse -Force
pnpm dev
```

---

### 3. Server Action ID 불일치

**증상:**
```
Failed to find Server Action "70d0a02d15a69b29a7e3cfbb30426fdfef97130ce5". 
This request might be from an older or newer deployment.
```

**원인:**
- Hot reload 중 Server Action의 고유 ID가 변경됨
- 브라우저에 캐시된 이전 버전의 페이지가 새 Server Action ID를 찾지 못함
- 빌드 캐시와 실제 코드의 불일치

**해결 방법:**
```bash
# 1. 서버 재시작
pnpm dev:clean

# 2. 브라우저 하드 리프레시
# Chrome: Ctrl + Shift + R
# Edge: Ctrl + Shift + R
# Firefox: Ctrl + Shift + R
```

---

### 4. `POST /diet 404` 에러 대량 발생

**증상:**
```
POST /diet 404 in 124131ms
POST /diet 404 in 124167ms
...
```

**원인:**
- Server Action 요청이 잘못된 경로로 전송됨
- 빌드 캐시 손상으로 인한 라우팅 문제
- Hot reload 중 임시 404 발생

**해결 방법:**
```bash
# 전체 캐시 삭제 후 재시작
pnpm dev:clean
```

**참고:**
- `/diet` 엔드포인트는 페이지이며 POST API가 아닙니다
- 실제 API 엔드포인트:
  - `/api/diet/weekly/generate` - 주간 식단 생성
  - `/api/family/diet/generate` - 가족 식단 생성

---

### 5. Watchpack 에러 (무해함)

**증상:**
```
Watchpack Error (initial scan): Error: EINVAL: invalid argument, lstat 'E:\DumpStack.log.tmp'
Watchpack Error (initial scan): Error: EINVAL: invalid argument, lstat 'E:\System Volume Information'
Watchpack Error (initial scan): Error: EINVAL: invalid argument, lstat 'E:\pagefile.sys'
```

**원인:**
- Webpack의 파일 감시 시스템이 시스템 파일에 접근하려고 시도
- Windows 시스템 파일은 일반 프로세스가 접근할 수 없음

**해결 방법:**
- **무시해도 됩니다.** 개발 서버 실행에 영향을 주지 않습니다.
- 에러 메시지를 제거하고 싶다면 `next.config.js`에 watchOptions 추가:

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ignored: /^E:\\(DumpStack\.log\.tmp|System Volume Information|pagefile\.sys)/,
      };
    }
    return config;
  },
};
```

---

## 자동 수정 스크립트

프로젝트에 자동 수정 스크립트가 추가되었습니다:

### 1. `pnpm dev:fix`

**기능:**
- 3000 포트를 사용 중인 모든 프로세스 종료
- 모든 Node.js 프로세스 종료
- `.next` 폴더 삭제
- `node_modules/.cache` 폴더 삭제

**사용 시기:**
- 서버 실행 시 에러가 발생할 때
- 빌드 캐시 문제가 의심될 때
- 포트 충돌이 발생했을 때

### 2. `pnpm dev:clean`

**기능:**
- `dev:fix` 스크립트를 실행한 후 자동으로 `pnpm dev` 실행
- 깔끔한 상태에서 개발 서버 시작

**사용 시기:**
- 개발 서버를 완전히 깨끗하게 재시작하고 싶을 때
- 여러 에러가 동시에 발생했을 때

---

## 예방 방법

### 1. 서버 종료 시 주의

**올바른 종료 방법:**
```bash
# 터미널에서 Ctrl + C를 한 번만 누르고 완전히 종료될 때까지 대기
# "일괄 작업을 끝내시겠습니까 (Y/N)?" 메시지가 나오면 Y 입력
```

**피해야 할 방법:**
- Ctrl + C를 여러 번 연속으로 누르기
- 터미널 창을 강제로 닫기
- 작업 관리자에서 강제 종료

### 2. 정기적인 캐시 정리

**권장 사항:**
```bash
# 주 1회 또는 큰 변경 후 실행
pnpm dev:fix
```

### 3. Node.js 버전 확인

**현재 프로젝트 요구사항:**
- Node.js 20.x 권장
- 현재 사용 중: v22.19.0 (경고 발생하지만 작동함)

**버전 확인:**
```bash
node --version
```

---

## 추가 도움이 필요한 경우

위의 방법으로 해결되지 않는 경우:

1. **로그 확인:**
   ```bash
   # 터미널에서 전체 에러 메시지 복사
   ```

2. **완전한 재설치 (최후의 수단):**
   ```bash
   # node_modules 삭제
   Remove-Item -Path "node_modules" -Recurse -Force
   
   # .next 삭제
   Remove-Item -Path ".next" -Recurse -Force
   
   # 패키지 재설치
   pnpm install
   
   # 개발 서버 시작
   pnpm dev
   ```

3. **시스템 재부팅:**
   - 모든 방법이 실패하면 Windows 재부팅 후 다시 시도

---

## 관련 파일

- `scripts/fix-dev-server.ps1` - 자동 수정 스크립트
- `scripts/dev-clean.ps1` - 깔끔한 재시작 스크립트
- `package.json` - 스크립트 명령어 정의

