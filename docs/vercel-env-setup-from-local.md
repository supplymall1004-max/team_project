# Vercel 환경변수 설정 가이드 (.env.local 기준)

## 📋 .env.local 파일의 환경변수를 Vercel에 설정하기

`.env.local` 파일에 있는 환경변수들을 Vercel Dashboard에 설정하는 방법입니다.

---

## 🚀 설정 방법

### 1. Vercel Dashboard 접속

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택 (`team-project-eight-blue`)
3. **Settings** → **Environment Variables** 클릭

### 2. 환경변수 추가

다음 환경변수들을 **하나씩** 추가하세요:

#### Clerk 인증 변수

```bash
# 변수명: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# 값: pk_test_Z3Jvd2luZy1saXphcmQtNzIuY2xlcmsuYWNjb3VudHMuZGV2JA
# 환경: Production, Preview, Development 모두 선택

# 변수명: CLERK_SECRET_KEY
# 값: sk_test_OkgrtflOC4I0h1DavMNzV3LAAWW4LpIRdDCh3BlTA4
# 환경: Production, Preview, Development 모두 선택

# 변수명: NEXT_PUBLIC_CLERK_SIGN_IN_URL
# 값: /sign-in
# 환경: Production, Preview, Development 모두 선택

# 변수명: NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
# 값: /
# 환경: Production, Preview, Development 모두 선택

# 변수명: NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
# 값: /
# 환경: Production, Preview, Development 모두 선택
```

#### Supabase 변수

```bash
# 변수명: NEXT_PUBLIC_SUPABASE_URL
# 값: https://xlbhrgvnfioxtvocwban.supabase.co
# 환경: Production, Preview, Development 모두 선택

# 변수명: NEXT_PUBLIC_SUPABASE_ANON_KEY
# 값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmhyZ3ZuZmlveHR2b2N3YmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTkxMzAsImV4cCI6MjA3OTI3NTEzMH0.HpuNyzFDyIp1YvQbPyfKJRgluM74IBI6-Baf52ClpnA
# 환경: Production, Preview, Development 모두 선택

# 변수명: SUPABASE_SERVICE_ROLE_KEY
# 값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmhyZ3ZuZmlveHR2b2N3YmFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY5OTEzMCwiZXhwIjoyMDc5Mjc1MTMwfQ.K10MHHRJIIHlbww8VXG3io_0lXZat-IBbuxEPV0v4vg
# 환경: Production, Preview, Development 모두 선택

# 변수명: NEXT_PUBLIC_STORAGE_BUCKET
# 값: uploads
# 환경: Production, Preview, Development 모두 선택
```

#### 기타 API 키 (선택사항)

```bash
# 식약처 조리식품 레시피 DB API
# 변수명: FOOD_SAFETY_RECIPE_API_KEY
# 값: 4e7ac25e7b614d039a99

# 질병관리청 API
# 변수명: KCDC_API_KEY
# 값: c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca

# Google API
# 변수명: GOOGLE_API_KEY
# 값: AIzaSyDZIQ6GjpUVgXCIFlSo9f1Fo6wREVvMQ7o

# Pixabay API
# 변수명: PIXABAY_API_KEY
# 값: 53412409-1e076dba0ad6756989ac0ca98

# 식약처 의약품개요정보 API
# 변수명: MFDS_MEDICATION_OVERVIEW_API_KEY
# 값: c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca

# 기상청 날씨 API
# 변수명: NEXT_PUBLIC_KMA_WEATHER_API_KEY
# 값: c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca

# 네이버 지도 API
# 변수명: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
# 값: pzm5qdxswb

# 네이버 지오코딩 API
# 변수명: NAVER_CLIENT_ID
# 값: _0iUN1nUPPYaK8BhaujP
# 변수명: NAVER_CLIENT_SECRET
# 값: rx9Gqavnm5

# 네이버 로컬 검색 API
# 변수명: NAVER_SEARCH_CLIENT_ID
# 값: _0iUN1nUPPYaK8BhaujP
# 변수명: NAVER_SEARCH_CLIENT_SECRET
# 값: rx9Gqavnm5

# 약국 API
# 변수명: PHARMACY_API_KEY
# 값: c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca
```

---

## ⚠️ 중요 사항

### 1. 값 입력 시 주의사항

- **따옴표 제거**: `.env.local` 파일에는 따옴표가 있지만, Vercel에는 **따옴표 없이** 입력하세요
  - ❌ 잘못됨: `"pk_test_Z3Jvd2luZy1saXphcmQtNzIuY2xlcmsuYWNjb3VudHMuZGV2JA"`
  - ✅ 올바름: `pk_test_Z3Jvd2luZy1saXphcmQtNzIuY2xlcmsuYWNjb3VudHMuZGV2JA`

- **앞뒤 공백 없음**: 값 앞뒤에 공백이 없어야 합니다

- **전체 값 복사**: 긴 키 값은 전체를 복사해야 합니다 (일부만 복사하지 않음)

### 2. 환경 선택

각 환경변수를 추가할 때 **"Apply to"** 옵션에서:
- ✅ **Production** 선택
- ✅ **Preview** 선택  
- ✅ **Development** 선택

또는 **"Apply to all environments"** 선택

### 3. 필수 변수 우선 설정

다음 변수들은 **반드시** 설정해야 합니다 (앱이 작동하지 않음):

1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. `CLERK_SECRET_KEY`
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `SUPABASE_SERVICE_ROLE_KEY`

나머지는 선택사항이지만, 해당 기능을 사용하려면 설정해야 합니다.

---

## 🔄 환경변수 설정 후 재배포

환경변수를 추가/수정한 후에는 **반드시 재배포**해야 합니다:

1. Vercel Dashboard → **Deployments** 탭
2. 최신 배포 옆의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. 또는 터미널에서: `vercel --prod`

**⚠️ 중요**: 환경변수를 변경한 후 재배포하지 않으면 변경사항이 적용되지 않습니다!

---

## ✅ 설정 확인 방법

### Vercel 대시보드에서 확인

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. 다음 변수들이 **모두** 있는지 확인:
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - ✅ `CLERK_SECRET_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

### 배포 후 확인

1. 프로덕션 사이트 접속
2. 개발자 도구(F12) → Console 탭
3. 환경변수 관련 에러가 없는지 확인
4. 페이지가 정상적으로 로드되는지 확인

---

## 🚨 문제 해결

### 문제 1: 환경변수를 설정했는데도 오류가 발생

**해결:**
1. 환경변수 값이 정확한지 확인 (따옴표 제거, 공백 없음)
2. **재배포** 완료했는지 확인
3. 모든 환경(Production, Preview, Development)에 적용되었는지 확인

### 문제 2: 특정 기능만 작동하지 않음

**해결:**
1. 해당 기능에 필요한 환경변수가 설정되어 있는지 확인
2. 변수명이 정확한지 확인 (대소문자, 언더스코어)
3. 값이 올바른지 확인

### 문제 3: 로컬에서는 작동하는데 프로덕션에서 안 됨

**해결:**
1. Vercel에 환경변수가 설정되어 있는지 확인
2. 프로덕션 키를 사용하는지 확인 (Clerk의 경우 `pk_live_...`)
3. 재배포 완료했는지 확인

---

## 📚 참고 문서

- [Vercel 환경변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경변수 문서](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [프로젝트 배포 체크리스트](./VERCEL_DEPLOYMENT_CHECKLIST.md)
