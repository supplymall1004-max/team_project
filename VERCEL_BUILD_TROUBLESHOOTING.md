# Vercel 빌드 오류 해결 가이드

## 현재 상황

로컬에서는 빌드가 성공하지만 Vercel에서 `Error: Command "pnpm build" exited with 1` 오류가 발생합니다.

## 해결 방법

### 1. Vercel 대시보드에서 빌드 로그 확인

1. [Vercel Dashboard](https://vercel.com/fgs-projects-35f37cae/team-project) 접속
2. 실패한 배포 클릭
3. **Build Logs** 탭에서 정확한 오류 메시지 확인

### 2. 필수 환경 변수 확인

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들이 **모두** 설정되어 있는지 확인:

#### 빌드 타임에 필요한 환경 변수 (NEXT_PUBLIC_*)

다음 변수들은 빌드 타임에 필요하므로 **반드시** 설정되어 있어야 합니다:

```bash
# Clerk (빌드 타임 필요)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... 또는 pk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase (빌드 타임 필요)
NEXT_PUBLIC_SUPABASE_URL=https://xlbhrgvnfioxtvocwban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

#### 런타임에만 필요한 환경 변수

다음 변수들은 런타임에만 필요하지만, 설정되어 있어야 합니다:

```bash
# Clerk (런타임)
CLERK_SECRET_KEY=sk_test_... 또는 sk_live_...

# Supabase (런타임)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Job
CRON_SECRET=your_random_secret_here
```

### 3. 환경 변수 설정 확인 사항

1. **모든 환경에 적용**: Production, Preview, Development 모두에 설정되어 있는지 확인
2. **변수명 오타 확인**: 대소문자, 언더스코어 정확히 입력되었는지 확인
3. **값이 비어있지 않은지 확인**: 모든 변수에 실제 값이 입력되어 있는지 확인

### 4. 일반적인 빌드 오류 원인

#### 원인 1: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 누락

`app/layout.tsx`에서 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 없으면 에러 페이지를 렌더링합니다. 빌드 타임에 이 변수가 필요합니다.

**해결**: Vercel Dashboard에서 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정 확인

#### 원인 2: NEXT_PUBLIC_SUPABASE_URL 누락

`next.config.ts`에서 `NEXT_PUBLIC_SUPABASE_URL`을 사용하여 이미지 호스트를 설정합니다.

**해결**: Vercel Dashboard에서 `NEXT_PUBLIC_SUPABASE_URL` 설정 확인

#### 원인 3: TypeScript 타입 오류

로컬과 Vercel의 TypeScript 버전이나 설정이 다를 수 있습니다.

**해결**: 
- 로컬에서 `pnpm build` 재실행하여 오류 확인
- `tsconfig.json` 설정 확인

### 5. 빌드 로그에서 확인할 오류 패턴

#### 패턴 1: "Environment variable not found"
```
Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined
```
→ 해당 환경 변수를 Vercel Dashboard에 추가

#### 패턴 2: "Type error"
```
Type error: ...
```
→ TypeScript 타입 오류, 로컬에서도 재현 가능한지 확인

#### 패턴 3: "Module not found"
```
Error: Cannot find module '...'
```
→ 의존성 설치 문제, `package.json` 확인

### 6. 즉시 시도할 수 있는 해결 방법

#### 방법 1: 환경 변수 재설정

1. Vercel Dashboard → Settings → Environment Variables
2. 모든 필수 환경 변수 삭제 후 다시 추가
3. Production, Preview, Development 모두에 설정

#### 방법 2: 빌드 캐시 클리어

1. Vercel Dashboard → Settings → General
2. "Clear Build Cache" 클릭
3. 재배포

#### 방법 3: 로컬 빌드 재확인

```powershell
# 의존성 재설치
pnpm install

# 빌드 테스트
pnpm build

# 오류가 있다면 수정 후 재배포
```

### 7. Vercel 설정 확인

Vercel Dashboard → Settings → General에서:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (또는 비워두면 자동 감지)
- **Output Directory**: `.next` (또는 비워두면 자동 감지)
- **Install Command**: `pnpm install` (또는 비워두면 자동 감지)
- **Node.js Version**: 20.x (`.nvmrc` 파일로 자동 설정됨)

### 8. 다음 단계

1. **Vercel 대시보드의 빌드 로그 확인** (가장 중요!)
2. 빌드 로그의 오류 메시지를 복사
3. 오류 메시지를 기반으로 위의 해결 방법 적용

## 참고

- `vercel.json`은 최소한으로 유지하는 것이 좋습니다 (Vercel이 자동으로 감지)
- 환경 변수는 빌드 타임과 런타임을 구분하여 설정
- `NEXT_PUBLIC_*` 변수는 빌드 타임에 번들에 포함되므로 반드시 필요

