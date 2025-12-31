# Vercel 배포 체크리스트

이 문서는 Vercel에 배포하기 전에 확인해야 할 사항들을 정리한 것입니다.

## ✅ 빌드 검증

- [x] **빌드 성공**: `pnpm build` 명령어로 프로덕션 빌드가 성공적으로 완료됨
- [x] **TypeScript 오류 없음**: 타입 체크 통과
- [ ] **ESLint 경고**: 대부분 경고 수준이며 빌드에 영향 없음 (next.config.ts에서 `ignoreDuringBuilds: true` 설정됨)

## ⚠️ 발견된 이슈 및 해결

### 1. 동적 서버 사용 오류 (수정 완료)
- **문제**: `/health/vaccinations` 페이지가 `headers()`를 사용하여 정적 렌더링 불가
- **해결**: 페이지에 `export const dynamic = 'force-dynamic'` 추가
- **파일**: `app/health/vaccinations/page.tsx`

### 2. Clerk 개발 키 경고
- **문제**: 빌드 시 프로덕션 환경에서 개발 키(`pk_test_`) 사용 경고
- **해결 필요**: Vercel 환경 변수에서 프로덕션 키(`pk_live_`)로 변경 필요
- **위치**: Vercel Dashboard → Settings → Environment Variables

### 3. ESLint 오류 (수정 완료)
- **문제**: `lib/storage/storage-adapter.ts`에서 `require()` 사용
- **해결**: ESLint 비활성화 주석 추가 (동적 import로 변경 시 순환 참조 발생 가능)

## 🔐 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들을 설정해야 합니다:

### 필수 환경 변수

#### Clerk 인증
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (프로덕션 키 사용)
CLERK_SECRET_KEY=sk_live_... (프로덕션 키 사용)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

#### 네이버 API (선택사항)
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
NAVER_SEARCH_CLIENT_ID=...
NAVER_SEARCH_CLIENT_SECRET=...
```

### 환경별 설정

- **Production**: 모든 환경 변수 설정 필수
- **Preview**: Production과 동일하게 설정 권장
- **Development**: 로컬 `.env.local` 파일 사용

## 📋 배포 전 확인 사항

### 1. 빌드 설정
- [x] `package.json`에 `build` 스크립트 존재
- [x] `next.config.ts` 설정 확인
- [x] Node.js 버전: `>=20.0.0` (package.json engines 확인)

### 2. Vercel 설정 파일
- [x] `vercel.json` 존재 및 Cron 작업 설정 확인
  - `/api/cron/generate-daily-diets` - 매일 18:00
  - `/api/cron/daily-notifications` - 매일 09:00

### 3. 데이터베이스
- [ ] Supabase 프로젝트가 프로덕션 환경으로 설정됨
- [ ] RLS 정책이 프로덕션에 맞게 설정됨 (개발 중에는 비활성화 가능)
- [ ] 마이그레이션이 모두 적용됨

### 4. 외부 서비스 연동
- [ ] Clerk 프로덕션 환경 설정
- [ ] Supabase 프로덕션 프로젝트 연결
- [ ] 네이버 API 키 설정 (사용하는 경우)

### 5. 성능 최적화
- [x] 이미지 최적화 설정 (`next.config.ts`의 `remotePatterns`)
- [x] 컴파일러 최적화 설정 (`removeConsole` 등)
- [x] 패키지 최적화 (`optimizePackageImports`)

## 🚀 배포 단계

### 1. Git 연동
```bash
# Vercel CLI로 배포 (선택사항)
pnpm deploy
# 또는
vercel --prod
```

### 2. GitHub 연동 (권장)
1. Vercel Dashboard → 프로젝트 → Settings → Git
2. GitHub 저장소 연결
3. 자동 배포 설정 (Production 브랜치: `main` 또는 `master`)

### 3. 환경 변수 설정
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. 위의 환경 변수 목록에 따라 모든 변수 추가
3. 각 환경(Production, Preview, Development)별로 설정

### 4. 빌드 설정 확인
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (자동 감지됨)
- **Output Directory**: `.next` (자동 감지됨)
- **Install Command**: `pnpm install` (자동 감지됨)

### 5. 도메인 설정
1. Vercel Dashboard → 프로젝트 → Settings → Domains
2. 커스텀 도메인 추가 (선택사항)

## 🔍 배포 후 확인

### 1. 기본 기능 테스트
- [ ] 홈페이지 로드 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] 주요 페이지 접근 확인

### 2. API 엔드포인트 테스트
- [ ] 인증 API 동작 확인
- [ ] Supabase 연동 확인
- [ ] Cron 작업 스케줄 확인

### 3. 성능 모니터링
- [ ] Vercel Analytics 설정 (선택사항)
- [ ] 빌드 로그 확인
- [ ] 런타임 로그 확인

## 📝 참고 사항

### 빌드 시간
- 현재 빌드 시간: 약 86초
- 정적 페이지: 197개 생성
- 동적 라우트: 다수

### 주의사항
1. **Clerk 키**: 반드시 프로덕션 키(`pk_live_`) 사용
2. **Supabase RLS**: 프로덕션에서는 적절한 RLS 정책 필수
3. **환경 변수**: 민감한 정보는 절대 코드에 포함하지 않기
4. **Cron 작업**: Vercel의 무료 플랜에서는 제한이 있을 수 있음

### 문제 해결
- 빌드 실패 시: Vercel Dashboard → Deployments → 해당 배포 → Build Logs 확인
- 런타임 오류: Vercel Dashboard → 프로젝트 → Logs 확인
- 환경 변수 문제: Vercel Dashboard → Settings → Environment Variables 확인

## ✅ 최종 체크리스트

배포 전 최종 확인:

- [ ] 모든 환경 변수 설정 완료
- [ ] Clerk 프로덕션 키 사용
- [ ] 빌드 성공 확인
- [ ] 주요 기능 테스트 완료
- [ ] 도메인 설정 (선택사항)
- [ ] 모니터링 설정 (선택사항)

---

**마지막 업데이트**: 2025-01-27
**검사 완료**: 빌드 성공, 주요 이슈 수정 완료

