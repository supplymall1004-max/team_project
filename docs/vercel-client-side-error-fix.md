# Vercel 프로덕션 클라이언트 사이드 오류 해결 가이드

## 🔴 "Application error: a client-side exception has occurred" 오류

프로덕션에서 이 오류가 발생하는 주요 원인은 **환경변수 누락**입니다.

---

## 🛠️ 해결 방법

### 1. Vercel 환경변수 확인 (가장 중요)

Vercel Dashboard → **Project Settings** → **Environment Variables**에서 다음 변수를 **모두** 확인하세요:

#### 필수 클라이언트 사이드 환경변수 (NEXT_PUBLIC_*)

```bash
# Clerk 인증 (필수)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... 또는 pk_test_...

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 중요 사항:**

1. **모든 환경에 적용**
   - Production, Preview, Development 모두에 설정
   - 또는 "Apply to" 옵션에서 "Production, Preview, Development" 선택

2. **변수명 정확히 입력**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (대문자, 언더스코어)
   - `NEXT_PUBLIC_SUPABASE_URL` (대문자, 언더스코어)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (대문자, 언더스코어)
   - 앞뒤 공백 없이 정확히 입력

3. **값이 비어있지 않은지 확인**
   - 모든 변수에 실제 값이 입력되어 있어야 함
   - 빈 문자열(`""`)은 설정되지 않은 것과 동일

4. **프로덕션 키 사용**
   - 프로덕션에서는 `pk_live_` 키를 사용해야 합니다
   - 테스트 키(`pk_test_`)는 개발 환경에서만 사용

---

### 2. 환경변수 설정 확인 방법

#### Vercel 대시보드에서 확인

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 다음 변수들이 **모두** 있는지 확인:
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 브라우저 콘솔에서 확인

1. 프로덕션 사이트 접속
2. 개발자 도구(F12) → Console 탭
3. 다음 명령어 실행:
   ```javascript
   // 환경변수는 클라이언트에서 직접 접근할 수 없지만,
   // 에러 메시지에서 누락된 변수를 확인할 수 있습니다
   console.log("환경변수 확인 필요");
   ```

---

### 3. 일반적인 오류 원인

#### 원인 1: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 누락

**증상:**
- "Application error: a client-side exception has occurred"
- 브라우저 콘솔에 Clerk 관련 오류

**해결:**
1. Vercel Dashboard → Environment Variables
2. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 추가
3. Clerk Dashboard에서 프로덕션 키(`pk_live_...`) 복사
4. 재배포

#### 원인 2: NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 누락

**증상:**
- "Application error: a client-side exception has occurred"
- 브라우저 콘솔에 Supabase 관련 오류
- "Supabase 환경 변수가 설정되지 않았습니다" 메시지

**해결:**
1. Vercel Dashboard → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL` 추가 (Supabase Dashboard → Settings → API)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가 (Supabase Dashboard → Settings → API)
4. 재배포

#### 원인 3: 잘못된 환경변수 값

**증상:**
- 환경변수는 설정되어 있지만 여전히 오류 발생
- 특정 기능만 작동하지 않음

**해결:**
1. 환경변수 값이 정확한지 확인
   - 전체 키 복사 (일부만 복사하지 않음)
   - 앞뒤 공백 없음
   - 따옴표 없이 입력 (Vercel은 자동으로 처리)

2. 키 타입 확인
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `pk_live_...` 또는 `pk_test_...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJ...`로 시작하는 JWT 토큰

---

### 4. 배포 후 확인

환경변수를 설정한 후:

1. **재배포 필요**
   - 환경변수 변경 후 반드시 재배포해야 합니다
   - Vercel Dashboard → Deployments → Redeploy

2. **브라우저 콘솔 확인**
   - 개발자 도구(F12) → Console 탭
   - 환경변수 관련 에러 메시지 확인
   - 에러가 사라졌는지 확인

3. **페이지 새로고침**
   - 하드 리프레시: `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)
   - 또는 브라우저 캐시 삭제 후 재접속

---

## ✅ 빠른 체크리스트

배포 전 다음 항목을 모두 확인하세요:

- [ ] Vercel에 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 설정됨
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] 모든 변수가 Production 환경에 적용됨
- [ ] 변수명이 정확함 (대소문자, 언더스코어)
- [ ] 값이 비어있지 않음
- [ ] 앞뒤 공백 없음
- [ ] 프로덕션 키 사용 (`pk_live_...`)
- [ ] 배포 재시도 완료

---

## 🚨 문제 해결이 안 될 때

위 항목을 모두 확인했는데도 오류가 발생하면:

1. **Vercel 배포 로그 확인**
   - Vercel Dashboard → 실패한 배포 → Build Logs
   - 환경변수 관련 에러 메시지 확인

2. **브라우저 콘솔 확인**
   - 개발자 도구 → Console 탭
   - 정확한 에러 메시지 확인
   - 에러 스택 트레이스 확인

3. **환경변수 재설정**
   - Vercel에서 환경변수 삭제 후 다시 추가
   - 전체 키 값 복사 (일부만 복사하지 않음)
   - 재배포

4. **로컬에서 테스트**
   - `.env.local`에 동일한 환경변수 설정
   - `pnpm dev` 실행
   - 로컬에서도 오류가 발생하는지 확인

---

## 📚 참고 문서

- [Next.js 환경변수 문서](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel 환경변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Clerk Next.js 문서](https://clerk.com/docs/quickstarts/nextjs)
- [프로젝트 배포 체크리스트](./VERCEL_DEPLOYMENT_CHECKLIST.md)

---

## 💡 예방 방법

앞으로 클라이언트 사이드 오류를 방지하려면:

1. **환경변수 문서화**
   - 프로젝트 README에 필수 환경변수 목록 명시
   - 각 변수의 용도와 찾는 방법 설명

2. **환경변수 검증 스크립트**
   - 배포 전 환경변수 확인 스크립트 실행
   - `scripts/check-env.js` 활용

3. **코드 레벨 검증**
   - 클라이언트 컴포넌트에서 환경변수 검증 강화
   - 명확한 에러 메시지 제공 (현재 적용됨)

4. **ErrorBoundary 활용**
   - 환경변수 누락 시 사용자에게 명확한 메시지 표시
   - 앱이 크래시하지 않도록 안전하게 처리 (현재 적용됨)
