# 🚀 Vercel 배포 가이드

**최종 업데이트**: 2025-01-30  
**상태**: 배포 준비 완료

---

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [필수 환경 변수 설정](#필수-환경-변수-설정)
3. [배포 전 확인 사항](#배포-전-확인-사항)
4. [배포 단계](#배포-단계)
5. [문제 해결](#문제-해결)
6. [배포 후 확인 사항](#배포-후-확인-사항)

---

## 🚀 빠른 시작

### 배포 명령어

```bash
# 프로덕션 배포
pnpm run deploy
# 또는
vercel --prod

# 프리뷰 배포 (테스트용)
pnpm run deploy:preview
# 또는
vercel
```

### 배포 전 필수 확인

1. **로그인 확인**
   ```bash
   vercel whoami
   ```
   로그인되어 있지 않다면:
   ```bash
   vercel login
   ```

2. **프로젝트 연결 확인**
   ```bash
   vercel link
   ```

3. **로컬 빌드 테스트**
   ```bash
   pnpm build
   ```

---

## 🔐 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

### Clerk 인증
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (또는 pk_live_...)
CLERK_SECRET_KEY=sk_test_... (또는 sk_live_...)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

⚠️ **중요**: 프로덕션에서는 프로덕션 키(`pk_live_`, `sk_live_`)를 사용해야 합니다.

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### Cron Job (자동 식단 생성)
```
CRON_SECRET=your_random_secret_here
```

⚠️ **중요**: `CRON_SECRET`은 랜덤 문자열로 생성하세요. Vercel Cron Job이 이 값을 Authorization 헤더로 전송합니다.

### 선택적 환경 변수
```
GEMINI_API_KEY=AIzaSyD... (이미지 생성 기능 사용 시)
NOTION_API_KEY=secret_... (Notion 연동 시)
NOTION_DATABASE_ID=... (Notion 연동 시)

# Naver APIs
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
NAVER_SEARCH_CLIENT_ID=...
NAVER_SEARCH_CLIENT_SECRET=...
```

---

## 📋 배포 전 확인 사항

### 1. 데이터베이스 마이그레이션
- [ ] Supabase에서 모든 마이그레이션 적용 확인
- [ ] `food-images` Storage 버킷 생성 확인
- [ ] RLS 정책 설정 확인 (개발 중에는 비활성화 가능)

### 2. Clerk 설정
- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
- [ ] Redirect URLs 설정 확인

### 3. Vercel 설정
- [ ] Build Command: `pnpm build` (기본값)
- [ ] Output Directory: `.next` (기본값)
- [ ] Install Command: `pnpm install` (기본값)
- [ ] Node.js Version: 20.x 이상

### 4. Cron Jobs
`vercel.json`에 정의된 Cron Job이 정상 작동하는지 확인:
- `/api/cron/generate-daily-diets` - 매일 오후 6시(18:00) 실행
  - ⚠️ **필수**: `CRON_SECRET` 환경 변수 설정 필요
  - Vercel Cron Job은 `Authorization: Bearer {CRON_SECRET}` 헤더로 요청 전송
  - Cron Job이 실행되면 다음 날 일일 식단과 (일요일인 경우) 다음 주 주간 식단 자동 생성

### 5. 빌드 검증
- [x] TypeScript 타입 에러 수정 완료
- [x] 빌드 성공 확인 (`pnpm build` 통과)
- [x] 경고는 있으나 빌드 차단 없음 (ESLint 경고만 존재)

---

## 🚀 배포 단계

### 1단계: 빌드 테스트

```bash
pnpm build
```

빌드가 성공하는지 확인하세요.

### 2단계: 배포 실행

```bash
# 프로덕션 배포
pnpm run deploy

# 또는 직접 실행
vercel --prod
```

### 3단계: 배포 확인

배포가 완료되면 Vercel이 배포 URL을 제공합니다. 해당 URL로 접속하여 정상 작동하는지 확인하세요.

---

## 🐛 문제 해결

### 배포 실패 시

1. **빌드 로그 확인**:
   ```bash
   vercel logs [deployment-url]
   ```

2. **로컬 빌드 테스트**:
   ```bash
   pnpm build
   ```

3. **환경 변수 확인**:
   - Vercel 대시보드에서 모든 필수 환경 변수가 설정되어 있는지 확인
   - 프로덕션/프리뷰 환경 모두 설정되어 있는지 확인

### 자주 발생하는 오류

1. **"Build failed"**: 
   - 로컬에서 `pnpm build` 실행하여 오류 확인
   - 환경 변수 누락 확인

2. **"Environment variable not found"**:
   - Vercel 대시보드에서 환경 변수 설정 확인
   - 프로덕션/프리뷰 환경 모두 설정되어 있는지 확인

3. **"Project not found"**:
   - `vercel link` 실행하여 프로젝트 연결

4. **"Error: unknown or unexpected option: -r"**:
   - Vercel CLI에는 `-r` 옵션이 존재하지 않습니다
   - 올바른 명령어: `vercel --prod` 또는 `vercel`

### 알려진 경고 (빌드 차단 없음)

다음 경고들은 빌드를 차단하지 않지만, 필요시 수정 가능:
- 사용하지 않는 변수들 (ESLint 경고)
- React Hook 의존성 배열 경고
- `/health/family/notifications` 페이지 동적 렌더링 경고

---

## ✅ 배포 후 확인 사항

### 1. 홈페이지 접속 확인
- [ ] 메인 페이지 로드 확인
- [ ] Clerk 로그인/회원가입 동작 확인
- [ ] 사용자 세션 유지 확인
- [ ] 로그아웃 기능 확인

### 2. API 엔드포인트 확인
- [ ] `/api/sync-user` 동작 확인
- [ ] `/api/health/check` 동작 확인

### 3. 데이터베이스 연결 확인
- [ ] Supabase 연결 확인
- [ ] 사용자 동기화 확인

### 4. 기능 확인
- [ ] 식단 생성 기능 확인
  - 개인 식단 생성
  - 가족 식단 생성
  - 주간 식단 생성
  - 식단 저장 및 조회
- [ ] 레시피 기능 확인
  - 레시피 목록 조회
  - 레시피 상세 조회
  - 레시피 검색
  - 레시피 필터링

### 5. UI/UX 확인
- [ ] 반응형 디자인 확인 (모바일/태블릿/데스크톱)
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 네비게이션 동작 확인
- [ ] 폼 유효성 검사

### 6. 성능 확인
- [ ] 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] API 응답 시간

### 7. 이미지 최적화 확인
- [ ] Next.js Image 컴포넌트 동작 확인
- [ ] Supabase Storage 이미지 로드 확인

---

## 📝 최근 수정 내역

### 2025-01-30
- 타입 에러 수정 완료
- 빌드 성공 확인
- 배포 가이드 통합

### 2025-01-26
- `lib/royal-recipes/queries.ts` - `RecipeEra` 타입 re-export 추가
- `lib/diet/weekly-diet-generator.ts` - `DietPlan.recipe_title` → `DietPlan.recipe?.title` 수정
- `lib/diet/weekly-diet-generator.ts` - `DailyDietPlan` → `StoredDailyDietPlan` 타입 수정

### 이전 수정
- `components/health/diet-card.tsx` - 타입 에러 수정
- `lib/image-pipeline/database-operations.ts` - Supabase raw() 메서드 수정
- `lib/image-pipeline/response-parser.ts` - aspectRatio 계산 추가
- `lib/image-pipeline/storage-uploader.ts` - 중복 import 제거
- `lib/image-pipeline/prompt-builder.ts` - FoodRecord 타입 수정
- `tsconfig.json` - Supabase Edge Functions 제외

---

## 🔗 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Vercel 환경 변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 📞 지원

배포 중 문제가 발생하면:
1. 로컬 빌드 테스트 (`pnpm build`)
2. Vercel 대시보드에서 빌드 로그 확인
3. 환경 변수 설정 확인
4. 이 문서의 문제 해결 섹션 참고









