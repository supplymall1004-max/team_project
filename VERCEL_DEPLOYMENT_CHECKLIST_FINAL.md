# 🚀 Vercel 배포 최종 체크리스트

**검사 일시**: 2025-01-XX  
**빌드 상태**: ✅ 성공  
**TypeScript 오류**: ✅ 수정 완료

---

## ✅ 1. 빌드 검증

- [x] **로컬 빌드 성공**: `pnpm build` 완료
- [x] **TypeScript 오류 수정**: `components/games/fridge-defense.tsx` 타입 오류 해결
- [x] **정적 페이지 생성**: 210개 페이지 생성 완료
- [x] **빌드 시간**: 약 73초 (정상 범위)

### 빌드 경고 (치명적이지 않음)

- ⚠️ **Clerk 키 경고**: 프로덕션 환경에서 개발 키(`pk_test_`) 사용 중
  - **조치 필요**: Vercel Dashboard에서 프로덕션 키(`pk_live_`)로 변경
- ⚠️ **YouTube API 403 오류**: 빌드 중 정적 페이지 생성 시 발생
  - **영향**: 런타임에는 문제 없음 (빌드 시에만 발생)
  - **조치**: 선택사항 (YouTube API 키 설정 또는 에러 처리 개선)

---

## 📋 2. 환경 변수 설정 (Vercel Dashboard)

### 필수 클라이언트 사이드 환경 변수 (`NEXT_PUBLIC_*`)

다음 변수들을 **Production, Preview, Development 모두**에 설정하세요:

```bash
# Clerk 인증 (⚠️ 프로덕션에서는 pk_live_ 키 사용 필수!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # 또는 pk_test_... (개발)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xlbhrgvnfioxtvocwban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### 필수 서버 사이드 환경 변수

```bash
# Clerk (서버)
CLERK_SECRET_KEY=sk_live_...  # ⚠️ 프로덕션에서는 sk_live_ 키 사용 필수!

# Supabase (서버)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron Job (선택 - 자동 식단 생성 기능 사용 시)
CRON_SECRET=your_random_secret_here
```

### 선택적 환경 변수

```bash
# Naver APIs (의료시설 검색 기능 사용 시)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
NAVER_SEARCH_CLIENT_ID=...
NAVER_SEARCH_CLIENT_SECRET=...

# Gemini AI (이미지 생성 기능 사용 시)
GEMINI_API_KEY=AIzaSyD...

# Notion (선택)
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
```

### ⚠️ 중요 확인 사항

- [ ] 모든 환경 변수가 **Production, Preview, Development** 모두에 설정되어 있는지 확인
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 프로덕션 키(`pk_live_...`)인지 확인
- [ ] `CLERK_SECRET_KEY`가 프로덕션 키(`sk_live_...`)인지 확인
- [ ] 모든 변수명이 정확히 입력되었는지 확인 (대소문자, 언더스코어)
- [ ] 값에 앞뒤 공백이 없는지 확인

---

## 🔧 3. Vercel 프로젝트 설정

### 빌드 설정 확인

- [x] **Build Command**: `pnpm build` (기본값)
- [x] **Output Directory**: `.next` (기본값)
- [x] **Install Command**: `pnpm install` (기본값)
- [x] **Node.js Version**: 20.x 이상 (`package.json`의 `engines.node` 확인)

### 프레임워크 설정

- [x] **Framework Preset**: Next.js
- [x] **Root Directory**: `.` (프로젝트 루트)

---

## 📅 4. Cron Jobs 설정

`vercel.json`에 정의된 Cron Job:

- ✅ `/api/cron/generate-daily-diets` - 매일 오후 6시(18:00) 실행
  - ⚠️ **필수**: `CRON_SECRET` 환경 변수 설정 필요
- ✅ `/api/cron/daily-notifications` - 매일 오전 9시(09:00) 실행

### Cron Job 설정 확인

1. Vercel Dashboard → 프로젝트 → Settings → Cron Jobs
2. `vercel.json`의 Cron Job이 자동으로 인식되는지 확인
3. 각 Cron Job에 필요한 환경 변수 설정 확인

---

## 🔍 5. 코드 품질 검사

### TypeScript

- [x] **타입 오류**: 없음 (수정 완료)
- [x] **타입 안정성**: `strict: false` (프로젝트 설정에 따라)

### ESLint

- [x] **빌드 시 ESLint**: `ignoreDuringBuilds: true` (경고 무시)
- [ ] **로컬 ESLint 실행**: `pnpm lint` 실행 권장

### 의존성

- [x] **package.json**: 모든 의존성 정상
- [x] **Node.js 버전**: 20.x 이상 요구
- [x] **pnpm 버전**: 8.0.0 이상 요구

---

## 🗂️ 6. 파일 구조 확인

### 필수 파일

- [x] `next.config.ts`: 설정 완료
- [x] `vercel.json`: Cron Job 설정 완료
- [x] `middleware.ts`: Clerk 인증 미들웨어 설정 완료
- [x] `package.json`: 스크립트 및 의존성 정상
- [x] `tsconfig.json`: TypeScript 설정 완료

### 디렉토리 구조

- [x] `app/`: Next.js App Router 구조 정상
- [x] `components/`: 컴포넌트 구조 정상
- [x] `lib/`: 유틸리티 및 클라이언트 설정 정상
- [x] `supabase/migrations/`: 마이그레이션 파일 존재

---

## 🚨 7. 배포 전 최종 확인

### 보안

- [ ] `.env.local` 파일이 Git에 커밋되지 않았는지 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 공개되지 않았는지 확인
- [ ] 모든 API 키가 Vercel Dashboard에만 설정되어 있는지 확인

### 기능 테스트

- [ ] 로컬에서 `pnpm dev` 실행하여 기본 기능 동작 확인
- [ ] 인증 플로우 테스트 (로그인/로그아웃)
- [ ] 주요 페이지 접근 가능 여부 확인

### 성능

- [x] 빌드 시간: 73초 (정상 범위)
- [x] 번들 크기: First Load JS 102 kB (최적화됨)
- [x] 정적 페이지: 210개 생성 완료

---

## 📝 8. 배포 후 확인 사항

### 즉시 확인

1. **배포 URL 접속**: Vercel에서 제공하는 배포 URL 확인
2. **홈페이지 로드**: 메인 페이지가 정상적으로 로드되는지 확인
3. **인증 테스트**: 로그인/로그아웃 기능 테스트
4. **에러 로그 확인**: Vercel Dashboard → Functions → Logs에서 에러 확인

### 기능별 테스트

- [ ] 사용자 인증 (Clerk)
- [ ] 데이터베이스 연결 (Supabase)
- [ ] 파일 업로드 (Supabase Storage)
- [ ] API 라우트 동작 확인
- [ ] Cron Job 실행 확인 (배포 후 24시간 내)

### 모니터링

- [ ] Vercel Analytics 설정 (선택)
- [ ] 에러 추적 설정 (선택)
- [ ] 성능 모니터링 설정 (선택)

---

## 🔗 9. 유용한 링크

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Next.js 문서](https://nextjs.org/docs)

---

## 📌 10. 문제 해결 가이드

### 빌드 실패 시

1. Vercel Dashboard → Deployments → 실패한 배포 클릭
2. Build Logs 확인
3. 환경 변수 설정 확인
4. 로컬에서 `pnpm build` 재실행하여 오류 재현

### 환경 변수 오류 시

1. Vercel Dashboard → Settings → Environment Variables
2. 모든 환경 변수가 Production, Preview, Development에 설정되어 있는지 확인
3. 변수명 오타 확인 (대소문자, 언더스코어)
4. 값에 공백이 없는지 확인

### 인증 오류 시

1. Clerk Dashboard에서 프로덕션 키 확인
2. Vercel Dashboard에서 환경 변수 확인
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`와 `CLERK_SECRET_KEY` 매칭 확인

---

## ✅ 배포 준비 완료 체크리스트

- [x] 로컬 빌드 성공
- [x] TypeScript 오류 수정
- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] Clerk 프로덕션 키 설정
- [ ] Cron Job 환경 변수 설정
- [ ] 배포 실행
- [ ] 배포 후 기능 테스트

---

**마지막 업데이트**: 2025-01-XX  
**다음 단계**: Vercel Dashboard에서 환경 변수 설정 후 배포 진행

