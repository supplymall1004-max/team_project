# Vercel 배포 오류 해결 보고서

## ✅ 수정 완료된 내용

### 1. `/api/health/kcdc/alerts` 404 오류 수정

**문제:**
- KCDC 알림 API가 404 오류 발생
- `middleware.ts`에서 공개 경로로 설정되지 않아 인증이 필요했음

**수정 내용:**
- `middleware.ts`에 `/api/health/kcdc/alerts(.*)`를 공개 경로로 추가
- KCDC 알림은 공개 데이터이므로 인증 없이 접근 가능하도록 설정

**수정된 파일:**
- ✅ `middleware.ts`

---

## ⚠️ 확인이 필요한 항목

### 1. 307 리다이렉트 (정상 동작)

**로그:**
```
GET 307 /recipes
GET 307 /diet
GET 307 /health
```

**의미:**
- 인증이 필요한 페이지에 비로그인 사용자가 접근하면 `/sign-in`으로 리다이렉트됨
- **정상적인 동작**입니다

**확인 방법:**
- 로그인 후 해당 페이지 접근 시 정상 작동하는지 확인
- 비로그인 상태에서 인증이 필요한 페이지 접근 시 `/sign-in`으로 리다이렉트되는 것은 정상

---

### 2. `manifest.json` 404 오류

**문제:**
- `public/manifest.json` 파일이 Git에 포함되어 있음
- 하지만 Vercel에서 404 오류 발생

**가능한 원인:**
1. 빌드 시 `public` 폴더가 제대로 복사되지 않음
2. Vercel 빌드 캐시 문제
3. 파일 경로 문제

**해결 방법:**

1. **로컬 빌드 확인**
   ```bash
   pnpm build
   ```
   - 빌드 후 `.next/static` 폴더 확인
   - `manifest.json`이 포함되어 있는지 확인

2. **Git 커밋 확인**
   ```bash
   git status
   git log --oneline --all -- public/manifest.json
   ```
   - 파일이 커밋되어 있는지 확인
   - 최근 커밋에 포함되어 있는지 확인

3. **Vercel 재배포**
   - Git에 푸시 후 자동 재배포
   - 또는 Vercel Dashboard에서 수동 재배포

4. **빌드 캐시 삭제**
   - Vercel Dashboard → Settings → Build & Development Settings
   - "Clear Build Cache" 클릭
   - 재배포

5. **파일 경로 확인**
   - `public/manifest.json` 파일이 올바른 위치에 있는지 확인
   - 파일 내용이 유효한 JSON인지 확인

**참고:**
- `manifest.json`은 PWA 기능에 사용됨
- 이 경고는 앱 작동에 영향을 주지 않음
- PWA 기능을 사용하지 않는다면 무시해도 됨

---

### 3. Clerk 개발 키 경고

**경고 메시지:**
```
⚠️ [Layout] 프로덕션 환경에서 개발 키(pk_test_)를 사용하고 있습니다.
```

**의미:**
- 프로덕션에서 개발 키(`pk_test_...`)를 사용 중
- 프로덕션에서는 프로덕션 키(`pk_live_...`)를 사용해야 함

**해결 방법:**

1. **Clerk Dashboard에서 프로덕션 키 복사**
   - [Clerk Dashboard](https://dashboard.clerk.com) 접속
   - 프로젝트 선택
   - **Settings** → **API Keys**
   - **Production** 섹션에서 `Publishable Key` (`pk_live_...`) 복사

2. **Vercel에 프로덕션 키 설정**
   - Vercel Dashboard → 프로젝트 선택
   - **Settings** → **Environment Variables**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 찾기
   - 값에 프로덕션 키(`pk_live_...`) 입력
   - **Save** 클릭

3. **Secret Key도 확인**
   - `CLERK_SECRET_KEY`도 프로덕션 키(`sk_live_...`)인지 확인
   - 개발 키(`sk_test_...`)라면 프로덕션 키로 변경

4. **재배포**
   - 환경변수 변경 후 **자동 재배포** 또는 **수동 재배포**
   - 재배포 완료 후 경고 메시지가 사라지는지 확인

**중요:**
- 개발 키는 개발 환경에서만 사용
- 프로덕션 키는 프로덕션 환경에서만 사용
- 키를 변경한 후 반드시 재배포 필요

---

## 📋 체크리스트

### 즉시 확인 필요
- [x] `/api/health/kcdc/alerts` 공개 경로 추가 (완료)
- [ ] Clerk 프로덕션 키 설정 확인
- [ ] `manifest.json` 배포 확인

### 선택 사항
- [ ] 307 리다이렉트 동작 확인 (정상 동작이므로 선택)
- [ ] PWA 기능 사용 여부 확인

---

## 🚀 다음 단계

1. **Git 커밋 및 푸시**
   ```bash
   git add middleware.ts
   git commit -m "Fix: Add /api/health/kcdc/alerts to public routes"
   git push
   ```

2. **Vercel 재배포**
   - Git 푸시 후 자동 재배포 대기
   - 또는 Vercel Dashboard에서 수동 재배포

3. **Clerk 프로덕션 키 설정**
   - Vercel Dashboard → Settings → Environment Variables
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`를 프로덕션 키로 변경
   - `CLERK_SECRET_KEY`도 프로덕션 키로 변경
   - 재배포

4. **배포 후 확인**
   - `/api/health/kcdc/alerts` 접속하여 200 응답 확인
   - `/manifest.json` 접속하여 JSON 응답 확인
   - 로그인 후 페이지 접근하여 정상 작동 확인

---

## 💡 추가 정보

### 환경변수 확인 방법

**Vercel Dashboard:**
1. 프로젝트 선택
2. Settings → Environment Variables
3. 모든 환경변수가 설정되어 있는지 확인

**필수 환경변수:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (프로덕션 키: `pk_live_...`)
- `CLERK_SECRET_KEY` (프로덕션 키: `sk_live_...`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHARMACY_API_KEY` (약국 검색 기능 사용 시)

### API 엔드포인트 확인

**공개 API (인증 불필요):**
- `/api/weather`
- `/api/health/medical-facilities/*`
- `/api/health/kcdc/alerts` (수정 완료)

**인증 필요 API:**
- `/api/diet/*`
- `/api/health/profile`
- `/api/health/metrics`
- 기타 대부분의 API

---

## 🔍 문제 해결 가이드

### 문제: API가 404 오류 발생

**확인 사항:**
1. 파일이 올바른 위치에 있는지 확인 (`app/api/.../route.ts`)
2. `middleware.ts`에서 공개 경로로 설정되어 있는지 확인
3. 빌드 로그에서 파일이 포함되어 있는지 확인

**해결 방법:**
- 공개 API라면 `middleware.ts`에 공개 경로로 추가
- 인증이 필요한 API라면 정상 동작 (307 리다이렉트)

### 문제: manifest.json 404 오류

**확인 사항:**
1. `public/manifest.json` 파일 존재 확인
2. Git에 포함되어 있는지 확인
3. 빌드 후 파일이 포함되어 있는지 확인

**해결 방법:**
- Git에 파일 추가 및 커밋
- Vercel 빌드 캐시 삭제
- 재배포

### 문제: Clerk 개발 키 경고

**확인 사항:**
1. Vercel 환경변수에서 키 확인
2. 키가 `pk_test_`로 시작하는지 확인

**해결 방법:**
- Clerk Dashboard에서 프로덕션 키 복사
- Vercel 환경변수 업데이트
- 재배포
