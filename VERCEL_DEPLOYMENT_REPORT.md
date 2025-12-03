# 🚀 Vercel 배포 검증 보고서

**검증 일시**: 2025-01-26  
**검증 결과**: ✅ **배포 준비 완료**

---

## ✅ 빌드 검증

### 빌드 상태
- ✅ **빌드 성공**: `pnpm build` 통과
- ✅ **TypeScript 타입 검사**: 통과
- ⚠️ **ESLint 경고**: 있으나 빌드 차단 없음 (사용하지 않는 변수 등)

### 수정된 타입 오류
1. `lib/royal-recipes/queries.ts`
   - 문제: `RecipeEra` 타입이 export되지 않음
   - 수정: `export type { RecipeEra, RoyalRecipe }` 추가

2. `lib/diet/weekly-diet-generator.ts`
   - 문제: `DietPlan.recipe_title` 속성 존재하지 않음
   - 수정: `meal?.recipe_title` → `meal?.recipe?.title` 변경
   - 문제: `DailyDietPlan` 타입을 찾을 수 없음
   - 수정: `StoredDailyDietPlan` 타입 사용

---

## 📋 프로젝트 설정 확인

### 1. Next.js 설정 (`next.config.ts`)
✅ **정상**
- 이미지 최적화 설정 완료
- Supabase Storage 호스트 자동 허용
- 외부 이미지 서비스 호스트 허용 (Unsplash, Pixabay, YouTube 등)
- 프로덕션에서 console.log 자동 제거 (error, warn 제외)

### 2. Vercel 설정 (`vercel.json`)
✅ **정상**
- Cron Job 설정 완료
  - 경로: `/api/cron/generate-daily-diets`
  - 스케줄: `0 18 * * *` (매일 오후 6시)

### 3. Middleware (`middleware.ts`)
✅ **정상**
- Clerk 인증 미들웨어 설정 완료
- 정적 파일 및 Next.js 내부 경로 제외 처리

### 4. Package.json
✅ **정상**
- 빌드 스크립트: `next build`
- 시작 스크립트: `next start`
- Node.js 버전: 20.x 이상 권장

---

## 🔐 필수 환경 변수

Vercel 대시보드에서 다음 환경 변수를 **반드시** 설정해야 합니다:

### Clerk 인증 (필수)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... 또는 pk_live_...
CLERK_SECRET_KEY=sk_test_... 또는 sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Supabase (필수)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### Cron Job (필수)
```
CRON_SECRET=your_random_secret_string_here
```
⚠️ **중요**: 
- 랜덤 문자열로 생성 (예: `openssl rand -hex 32`)
- Vercel Cron Job이 `Authorization: Bearer {CRON_SECRET}` 헤더로 요청 전송
- 이 값이 없으면 Cron Job이 실패합니다

### 선택적 환경 변수
```
GEMINI_API_KEY=AIzaSyD... (이미지 생성 기능 사용 시)
NOTION_API_KEY=secret_... (Notion 연동 시)
NOTION_DATABASE_ID=... (Notion 연동 시)
```

---

## 📋 배포 전 체크리스트

### 1. 데이터베이스 준비
- [ ] Supabase에서 모든 마이그레이션 적용 확인
- [ ] `uploads` Storage 버킷 생성 확인
- [ ] `food-images` Storage 버킷 생성 확인 (이미지 생성 기능 사용 시)
- [ ] RLS 정책 설정 확인 (개발 중에는 비활성화 가능)

### 2. Clerk 설정
- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
  - 예: `https://your-project.vercel.app`
  - 예: `https://your-custom-domain.com`
- [ ] Redirect URLs 설정 확인
  - Sign-in: `https://your-domain.com/sign-in`
  - Sign-up: `https://your-domain.com/sign-up`

### 3. Vercel 프로젝트 설정
- [ ] Build Command: `pnpm build` (기본값)
- [ ] Output Directory: `.next` (기본값)
- [ ] Install Command: `pnpm install` (기본값)
- [ ] Node.js Version: 20.x 이상
- [ ] Framework Preset: Next.js (자동 감지)

### 4. 환경 변수 설정
- [ ] 모든 필수 환경 변수 입력
- [ ] 프로덕션/프리뷰 환경별로 분리 설정 (필요 시)
- [ ] `CRON_SECRET` 생성 및 설정

---

## 🚀 배포 후 확인 사항

### 1. 기본 기능 확인
- [ ] 홈페이지 접속 확인
- [ ] Clerk 로그인/회원가입 동작 확인
- [ ] 사용자 동기화 확인 (`/api/sync-user`)

### 2. API 엔드포인트 확인
- [ ] `/api/health/check` 동작 확인
- [ ] `/api/sync-user` 동작 확인
- [ ] `/api/cron/generate-daily-diets` 수동 테스트
  ```bash
  curl -X GET https://your-domain.com/api/cron/generate-daily-diets \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

### 3. 데이터베이스 연결 확인
- [ ] Supabase 연결 확인
- [ ] 사용자 동기화 확인
- [ ] Storage 업로드/다운로드 확인

### 4. 이미지 최적화 확인
- [ ] Next.js Image 컴포넌트 동작 확인
- [ ] Supabase Storage 이미지 로드 확인
- [ ] 외부 이미지 서비스 로드 확인

### 5. Cron Job 확인
- [ ] Vercel 대시보드에서 Cron Job 실행 로그 확인
- [ ] 다음 날 식단이 자동 생성되는지 확인
- [ ] 일요일 오후 6시에 주간 식단이 생성되는지 확인

---

## ⚠️ 알려진 경고 (빌드 차단 없음)

다음 경고들은 빌드를 차단하지 않지만, 필요시 수정 가능:

1. **ESLint 경고**
   - 사용하지 않는 변수들
   - React Hook 의존성 배열 경고
   - `<img>` 태그 사용 경고 (Next.js Image 권장)

2. **동적 렌더링 경고**
   - 일부 페이지가 동적 렌더링으로 표시됨 (정상)

---

## 🔗 유용한 링크

- [Vercel 환경 변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)

---

## 📝 배포 단계별 가이드

### 1단계: Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정 확인

### 2단계: 환경 변수 설정
1. 프로젝트 설정 > Environment Variables
2. 위의 "필수 환경 변수" 목록에 따라 입력
3. `CRON_SECRET` 생성:
   ```bash
   # 터미널에서 실행
   openssl rand -hex 32
   ```
4. 생성된 값을 `CRON_SECRET`에 입력

### 3단계: 배포 실행
1. "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 대기

### 4단계: 배포 후 확인
1. 위의 "배포 후 확인 사항" 체크리스트 실행
2. 문제 발생 시 Vercel 로그 확인
3. 필요시 롤백

---

## 🆘 문제 해결

### 빌드 실패
- Vercel 로그에서 오류 확인
- 로컬에서 `pnpm build` 실행하여 재현
- 환경 변수 누락 확인

### Cron Job 실패
- `CRON_SECRET` 환경 변수 확인
- Vercel Cron Job 로그 확인
- API 엔드포인트 수동 테스트

### 인증 오류
- Clerk 키 확인
- Allowed Origins 설정 확인
- Redirect URLs 확인

---

**검증 완료**: 프로젝트는 Vercel 배포 준비가 완료되었습니다! 🎉












