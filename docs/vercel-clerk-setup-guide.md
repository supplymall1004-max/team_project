# Vercel 프로덕션 Clerk 인증 설정 가이드

## 🔴 프로덕션 Clerk 인증 오류 해결 방법

프로덕션에서 Clerk 인증 오류가 발생하는 경우, 다음 항목을 확인하세요.

---

## 1. Vercel 환경변수 설정 (필수)

Vercel Dashboard → **Project Settings** → **Environment Variables**에서 다음 변수를 **모두** 설정해야 합니다:

### Clerk 인증 변수 (모두 필수)

```bash
# 클라이언트 사이드 (NEXT_PUBLIC_*)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... 또는 pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# 서버 사이드 (NEXT_PUBLIC_ 없음)
CLERK_SECRET_KEY=sk_live_... 또는 sk_test_...
```

**⚠️ 중요 사항:**

1. **프로덕션에서는 `pk_live_` 및 `sk_live_` 키를 사용하세요**
   - 테스트 키(`pk_test_`, `sk_test_`)는 개발 환경에서만 사용
   - 프로덕션 키는 Clerk Dashboard → API Keys에서 생성

2. **모든 환경에 적용**
   - Production, Preview, Development 모두에 설정
   - 또는 "Apply to" 옵션에서 "Production, Preview, Development" 선택

3. **변수명 정확히 입력**
   - 대소문자 정확히: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (대문자)
   - 언더스코어(`_`) 정확히 입력

4. **값이 비어있지 않은지 확인**
   - 모든 변수에 실제 키 값이 입력되어 있어야 함
   - 빈 문자열(`""`)은 설정되지 않은 것과 동일

---

## 2. Clerk Dashboard 설정 (필수)

Clerk Dashboard에서 프로덕션 도메인을 허용해야 합니다:

### Allowed Origins 설정

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. 프로젝트 선택
3. **Settings** → **Domains** 이동
4. **Allowed Origins** 섹션에서 다음 도메인 추가:
   ```
   https://your-project.vercel.app
   https://your-custom-domain.com (커스텀 도메인 사용 시)
   ```

### Redirect URLs 설정

**Settings** → **Paths**에서 다음 URL이 설정되어 있는지 확인:

- **Sign-in redirect URL**: `/`
- **Sign-up redirect URL**: `/`
- **After sign-in URL**: `/`
- **After sign-up URL**: `/`

---

## 3. 환경변수 확인 방법

### Vercel 대시보드에서 확인

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수들이 **모두** 있는지 확인:
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - ✅ `CLERK_SECRET_KEY`
   - ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
   - ✅ `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

### 로컬에서 확인 (개발 환경)

프로젝트 루트에서 다음 명령어 실행:

```bash
node scripts/check-env.js
```

또는 직접 확인:

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
$env:CLERK_SECRET_KEY

# Linux/Mac
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

---

## 4. 일반적인 오류 원인

### 오류 1: "Clerk: Missing publishableKey"

**원인**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 Vercel에 설정되지 않음

**해결**:
1. Vercel Dashboard → Environment Variables 확인
2. 변수명이 정확한지 확인 (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
3. 값이 비어있지 않은지 확인
4. **Production 환경에 적용**되어 있는지 확인

### 오류 2: "Clerk: Invalid publishableKey"

**원인**: 잘못된 키 값 또는 테스트 키를 프로덕션에서 사용

**해결**:
1. Clerk Dashboard에서 프로덕션 키(`pk_live_...`) 확인
2. Vercel에 올바른 키 값 입력
3. 키 앞뒤 공백 없이 정확히 복사/붙여넣기

### 오류 3: "Clerk: Origin not allowed"

**원인**: Clerk Dashboard의 Allowed Origins에 Vercel 도메인이 없음

**해결**:
1. Clerk Dashboard → Settings → Domains
2. Allowed Origins에 Vercel 도메인 추가:
   ```
   https://your-project.vercel.app
   ```

### 오류 4: 인증 후 리다이렉트 실패

**원인**: Redirect URL 설정이 잘못됨

**해결**:
1. Clerk Dashboard → Settings → Paths 확인
2. Sign-in/Sign-up redirect URL이 `/`로 설정되어 있는지 확인
3. Vercel 환경변수 확인:
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`

---

## 5. 배포 후 확인 사항

배포가 완료된 후 다음을 확인하세요:

1. **브라우저 콘솔 확인**
   - 개발자 도구(F12) → Console 탭
   - Clerk 관련 에러 메시지 확인

2. **네트워크 탭 확인**
   - 개발자 도구 → Network 탭
   - `/api/*` 요청이 401/403 에러인지 확인

3. **로그인/회원가입 테스트**
   - `/sign-in` 페이지 접속
   - `/sign-up` 페이지 접속
   - 정상적으로 로그인/회원가입이 되는지 확인

---

## 6. 빠른 체크리스트

배포 전 다음 항목을 모두 확인하세요:

- [ ] Vercel에 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정됨 (프로덕션 키 사용)
- [ ] Vercel에 `CLERK_SECRET_KEY` 설정됨 (프로덕션 키 사용)
- [ ] Vercel에 `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` 설정됨
- [ ] Vercel에 `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/` 설정됨
- [ ] Vercel에 `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/` 설정됨
- [ ] Clerk Dashboard의 Allowed Origins에 Vercel 도메인 추가됨
- [ ] Clerk Dashboard의 Redirect URLs 설정 확인됨
- [ ] 로컬에서 `pnpm build` 성공 확인됨

---

## 7. 문제 해결이 안 될 때

위 항목을 모두 확인했는데도 오류가 발생하면:

1. **Vercel 배포 로그 확인**
   - Vercel Dashboard → 실패한 배포 → Build Logs
   - 환경변수 관련 에러 메시지 확인

2. **Clerk Dashboard 확인**
   - API Keys에서 키가 활성화되어 있는지 확인
   - 사용량 제한에 걸리지 않았는지 확인

3. **브라우저 콘솔 확인**
   - 개발자 도구 → Console
   - 정확한 에러 메시지 확인

4. **환경변수 재설정**
   - Vercel에서 환경변수 삭제 후 다시 추가
   - 배포 재시도

---

## 참고 문서

- [Clerk Next.js 문서](https://clerk.com/docs/quickstarts/nextjs)
- [Vercel 환경변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [프로젝트 배포 체크리스트](./VERCEL_DEPLOYMENT_CHECKLIST.md)
