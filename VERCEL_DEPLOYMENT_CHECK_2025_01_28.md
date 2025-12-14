# 🚀 Vercel 배포 검사 결과

**검사 일시**: 2025-01-28  
**빌드 상태**: ✅ 성공  
**배포 준비 상태**: ✅ 준비 완료

---

## ✅ 빌드 검증

### 빌드 결과
- **상태**: 성공 (71초 소요)
- **TypeScript 타입 검사**: 통과
- **ESLint 경고**: 있음 (빌드 차단 없음)
- **Next.js 버전**: 15.5.7

### 수정된 사항
1. ✅ **ESLint 에러 수정 완료**:
   - `components/health/visualization/DiseaseRiskGauge.tsx`: `CheckCircle` import 추가
   - `components/snacks/fruit-detail-client.tsx`: `Info` import 추가
   - `prefer-const` 에러 수정 (5개 파일)
   - React Hooks 규칙 위반 수정 (`app/(dashboard)/health/emergency/medical-facilities/[category]/page.tsx`)

2. ✅ **Webpack 설정 추가**:
   - `next.config.ts`에 서버 전용 모듈(`fs`, `path`, `crypto`) 클라이언트 번들에서 제외 설정 추가
   - `lib/youtube-server.ts`의 `fs` 모듈 사용 문제 해결

### 경고 사항 (빌드 차단 없음)
- 사용하지 않는 변수 경고 (개발 중 정리 가능)
- React Hook 의존성 배열 경고 (기능에 영향 없음)
- `<img>` 태그 사용 경고 (Next.js Image 컴포넌트 사용 권장)

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
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

### 4. 애플리케이션 URL (선택, 권장)
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

프로덕션 도메인을 사용하는 경우 설정하세요.

### 5. 선택적 환경 변수
```bash
# 이미지 생성 기능 사용 시
GEMINI_API_KEY=AIzaSyD...

# Notion 연동 시
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...

# 건강 데이터 암호화 (이미 설정되어 있다면)
HEALTH_DATA_ENCRYPTION_KEY=...
SESSION_SECRET=...
```

---

## 📋 배포 전 확인 사항

### 1. 데이터베이스 마이그레이션
- [ ] Supabase에서 모든 마이그레이션 적용 확인
- [ ] `uploads` Storage 버킷 생성 확인
- [ ] RLS 정책 설정 확인 (개발 중에는 비활성화 가능)

### 2. Clerk 설정
- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
- [ ] Redirect URLs 설정 확인

### 3. Vercel 설정
- [ ] 프로젝트 연결 확인 (GitHub/GitLab/Bitbucket)
- [ ] 빌드 명령어: `pnpm build` (자동 감지됨)
- [ ] 출력 디렉토리: `.next` (자동 감지됨)
- [ ] Node.js 버전: 20.x (권장)
- [ ] 설치 명령어: `pnpm install` (자동 감지됨)

### 4. Cron Job 설정
- [ ] `vercel.json` 파일 확인 (이미 설정됨)
- [ ] `/api/cron/generate-daily-diets` 엔드포인트가 `CRON_SECRET` 검증하는지 확인

---

## 🔧 Vercel 배포 단계

### 1. Vercel 프로젝트 생성
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New..." → "Project" 클릭
3. GitHub/GitLab/Bitbucket 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `pnpm build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)
   - **Install Command**: `pnpm install` (자동 감지)

### 2. 환경 변수 설정
1. 프로젝트 설정 → "Environment Variables" 메뉴
2. 위의 "필수 환경 변수 목록"에 있는 모든 변수 추가
3. 각 환경(Production, Preview, Development)에 맞게 설정
4. **중요**: `SUPABASE_SERVICE_ROLE_KEY`와 `CLERK_SECRET_KEY`는 Production에만 설정 권장

### 3. 배포 실행
1. "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 도메인 확인

### 4. 배포 후 확인
- [ ] 홈페이지 로드 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] API 엔드포인트 동작 확인
- [ ] 이미지 로드 확인
- [ ] Cron Job 동작 확인 (Vercel Dashboard → Cron Jobs)

---

## 🐛 문제 해결

### 빌드 실패 시
1. **환경 변수 확인**: 모든 필수 환경 변수가 설정되었는지 확인
2. **빌드 로그 확인**: Vercel Dashboard → Deployments → 해당 배포 → Build Logs
3. **로컬 빌드 테스트**: `pnpm build` 명령어로 로컬에서 빌드 확인

### 런타임 에러 시
1. **함수 로그 확인**: Vercel Dashboard → Functions → 해당 함수 → Logs
2. **환경 변수 확인**: Production 환경 변수가 올바르게 설정되었는지 확인
3. **Supabase 연결 확인**: Supabase 대시보드에서 연결 상태 확인

### Cron Job이 동작하지 않을 때
1. **CRON_SECRET 확인**: 환경 변수가 올바르게 설정되었는지 확인
2. **엔드포인트 확인**: `/api/cron/generate-daily-diets`가 `CRON_SECRET`을 검증하는지 확인
3. **Vercel Cron Jobs 확인**: Vercel Dashboard → Cron Jobs에서 스케줄 확인

---

## 📝 추가 참고 사항

### 파일 구조
- `vercel.json`: Cron Job 설정 포함
- `next.config.ts`: Webpack 설정, 이미지 최적화 설정 포함
- `middleware.ts`: Clerk 인증 미들웨어

### 성능 최적화
- Next.js Image 최적화 활성화
- 프로덕션에서 console.log 자동 제거 (error, warn 제외)
- 패키지 import 최적화 (lucide-react, @radix-ui/react-icons)

### 보안
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되지 않도록 주의
- `CRON_SECRET`은 강력한 랜덤 문자열 사용
- Clerk 키는 프로덕션과 개발 환경 분리

---

## ✅ 체크리스트 요약

배포 전 최종 확인:

- [x] 로컬 빌드 성공 (`pnpm build`)
- [x] TypeScript 타입 에러 없음
- [x] ESLint 에러 없음 (경고는 허용)
- [ ] Vercel 프로젝트 생성
- [ ] 필수 환경 변수 설정
- [ ] Supabase 마이그레이션 적용
- [ ] Clerk 설정 확인
- [ ] 첫 배포 실행
- [ ] 배포 후 기능 테스트

---

**검사 완료**: 프로젝트는 Vercel 배포 준비가 완료되었습니다! 🎉

