# Next.js 개발 서버 에러 해결 가이드

## 🔍 에러 분석

### 에러 1: UNKNOWN: unknown error, open '.next\static\chunks\app\layout.js'

**원인:**
- `.next` 폴더의 파일을 읽을 수 없음
- 파일 시스템 권한 문제
- 빌드 캐시 손상

**해결 방법:**
1. `.next` 폴더 삭제 후 재빌드
2. 개발 서버 재시작

### 에러 2: Watchpack Error - EINVAL: invalid argument, lstat 'E:\System Volume Information'

**원인:**
- Next.js의 파일 감시(watch) 시스템이 Windows 시스템 폴더를 스캔하려고 시도
- `System Volume Information` 폴더는 Windows 시스템 폴더로 접근 권한이 제한됨

**해결 방법:**
- `next.config.ts`에 `webpack.watchOptions` 추가하여 시스템 폴더 제외

## 🔧 해결 방법

### 방법 1: .next 폴더 삭제 및 재빌드

```bash
# .next 폴더 삭제
Remove-Item -Recurse -Force .next

# 개발 서버 재시작
pnpm dev
```

### 방법 2: next.config.ts 설정 추가 (이미 적용됨)

`next.config.ts`에 다음 설정이 추가되었습니다:

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.next/**",
        "**/System Volume Information/**",
        "**/$RECYCLE.BIN/**",
        "**/Thumbs.db",
      ],
    };
  }
  return config;
},
```

### 방법 3: node_modules 재설치 (필요시)

```bash
# node_modules 삭제
Remove-Item -Recurse -Force node_modules

# 패키지 재설치
pnpm install

# 개발 서버 재시작
pnpm dev
```

## 📋 체크리스트

에러가 발생했을 때 다음 순서로 확인하세요:

- [ ] `.next` 폴더 삭제 후 재빌드
- [ ] `next.config.ts`에 `watchOptions` 설정 확인
- [ ] 개발 서버 재시작
- [ ] 파일 권한 확인 (관리자 권한으로 실행)
- [ ] `node_modules` 재설치 (필요시)

## 🚨 추가 문제 해결

### 문제: 서버가 계속 다운됨

**원인:**
- 메모리 부족
- 파일 감시 시스템 과부하
- 빌드 캐시 손상

**해결:**
1. 개발 서버 종료 후 `.next` 폴더 삭제
2. `pnpm dev`로 재시작
3. 메모리 사용량 확인

### 문제: 파일 변경이 감지되지 않음

**원인:**
- 파일 감시 시스템이 특정 폴더를 제외함
- Windows 파일 시스템 제한

**해결:**
- `next.config.ts`의 `watchOptions.ignored` 확인
- 필요한 폴더가 제외 목록에 있는지 확인

## 📝 참고 사항

- Windows에서 Next.js 개발 서버를 실행할 때 시스템 폴더 접근 문제가 자주 발생합니다
- `System Volume Information`, `$RECYCLE.BIN` 같은 폴더는 자동으로 제외하는 것이 좋습니다
- `.next` 폴더는 빌드 캐시이므로 삭제해도 안전합니다 (재빌드 시 자동 생성)

