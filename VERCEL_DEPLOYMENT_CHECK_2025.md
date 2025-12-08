# 🚀 Vercel 배포 검사 결과

**검사 일시**: 2025-01-26  
**빌드 상태**: ✅ 성공  
**배포 준비 상태**: ✅ 준비 완료

---

## ✅ 빌드 검증

### 빌드 결과
- **상태**: 성공 ✅
- **TypeScript 타입 검사**: 통과
- **ESLint 경고**: 있음 (빌드 차단 없음)
- **Next.js 버전**: 15.5.6

### 수정된 문제들

1. **`/diet/favorites` 페이지 정적 렌더링 오류**
   - 문제: `getCurrentSubscription()` 함수가 `auth()`를 사용하여 정적 렌더링 불가
   - 해결: `export const dynamic = 'force-dynamic'` 추가

2. **홈페이지(`/`) 정적 렌더링 오류**
   - 문제: MFDS API를 `cache: "no-store"`로 fetch하여 정적 렌더링 불가
   - 해결: 
     - 홈페이지에 `export const dynamic = 'force-dynamic'` 추가
     - MFDS API fetch에 `next: { revalidate: 3600 }` 추가 (1시간 캐시)

3. **`/_not-found` 페이지 이벤트 핸들러 오류**
   - 문제: `ErrorBoundary` fallback에서 서버 컴포넌트에 `onClick` 핸들러 전달
   - 해결: `ErrorFallback` 클라이언트 컴포넌트로 분리

### 경고 사항 (빌드 차단 없음)
- React Hook 의존성 배열 경고
- 사용하지 않는 변수 경고
- 이 경고들은 기능에 영향을 주지 않으며, 필요시 수정 가능

---

## 🔐 필수 환경 변수 목록

Vercel 대시보드에서 다음 환경 변수를 **반드시** 설정해야 합니다:

### 1. Clerk 인증 (필수)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... 또는 pk_live_...
CLERK_SECRET_KEY=sk_test_... 또는 sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

**설정 위치**: Vercel Dashboard → Project Settings → Environment Variables

### 2. Supabase (필수)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xlbhrgvnfioxtvocwban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**⚠️ 중요**: 
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용되며, 클라이언트에 노출되면 안 됩니다.
- Vercel에서는 자동으로 서버 사이드 환경 변수로 처리됩니다.

### 3. Cron Job (필수)
```bash
CRON_SECRET=your_random_secret_here
```

**⚠️ 중요**: 
- `CRON_SECRET`은 랜덤 문자열로 생성하세요.
- Vercel Cron Job이 `Authorization: Bearer {CRON_SECRET}` 헤더로 요청을 전송합니다.
- 이 값은 보안상 중요하므로 강력한 랜덤 문자열을 사용하세요.

**생성 방법**:
```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 선택적 환경 변수

다음 환경 변수들은 해당 기능을 사용할 때만 필요합니다:

#### 이미지 생성 기능 (Gemini AI)
```bash
GEMINI_API_KEY=AIzaSyD...
```
- **사용 위치**: `/app/api/image-generation`, `/lib/gemini/`
- **기능**: AI 기반 음식 이미지 생성

#### Notion 연동
```bash
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
```
- **사용 위치**: Supabase Edge Functions (`supabase/functions/sync-notion-images/`)
- **기능**: Notion 데이터베이스 연동

#### 결제 기능 (Stripe)
```bash
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```
- **사용 위치**: `/actions/payments/create-checkout.ts`
- **기능**: 결제 성공/실패 리다이렉트 URL 생성
- **기본값**: `http://localhost:3000` (개발 환경)

#### 개발/테스트용
```bash
NEXT_PUBLIC_DISABLE_PLAN_LIMIT=true
```
- **사용 위치**: `/app/api/family/members/route.ts`, `/components/family/family-member-list.tsx`
- **기능**: 플랜 제한 비활성화 (개발/테스트용)
- **주의**: 프로덕션에서는 설정하지 않거나 `false`로 설정

---

## 📋 Vercel 프로젝트 설정

### Build Settings
- **Build Command**: `pnpm build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `pnpm install` (기본값)
- **Node.js Version**: 20.x 이상 권장

### Framework Preset
- **Framework**: Next.js
- **Root Directory**: `.` (프로젝트 루트)

---

## ⏰ Cron Jobs 설정

`vercel.json`에 정의된 Cron Job:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily-diets",
      "schedule": "0 18 * * *"
    }
  ]
}
```

### Cron Job 상세 정보
- **경로**: `/api/cron/generate-daily-diets`
- **스케줄**: 매일 오후 6시(18:00) KST
- **기능**: 다음 날 일일 식단 및 다음 주 주간 식단 자동 생성
- **인증**: `CRON_SECRET` 환경 변수 필요

### Cron Job 동작 확인
1. Vercel Dashboard → Cron Jobs 탭에서 실행 내역 확인
2. `/api/cron/generate-daily-diets` 엔드포인트가 정상 응답하는지 확인
3. 로그에서 "✅ 자동 식단 생성 완료" 메시지 확인

---

## 🔍 배포 전 체크리스트

### 1. 환경 변수 설정
- [ ] Clerk 인증 키 설정 (프로덕션 키 사용)
- [ ] Supabase 환경 변수 설정
- [ ] `CRON_SECRET` 생성 및 설정
- [ ] 선택적 환경 변수 설정 (필요시)

### 2. Clerk 설정
- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
  - 예: `https://your-project.vercel.app`
- [ ] Redirect URLs 설정 확인
  - Sign In: `https://your-project.vercel.app/sign-in`
  - Sign Up: `https://your-project.vercel.app/sign-up`

### 3. Supabase 설정
- [ ] 모든 마이그레이션 적용 확인
- [ ] Storage 버킷 생성 확인 (`uploads` 버킷)
- [ ] RLS 정책 설정 확인 (프로덕션에서는 활성화 권장)

### 4. Vercel 설정
- [ ] Git 저장소 연결 확인
- [ ] 빌드 명령어 확인 (`pnpm build`)
- [ ] Node.js 버전 확인 (20.x 이상)
- [ ] 환경 변수 모두 설정 확인

### 5. 코드 검증
- [x] 로컬 빌드 성공 확인 (`pnpm build`) ✅
- [x] TypeScript 타입 에러 없음 확인 ✅
- [ ] 주요 기능 동작 확인

---

## 🚀 배포 후 확인 사항

### 1. 기본 동작 확인
- [ ] 홈페이지 접속 확인
- [ ] Clerk 로그인/회원가입 동작 확인
- [ ] 사용자 동기화 확인 (`/api/users/ensure`)

### 2. API 엔드포인트 확인
- [ ] `/api/users/ensure` - 사용자 확인/생성
- [ ] `/api/health/profile` - 건강 정보 저장
- [ ] `/api/diet/weekly/generate` - 주간 식단 생성
- [ ] `/api/cron/generate-daily-diets` - Cron Job (인증 필요)

### 3. 데이터베이스 연결 확인
- [ ] Supabase 연결 확인
- [ ] 사용자 데이터 저장 확인
- [ ] Storage 파일 업로드 확인

### 4. 이미지 최적화 확인
- [ ] Next.js Image 컴포넌트 동작 확인
- [ ] Supabase Storage 이미지 로드 확인
- [ ] 외부 이미지 서비스 로드 확인

### 5. Cron Job 확인
- [ ] Vercel Dashboard에서 Cron Job 실행 내역 확인
- [ ] 로그에서 정상 실행 확인
- [ ] 자동 생성된 식단 데이터 확인

---

## 🐛 문제 해결

### 빌드 실패 시
1. **환경 변수 확인**: 모든 필수 환경 변수가 설정되었는지 확인
2. **로컬 빌드 테스트**: `pnpm build` 실행하여 로컬에서 에러 확인
3. **로그 확인**: Vercel Dashboard → Deployments → 해당 배포의 로그 확인

### Cron Job이 실행되지 않을 때
1. **CRON_SECRET 확인**: 환경 변수가 올바르게 설정되었는지 확인
2. **인증 확인**: `/api/cron/generate-daily-diets` 엔드포인트가 `Authorization` 헤더를 올바르게 검증하는지 확인
3. **스케줄 확인**: `vercel.json`의 스케줄이 올바른지 확인

### 환경 변수 관련 에러
1. **NEXT_PUBLIC_ 접두사**: 클라이언트에서 사용하는 변수는 `NEXT_PUBLIC_` 접두사 필요
2. **서버 사이드 변수**: `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY` 등은 서버 사이드에서만 사용
3. **재배포 필요**: 환경 변수 변경 후 재배포 필요

---

## 📝 환경 변수 설정 가이드

### Vercel Dashboard에서 설정하는 방법

1. **프로젝트 선택**: Vercel Dashboard에서 프로젝트 선택
2. **Settings 이동**: Settings → Environment Variables
3. **환경 변수 추가**: 
   - Key: 환경 변수 이름 (예: `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: 환경 변수 값
   - Environment: Production, Preview, Development 중 선택
4. **저장**: Save 버튼 클릭
5. **재배포**: 환경 변수 변경 후 자동 재배포 또는 수동 재배포

### 환경별 설정

- **Production**: 프로덕션 환경용
- **Preview**: Pull Request 미리보기용
- **Development**: 개발 환경용

**권장**: 모든 환경에 동일한 환경 변수를 설정하되, Production에는 프로덕션 키를 사용

---

## 🔗 유용한 링크

- [Vercel 환경 변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)

---

## ✅ 최종 확인

배포 전 다음을 확인하세요:

1. ✅ 모든 필수 환경 변수 설정 완료
2. ✅ 로컬 빌드 성공 확인 ✅
3. ✅ Clerk 프로덕션 키 설정 완료
4. ✅ Supabase 마이그레이션 적용 완료
5. ✅ `CRON_SECRET` 생성 및 설정 완료
6. ✅ Vercel 프로젝트 설정 확인 완료

**모든 항목이 확인되면 배포를 진행하세요!** 🚀

---

## 📊 변경 사항 요약

### 수정된 파일들

1. **`app/(dashboard)/diet/favorites/page.tsx`**
   - `export const dynamic = 'force-dynamic'` 추가

2. **`app/page.tsx`**
   - `export const dynamic = 'force-dynamic'` 추가

3. **`lib/services/mfds-recipe-api.ts`**
   - `cache: "no-store"` → `next: { revalidate: 3600 }` 변경

4. **`app/layout.tsx`**
   - `ErrorFallback` 컴포넌트 사용으로 변경

5. **`components/error-fallback.tsx`** (신규)
   - 클라이언트 컴포넌트로 분리하여 이벤트 핸들러 문제 해결

---

**검사 완료일**: 2025-01-26  
**빌드 상태**: ✅ 성공  
**배포 준비**: ✅ 완료

