# 🚀 배포 전 검사 리포트

**생성 일시**: 2025-02-16  
**프로젝트**: team_project  
**검사 항목**: TypeScript, ESLint, 환경 변수, 데이터베이스, 보안 설정

---

## 📊 검사 결과 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript 타입 체크 | ⚠️ 경고 | 테스트 파일에서만 오류 발생 (애플리케이션 코드 정상) |
| ESLint 검사 | ⚠️ 경고 | 사용하지 않는 변수/import 경고 (빌드에는 영향 없음) |
| 프로덕션 빌드 | ⏳ 대기 | 빌드 테스트 필요 |
| 환경 변수 | ⚠️ 확인 필요 | Vercel 대시보드에서 설정 확인 필요 |
| 데이터베이스 마이그레이션 | ✅ 확인됨 | 85개 마이그레이션 파일 존재 |
| 보안 설정 | ✅ 확인됨 | 미들웨어 및 RLS 설정 확인 |

---

## 1. TypeScript 타입 체크

### 상태: ⚠️ 경고 (테스트 파일만)

**결과**:
- 애플리케이션 코드: 타입 오류 없음 ✅
- 테스트 파일: Vitest 타입 정의 누락으로 인한 오류 발생

**발견된 오류**:
- `__tests__/lib/health/diet-conflict-manager.test.ts`: Vitest 전역 타입 누락
- `lib/image-pipeline/__tests__/*.test.ts`: Vitest 전역 타입 누락

**권장사항**:
- 테스트 파일의 타입 오류는 빌드에 영향을 주지 않음 (tsconfig.json에서 제외 가능)
- 필요시 `vitest.config.ts`에서 `globals: true` 설정 확인 (이미 설정됨)

---

## 2. ESLint 검사

### 상태: ⚠️ 경고 (빌드에는 영향 없음)

**결과**:
- 총 경고 수: 약 500개 이상
- 대부분 사용하지 않는 변수/import 경고
- `next.config.ts`에서 `eslint.ignoreDuringBuilds: true` 설정으로 빌드에는 영향 없음

**주요 경고 유형**:
1. **사용하지 않는 변수** (`@typescript-eslint/no-unused-vars`)
   - API 라우트의 `request` 파라미터
   - 컴포넌트의 미사용 import
   - 함수 내부의 미사용 변수

2. **React Hooks 의존성** (`react-hooks/exhaustive-deps`)
   - useEffect, useMemo, useCallback의 의존성 배열 누락

3. **이미지 최적화** (`@next/next/no-img-element`)
   - `<img>` 태그 대신 Next.js `<Image>` 컴포넌트 사용 권장

**권장사항**:
- 빌드에는 문제 없으나, 코드 품질 향상을 위해 점진적으로 수정 권장
- 특히 React Hooks 의존성 경고는 버그로 이어질 수 있으므로 우선 수정 권장

---

## 3. 프로덕션 빌드 테스트

### 상태: ❌ 빌드 오류 발견

**빌드 결과**:
- ❌ 빌드 실패
- ⚠️ 발견된 오류:
  1. `Cannot find module for page: /diet/weekly`
  2. `Cannot find module for page: /health/emergency/medical-facilities/[category]`

**문제 분석**:
- 파일은 존재함: `app/(dashboard)/diet/weekly/page.tsx`
- 파일은 존재함: `app/(dashboard)/health/emergency/medical-facilities/[category]/page.tsx`
- 라우팅 그룹 `(dashboard)`는 URL 경로에 포함되지 않으므로 실제 경로는 `/diet/weekly`와 `/health/emergency/medical-facilities/[category]`가 맞음
- Next.js 빌드 시스템이 이 파일들을 찾지 못하는 것으로 보임

**가능한 원인**:
1. 동적 import 문제
2. 파일 경로 인식 문제
3. 라우팅 그룹과 관련된 Next.js 버그

**해결 방법**:
1. 파일이 실제로 존재하는지 확인
2. `export default`가 올바르게 되어 있는지 확인 (✅ 확인됨)
3. Next.js 캐시 삭제 후 재빌드:
   ```bash
   rm -rf .next
   pnpm build
   ```
4. 필요시 파일을 직접 경로로 이동 고려

**권장 조치**:
- [ ] `.next` 폴더 삭제 후 재빌드
- [ ] 빌드 로그 상세 확인
- [ ] 파일 경로 및 export 확인

---

## 4. 환경 변수 확인

### 상태: ⚠️ Vercel 대시보드에서 확인 필요

### 필수 클라이언트 사이드 환경 변수 (NEXT_PUBLIC_*)

Vercel Dashboard → Settings → Environment Variables에서 **Production, Preview, Development 모두**에 설정:

```bash
# Clerk 인증 (⚠️ 프로덕션에서는 pk_live_ 키 사용 필수!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # 또는 pk_test_... (개발)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### 필수 서버 사이드 환경 변수

```bash
# Clerk (서버)
CLERK_SECRET_KEY=sk_live_...  # ⚠️ 프로덕션에서는 sk_live_ 키 사용 필수!

# Supabase (서버)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron Job (자동 식단 생성 기능 사용 시)
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

## 5. 데이터베이스 마이그레이션

### 상태: ✅ 확인됨

**마이그레이션 파일**:
- 총 85개 마이그레이션 파일 존재
- 최신 마이그레이션: `20260216000000_extend_community_for_experts.sql`

**주요 마이그레이션 카테고리**:
1. 사용자 및 인증 관련
2. 건강 데이터 관리
3. 식단 관리
4. 게임 시스템
5. 커뮤니티 기능
6. 결제 시스템
7. 관리자 콘솔

**권장사항**:
- 프로덕션 배포 전 모든 마이그레이션이 적용되었는지 확인
- Supabase 대시보드에서 마이그레이션 상태 확인

---

## 6. 보안 설정 확인

### 상태: ✅ 확인됨

### 미들웨어 설정 (`middleware.ts`)

**공개 경로** (인증 불필요):
- `/`, `/sign-in`, `/sign-up`
- `/api/webhooks/*`
- `/api/debug/supabase/*`
- `/api/weather/*`
- `/api/health/medical-facilities/*`
- `/api/health/kcdc/alerts/*`
- `/health/emergency/*`

**보호된 경로**:
- 위 공개 경로 외 모든 경로는 Clerk 인증 필요

### Row Level Security (RLS)

**현재 상태**:
- 개발 환경: RLS 비활성화 (규칙에 따라)
- 프로덕션 환경: RLS 활성화 필요

**권장사항**:
- 프로덕션 배포 전 RLS 정책 검토 및 활성화
- 각 테이블별 접근 권한 정책 확인

### Cron Jobs (`vercel.json`)

**설정된 Cron Jobs**:
1. `/api/cron/generate-daily-diets` - 매일 오후 6시(18:00) 실행
2. `/api/cron/daily-notifications` - 매일 오전 9시(09:00) 실행

**필수 환경 변수**:
- `CRON_SECRET`: Vercel Cron Job 인증용 시크릿 키

---

## 7. Next.js 설정 확인

### `next.config.ts`

**이미지 최적화**:
- ✅ Supabase 스토리지 호스트 자동 허용
- ✅ 외부 이미지 서비스 호스트 설정됨

**컴파일러 설정**:
- ✅ 프로덕션에서 console.log 제거 (error, warn 제외)
- ✅ ESLint 빌드 시 무시 설정

**실험적 기능**:
- ✅ 패키지 import 최적화 (lucide-react, @radix-ui/react-icons)

---

## 8. Vercel 프로젝트 설정

### 권장 설정

- **Build Command**: `pnpm build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `pnpm install` ✅
- **Node.js Version**: 20.x 이상 (package.json의 `engines.node` 확인) ✅

---

## 📋 배포 전 최종 체크리스트

### ⚠️ 긴급 수정 필요

- [ ] **빌드 오류 수정** (최우선)
  - [ ] `/diet/weekly` 페이지 모듈 찾기 오류 해결
  - [ ] `/health/emergency/medical-facilities/[category]` 페이지 모듈 찾기 오류 해결
  - [ ] `.next` 폴더 삭제 후 재빌드 테스트
  - [ ] 빌드 성공 확인

### 필수 확인 사항

- [ ] **환경 변수 설정**
  - [ ] 모든 필수 환경 변수가 Vercel에 설정되어 있는지 확인
  - [ ] 프로덕션 키(`pk_live_`, `sk_live_`) 사용 확인
  - [ ] Production, Preview, Development 모두에 설정 확인

- [ ] **빌드 테스트**
  - [ ] 로컬에서 `pnpm build` 성공 확인
  - [ ] 빌드 경고/오류 확인

- [ ] **데이터베이스**
  - [ ] 모든 마이그레이션이 적용되었는지 확인
  - [ ] RLS 정책 검토 및 활성화 (프로덕션)

- [ ] **보안**
  - [ ] 미들웨어 설정 확인
  - [ ] API 라우트 보안 확인
  - [ ] 환경 변수 노출 방지 확인

- [ ] **기능 테스트**
  - [ ] 인증 플로우 테스트
  - [ ] 주요 기능 동작 확인
  - [ ] API 엔드포인트 테스트

---

## 🚀 배포 명령어

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

---

## ⚠️ 주의사항

1. **Clerk 키**: 프로덕션에서는 반드시 프로덕션 키(`pk_live_`, `sk_live_`)를 사용해야 합니다.
2. **환경 변수**: 모든 환경 변수가 Production, Preview, Development 모두에 설정되어 있어야 합니다.
3. **RLS**: 프로덕션 환경에서는 반드시 RLS를 활성화하고 적절한 정책을 설정해야 합니다.
4. **Cron Jobs**: `CRON_SECRET` 환경 변수가 설정되어 있어야 Cron Job이 정상 작동합니다.

---

## 📞 문제 발생 시

1. **빌드 실패**: Vercel 빌드 로그 확인
2. **환경 변수 오류**: Vercel 대시보드에서 환경 변수 확인
3. **데이터베이스 오류**: Supabase 대시보드에서 마이그레이션 상태 확인
4. **인증 오류**: Clerk 대시보드에서 키 설정 확인

---

**검사 완료 일시**: 2025-02-16  
**다음 단계**: 
1. ⚠️ **긴급**: 빌드 오류 수정 (최우선)
2. 환경 변수 설정 확인
3. 빌드 성공 후 프로덕션 배포 진행

---

## 🔧 빌드 오류 해결 가이드

### 1단계: 캐시 삭제 및 재빌드

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
pnpm build

# 또는
rm -rf .next
pnpm build
```

### 2단계: 파일 경로 확인

다음 파일들이 올바른 위치에 있는지 확인:
- `app/(dashboard)/diet/weekly/page.tsx` ✅ 존재 확인
- `app/(dashboard)/health/emergency/medical-facilities/[category]/page.tsx` ✅ 존재 확인

### 3단계: export 확인

두 파일 모두 `export default`가 올바르게 되어 있는지 확인 (✅ 확인됨)

### 4단계: Next.js 버전 확인

```bash
pnpm list next
```

현재 버전: Next.js 15.5.9

### 5단계: 문제 지속 시

라우팅 그룹 `(dashboard)`와 관련된 문제일 수 있으므로:
1. 파일을 직접 경로로 이동 고려
2. Next.js GitHub Issues 확인
3. Vercel 지원팀 문의

