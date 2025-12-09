# 🚀 Vercel 배포 검사 보고서

**검사 일시**: 2025-01-27  
**빌드 상태**: ✅ 성공  
**배포 준비 상태**: ⚠️ 환경 변수 설정 필요

---

## ✅ 빌드 검증 완료

### 빌드 결과
- **상태**: ✅ 성공 (39초 소요)
- **TypeScript 타입 검사**: ✅ 통과
- **ESLint 경고**: ⚠️ 있음 (빌드 차단 없음)
- **Next.js 버전**: 15.5.7
- **React 버전**: 19.0.0

### 빌드 경고 (빌드 차단 없음)
- 사용하지 않는 변수/import 경고 (기능에 영향 없음)
- `<img>` 태그 사용 경고 (Next.js Image 컴포넌트 권장)
- React Hook 의존성 배열 경고

**참고**: 이 경고들은 기능에 영향을 주지 않으며, 필요시 점진적으로 수정 가능합니다.

---

## 📋 필수 환경 변수 설정

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

**⚠️ 중요**: 
- 프로덕션 환경에서는 `pk_live_` 및 `sk_live_` 키를 사용하세요.
- Clerk Dashboard에서 Allowed Origins에 Vercel 도메인을 추가해야 합니다.

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
- 이 값이 없으면 Cron Job이 실패합니다.

**생성 방법**:
```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

또는 PowerShell에서:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. 선택적 환경 변수

```bash
GEMINI_API_KEY=AIzaSyD... (이미지 생성 기능 사용 시)
NOTION_API_KEY=secret_... (Notion 연동 시)
NOTION_DATABASE_ID=... (Notion 연동 시)
```

---

## ⚠️ 배포 전 확인 사항

### 1. Next.js Metadata 설정

빌드 시 다음 경고가 발생했습니다:
```
metadataBase property in metadata export is not set for resolving social open graph or twitter images
```

**해결 방법**: `app/layout.tsx`에 `metadataBase` 추가 필요

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'),
  // ... 기존 메타데이터
};
```

**임시 해결**: 프로덕션 도메인을 확인한 후 설정하거나, 배포 후 수정 가능합니다.

### 2. 데이터베이스 마이그레이션

- [ ] Supabase에서 모든 마이그레이션 적용 확인
- [ ] `uploads` Storage 버킷 생성 확인
- [ ] `food-images` Storage 버킷 생성 확인 (이미지 생성 기능 사용 시)
- [ ] RLS 정책 설정 확인 (개발 중에는 비활성화 가능)

### 3. Clerk 설정

- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
  - 예: `https://your-project.vercel.app`
  - 예: `https://your-custom-domain.com`
- [ ] Redirect URLs 설정 확인
  - Sign-in: `https://your-domain.com/sign-in`
  - Sign-up: `https://your-domain.com/sign-up`

### 4. Vercel 프로젝트 설정

- [x] Build Command: `pnpm build` (기본값)
- [x] Output Directory: `.next` (기본값)
- [x] Install Command: `pnpm install` (기본값)
- [ ] Node.js Version: 20.x 이상 확인
- [x] Framework Preset: Next.js (자동 감지)

### 5. Cron Job 설정 확인

`vercel.json`에 Cron Job이 설정되어 있습니다:

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

**확인 사항**:
- [ ] `CRON_SECRET` 환경 변수 설정 완료
- [ ] `/api/cron/generate-daily-diets` 엔드포인트가 정상 작동하는지 확인

---

## 🔍 코드 품질 검사

### TypeScript 설정
- ✅ 타입 검사 통과
- ⚠️ `noImplicitAny: false` (개발 편의성, 프로덕션에서는 엄격 모드 권장)
- ⚠️ `strict: false` (개발 편의성, 프로덕션에서는 엄격 모드 권장)

### ESLint 설정
- ✅ ESLint 설정 정상
- ⚠️ 경고 다수 (빌드 차단 없음)

### Next.js 설정
- ✅ 이미지 최적화 설정 완료
- ✅ Supabase 이미지 호스트 자동 허용
- ✅ 컴파일러 최적화 설정 완료
- ✅ 패키지 임포트 최적화 설정 완료

---

## 📊 빌드 통계

### 주요 라우트 크기
- 홈페이지 (`/`): 14.8 kB (First Load JS: 190 kB)
- 관리자 페이지 (`/admin`): 8.07 kB (First Load JS: 169 kB)
- 식단 페이지 (`/diet`): 8.01 kB (First Load JS: 196 kB)
- 레시피 상세 (`/recipes/[slug]`): 8.6 kB (First Load JS: 153 kB)

### 공유 청크
- First Load JS shared by all: 102 kB
- Middleware: 81.9 kB

---

## 🚀 배포 단계별 가이드

### 1단계: Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. **"Add New..."** → **"Project"** 클릭
3. GitHub/GitLab/Bitbucket 저장소 연결
4. 프로젝트 선택 후 **"Import"** 클릭

### 2단계: 환경 변수 설정

1. 프로젝트 설정 페이지로 이동
2. **Settings** → **Environment Variables** 메뉴 선택
3. 위의 "필수 환경 변수" 목록을 모두 추가
4. 각 환경 변수에 대해 **Environment** 선택:
   - Production: 프로덕션 환경
   - Preview: Pull Request 미리보기
   - Development: 개발 환경

### 3단계: 빌드 설정 확인

- **Framework Preset**: Next.js (자동 감지)
- **Build Command**: `pnpm build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `pnpm install` (기본값)
- **Node.js Version**: 20.x 이상

### 4단계: 배포 실행

1. **"Deploy"** 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 도메인 확인

### 5단계: 배포 후 확인

1. **홈페이지 접속**: `https://your-project.vercel.app`
2. **인증 테스트**: 로그인/회원가입 기능 확인
3. **데이터베이스 연결**: Supabase 연결 확인
4. **Cron Job 테스트**: 수동으로 `/api/cron/generate-daily-diets` 호출 테스트

---

## 🔗 유용한 링크

- [Vercel 환경 변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/hosting/overview)

---

## ✅ 최종 확인 체크리스트

배포 전 다음을 확인하세요:

- [ ] 모든 필수 환경 변수 설정 완료
- [ ] 로컬 빌드 성공 확인 ✅
- [ ] Clerk 프로덕션 키 설정 완료
- [ ] Supabase 마이그레이션 적용 완료
- [ ] `CRON_SECRET` 생성 및 설정 완료
- [ ] Vercel 프로젝트 설정 확인 완료
- [ ] Clerk Allowed Origins 설정 완료
- [ ] (선택) `metadataBase` 설정 완료

**모든 항목이 확인되면 배포를 진행하세요!** 🚀

---

## 📝 추가 권장 사항

### 1. 프로덕션 최적화

- `tsconfig.json`에서 `strict: true` 활성화 고려
- 사용하지 않는 import 정리
- `<img>` 태그를 Next.js `Image` 컴포넌트로 교체 고려

### 2. 모니터링 설정

- Vercel Analytics 활성화
- Error Tracking 설정 (Sentry 등)
- Cron Job 실행 로그 모니터링

### 3. 보안 강화

- 환경 변수 보안 확인
- RLS 정책 활성화 (프로덕션)
- API Rate Limiting 설정 고려

---

**검사 완료일**: 2025-01-27  
**다음 검사 권장일**: 배포 후 1주일 이내

