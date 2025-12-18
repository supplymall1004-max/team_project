# Vercel 배포 전 체크리스트

## 📋 현재 상태 (2025-12-18)

### Git 상태
- ✅ 브랜치: `main`
- ⚠️ **수정된 파일 28개 (커밋 필요)**
- ⚠️ **추적되지 않은 파일 10개 (추가 필요)**

### 주요 변경사항
1. ✅ `middleware.ts` - KCDC 알림 API 공개 경로 추가
2. ✅ 약국 검색 오류 처리 개선
3. ✅ 질병 위험도 표시 개선 (진단된 질병 처리)
4. ✅ 가족 식단 기능 추가 (breakfast/lunch/dinner 페이지)
5. ✅ 에러 처리 및 안정성 개선

---

## ✅ 배포 전 필수 체크리스트

### 1. 환경변수 확인 (Vercel Dashboard)

**필수 클라이언트 사이드 환경변수 (NEXT_PUBLIC_*)**

```bash
# Clerk 인증 (필수)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (프로덕션) 또는 pk_test_... (개발)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xlbhrgvnfioxtvocwban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**필수 서버 사이드 환경변수**

```bash
# Clerk (서버)
CLERK_SECRET_KEY=sk_live_... (프로덕션) 또는 sk_test_... (개발)

# Supabase (서버)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Job (선택)
CRON_SECRET=your_random_secret_here

# 약국 API (선택 - 약국 검색 기능 사용 시)
PHARMACY_API_KEY=your_pharmacy_api_key

# 네이버 API (선택 - 의료시설 검색 기능 사용 시)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_SEARCH_CLIENT_ID=your_naver_search_client_id
NAVER_SEARCH_CLIENT_SECRET=your_naver_search_client_secret
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

**⚠️ 중요 확인 사항:**

- [ ] 모든 환경변수가 **Production, Preview, Development** 모두에 설정되어 있는지 확인
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 프로덕션 키(`pk_live_...`)인지 확인
- [ ] `CLERK_SECRET_KEY`가 프로덕션 키(`sk_live_...`)인지 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 Service Role Key인지 확인 (Anon Key 아님)
- [ ] 모든 변수명이 정확히 입력되었는지 확인 (대소문자, 언더스코어)
- [ ] 값에 앞뒤 공백이 없는지 확인

---

### 2. 코드 변경사항 커밋

**수정된 파일 (28개):**
```
app/(dashboard)/health/emergency/medical-facilities/[category]/page.tsx
app/api/diet/notifications/check/route.ts
app/api/diet/notifications/dismiss/route.ts
app/api/health/medical-facilities/geocode/route.ts
app/api/health/medical-facilities/search/route.ts
app/api/health/metrics/route.ts
app/diet/breakfast/[date]/page.tsx
app/diet/dinner/[date]/page.tsx
app/diet/lunch/[date]/page.tsx
app/layout.tsx
components/diet/diet-notification-popup.tsx
components/error-boundary.tsx
components/error-fallback.tsx
components/family/family-diet-view.tsx
components/health/diet-card.tsx
components/health/medical-facilities/location-search.tsx
components/health/visualization/DiseaseRiskGauge.tsx
components/health/visualization/HealthDashboard.tsx
components/health/visualization/detail/charts/disease-risk-gauges.tsx
lib/diet/personal-diet-generator.ts
lib/diet/weekly-diet-generator.ts
lib/health/medical-facilities/facility-utils.ts
lib/health/pharmacy-api.ts
lib/naver/geocoding-api.ts
lib/supabase/clerk-client.ts
lib/supabase/ensure-user.ts
lib/supabase/service-role.ts
middleware.ts
```

**추적되지 않은 파일 (10개):**
```
docs/pharmacy-search-error-fix.md
docs/production-warnings-fix.md
docs/vercel-clerk-setup-guide.md
docs/vercel-client-side-error-fix.md
docs/vercel-deployment-errors-fix.md
docs/vercel-env-setup-from-local.md
docs/vercel-env-verification-checklist.md
docs/vercel-production-errors-fix.md
docs/vercel-supabase-pgrst301-fix.md
lib/diet/family-meal-utils.ts
```

**커밋 명령어:**
```bash
# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Fix: Improve error handling and add family meal features

- Add KCDC alerts API to public routes
- Improve pharmacy search error handling
- Enhance disease risk display for diagnosed users
- Add family meal tabs to breakfast/lunch/dinner pages
- Improve error boundaries and fallback UI
- Add comprehensive deployment documentation"

# 푸시
git push origin main
```

---

### 3. 빌드 테스트 (로컬)

배포 전 로컬에서 빌드가 성공하는지 확인:

```bash
# 빌드 실행
pnpm build

# 빌드 성공 확인
# - TypeScript 오류 없음
# - ESLint 경고 없음 (또는 무시 가능한 경고만)
# - 빌드 완료 메시지 확인
```

**예상 빌드 시간:** 2-5분

---

### 4. 주요 기능 확인

배포 후 다음 기능들이 정상 작동하는지 확인:

#### 인증
- [ ] 로그인/회원가입 정상 작동
- [ ] 로그인 후 페이지 접근 정상
- [ ] 로그아웃 정상 작동

#### 식단 기능
- [ ] 오늘의 식단 표시
- [ ] 아침/점심/저녁 식단 상세 페이지
- [ ] 가족 식단 탭 표시 (가족 구성원이 있는 경우)
- [ ] 주간 식단 생성 및 표시

#### 건강 기능
- [ ] 건강 프로필 조회
- [ ] 건강 메트릭스 표시
- [ ] 질병 위험도 게이지 (진단된 질병 처리 확인)
- [ ] 의료시설 검색 (약국 포함)

#### API 엔드포인트
- [ ] `/api/health/kcdc/alerts` - 200 응답 확인
- [ ] `/api/health/medical-facilities/search` - 정상 작동
- [ ] `/api/diet/plan` - 식단 조회 정상
- [ ] `/api/health/profile` - 프로필 조회 정상

---

### 5. 배포 후 확인 사항

#### 즉시 확인
- [ ] 배포 성공 확인 (Vercel Dashboard)
- [ ] 프로덕션 사이트 접속 가능
- [ ] 로그인 페이지 정상 표시
- [ ] 홈 페이지 정상 표시

#### 브라우저 콘솔 확인
1. F12 → Console 탭
2. 다음 오류가 없는지 확인:
   - ❌ "Clerk has been loaded with development keys" (프로덕션 키 사용 시)
   - ❌ "환경변수가 설정되지 않았습니다"
   - ❌ "Application error: a client-side exception has occurred"
   - ❌ "PGRST301" 오류

#### 네트워크 탭 확인
1. F12 → Network 탭
2. 다음 API가 정상 응답하는지 확인:
   - ✅ `/api/health/kcdc/alerts` - 200
   - ✅ `/api/weather` - 200
   - ✅ `/api/health/medical-facilities/search` - 200 (약국 검색 시)

#### 주요 페이지 확인
- [ ] `/` - 홈 페이지
- [ ] `/sign-in` - 로그인 페이지
- [ ] `/diet` - 식단 페이지
- [ ] `/health/emergency/medical-facilities/pharmacy` - 약국 검색
- [ ] `/diet/breakfast/[오늘날짜]` - 아침 식단 상세

---

## 🚨 알려진 이슈 및 해결 방법

### 1. manifest.json 404 오류

**상태:** 경고 (앱 작동에 영향 없음)

**원인:** `public/manifest.json` 파일이 배포되지 않음

**해결:**
- Git에 파일이 포함되어 있는지 확인
- Vercel 빌드 캐시 삭제 후 재배포
- PWA 기능을 사용하지 않는다면 무시 가능

### 2. Clerk 개발 키 경고

**상태:** 경고 (프로덕션 키 사용 시 해결)

**원인:** 프로덕션에서 개발 키(`pk_test_`) 사용

**해결:**
- Vercel 환경변수에서 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`를 프로덕션 키(`pk_live_...`)로 변경
- `CLERK_SECRET_KEY`도 프로덕션 키(`sk_live_...`)로 변경
- 재배포

### 3. 307 리다이렉트

**상태:** 정상 동작

**의미:** 인증이 필요한 페이지에 비로그인 사용자가 접근하면 `/sign-in`으로 리다이렉트됨

**확인:** 로그인 후 해당 페이지 접근 시 정상 작동하는지 확인

---

## 📝 배포 절차

### 1단계: 코드 커밋 및 푸시

```bash
# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Fix: Improve error handling and add family meal features"

# 푸시
git push origin main
```

### 2단계: Vercel 자동 배포 대기

- Git 푸시 후 Vercel이 자동으로 배포 시작
- Vercel Dashboard에서 배포 상태 확인
- 빌드 로그 확인 (오류 없는지)

### 3단계: 배포 후 확인

- 프로덕션 사이트 접속
- 브라우저 콘솔 확인
- 주요 기능 테스트
- API 엔드포인트 확인

---

## 🔍 문제 발생 시 확인 사항

### 빌드 실패 시

1. **Vercel 빌드 로그 확인**
   - Vercel Dashboard → 실패한 배포 → Build Logs
   - 오류 메시지 확인

2. **일반적인 원인:**
   - 환경변수 누락
   - TypeScript 오류
   - 의존성 문제

3. **해결 방법:**
   - 환경변수 확인 및 추가
   - 로컬에서 `pnpm build` 실행하여 오류 확인
   - 의존성 재설치: `pnpm install`

### 런타임 오류 시

1. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 오류 메시지 확인

2. **네트워크 탭 확인**
   - F12 → Network 탭
   - 실패한 요청 확인

3. **Vercel 로그 확인**
   - Vercel Dashboard → Functions → Logs
   - 서버 사이드 오류 확인

---

## ✅ 배포 완료 체크리스트

배포가 성공적으로 완료되었는지 확인:

- [ ] Vercel 배포 성공 (Dashboard 확인)
- [ ] 프로덕션 사이트 접속 가능
- [ ] 로그인/회원가입 정상 작동
- [ ] 주요 페이지 정상 표시
- [ ] 브라우저 콘솔에 치명적 오류 없음
- [ ] API 엔드포인트 정상 응답
- [ ] 식단 기능 정상 작동
- [ ] 건강 기능 정상 작동
- [ ] 의료시설 검색 정상 작동

---

## 📞 추가 도움

문제가 발생하면 다음 정보를 함께 확인하세요:

1. **Vercel 빌드 로그** (빌드 실패 시)
2. **브라우저 콘솔 오류** (런타임 오류 시)
3. **Vercel Functions 로그** (API 오류 시)
4. **환경변수 설정 스크린샷** (환경변수 문제 시)
