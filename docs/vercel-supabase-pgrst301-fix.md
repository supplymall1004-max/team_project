# Vercel 프로덕션 PGRST301 오류 해결 가이드

## 🔴 PGRST301 오류란?

`PGRST301`은 Supabase PostgREST에서 발생하는 오류로, **"No suitable key or wrong key type"** 메시지와 함께 나타납니다.

이 오류는 일반적으로:
- 잘못된 API 키 사용
- 환경변수 누락 또는 잘못된 값
- 키 타입 불일치 (예: anon key를 service role key로 사용)

---

## 🛠️ 해결 방법

### 1. Vercel 환경변수 확인 (가장 중요)

Vercel Dashboard → **Project Settings** → **Environment Variables**에서 다음 변수를 확인하세요:

#### 필수 Supabase 변수

```bash
# 클라이언트 사이드 (NEXT_PUBLIC_*)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 서버 사이드 (NEXT_PUBLIC_ 없음) ⚠️ 중요!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 중요 사항:**

1. **`SUPABASE_SERVICE_ROLE_KEY`는 반드시 Service Role Key여야 합니다**
   - ❌ Anon Key를 사용하면 안 됩니다
   - ❌ JWT Secret을 사용하면 안 됩니다
   - ✅ Service Role Key만 사용해야 합니다

2. **Service Role Key 찾는 방법:**
   - [Supabase Dashboard](https://app.supabase.com) 접속
   - 프로젝트 선택
   - **Settings** → **API** 이동
   - **Project API keys** 섹션에서:
     - `service_role` 키를 찾습니다 (⚠️ 비밀 키이므로 `[hidden]`으로 표시될 수 있음)
     - `Reveal` 버튼을 클릭하여 키를 복사합니다
     - 이 키는 `eyJ...`로 시작하는 JWT 토큰 형식입니다

3. **모든 환경에 적용**
   - Production, Preview, Development 모두에 설정
   - 또는 "Apply to" 옵션에서 "Production, Preview, Development" 선택

4. **변수명 정확히 입력**
   - `SUPABASE_SERVICE_ROLE_KEY` (대문자, 언더스코어)
   - `NEXT_PUBLIC_SUPABASE_URL` (대문자, 언더스코어)
   - 앞뒤 공백 없이 정확히 입력

---

### 2. 키 타입 확인

다음은 **잘못된 예시**입니다:

```bash
# ❌ 잘못됨: Anon Key를 Service Role Key로 사용
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # (실제로는 anon key)

# ❌ 잘못됨: JWT Secret 사용
SUPABASE_SERVICE_ROLE_KEY=your-jwt-secret-string

# ✅ 올바름: Service Role Key 사용
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # (실제 service_role key)
```

**키 구분 방법:**

- **Anon Key**: `anon` 역할, RLS 정책을 따름, 클라이언트에서 사용
- **Service Role Key**: `service_role` 역할, RLS 우회, 서버에서만 사용 ⚠️

---

### 3. 환경변수 값 검증

Vercel에서 환경변수를 설정한 후, 다음을 확인하세요:

1. **값이 비어있지 않은지 확인**
   - 빈 문자열(`""`)은 설정되지 않은 것과 동일
   - 실제 키 값이 입력되어 있어야 함

2. **앞뒤 공백 없이 입력**
   - 키 값 앞뒤에 공백이 있으면 오류 발생 가능
   - 복사/붙여넣기 시 주의

3. **전체 키 복사**
   - Service Role Key는 매우 긴 문자열입니다
   - 일부만 복사하지 말고 전체를 복사해야 합니다

---

### 4. 배포 후 확인

환경변수를 설정한 후:

1. **재배포 필요**
   - 환경변수 변경 후 반드시 재배포해야 합니다
   - Vercel Dashboard → Deployments → Redeploy

2. **배포 로그 확인**
   - Vercel Dashboard → 실패한 배포 → Build Logs
   - 환경변수 관련 에러 메시지 확인

3. **프로덕션 로그 확인**
   - Vercel Dashboard → 프로젝트 → Functions 탭
   - `/api/diet/notifications/check` 함수 로그 확인
   - `PGRST301` 오류가 사라졌는지 확인

---

## 🔍 문제 진단

### 오류 메시지 분석

프로덕션 로그에서 다음과 같은 오류가 보이면:

```
❌ 사용자 조회 오류: { code: 'PGRST301', details: null, hint: null, message: 'No suitable key or wrong key type' }
```

**의미:**
- `PGRST301`: PostgREST 오류 코드
- `No suitable key`: 적절한 키를 찾을 수 없음
- `wrong key type`: 잘못된 키 타입 사용

**가능한 원인:**
1. `SUPABASE_SERVICE_ROLE_KEY`가 설정되지 않음
2. `SUPABASE_SERVICE_ROLE_KEY`에 Anon Key가 입력됨
3. `SUPABASE_SERVICE_ROLE_KEY` 값이 잘못됨 (일부만 복사, 공백 포함 등)

---

## ✅ 빠른 체크리스트

배포 전 다음 항목을 모두 확인하세요:

- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] Vercel에 `SUPABASE_SERVICE_ROLE_KEY` 설정됨 ⚠️ **가장 중요**
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 Service Role Key인지 확인 (Anon Key 아님)
- [ ] 모든 변수가 Production 환경에 적용됨
- [ ] 변수명이 정확함 (대소문자, 언더스코어)
- [ ] 값이 비어있지 않음
- [ ] 앞뒤 공백 없음
- [ ] 배포 재시도 완료

---

## 🚨 문제 해결이 안 될 때

위 항목을 모두 확인했는데도 오류가 발생하면:

1. **Supabase Dashboard에서 키 재생성**
   - Settings → API → Service Role Key
   - `Reveal` → 전체 키 복사
   - Vercel에 새로 설정

2. **Vercel 환경변수 삭제 후 재설정**
   - 기존 `SUPABASE_SERVICE_ROLE_KEY` 삭제
   - 새로 추가 (전체 키 복사)
   - 재배포

3. **로컬에서 테스트**
   - `.env.local`에 동일한 환경변수 설정
   - `pnpm dev` 실행
   - 로컬에서도 오류가 발생하는지 확인

4. **Supabase 대시보드 확인**
   - 프로젝트가 활성화되어 있는지 확인
   - API 키가 만료되지 않았는지 확인
   - 프로젝트 일시 중지 여부 확인

---

## 📚 참고 문서

- [Supabase API Keys 문서](https://supabase.com/docs/guides/api/api-keys)
- [Vercel 환경변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [프로젝트 배포 체크리스트](./VERCEL_DEPLOYMENT_CHECKLIST.md)

---

## 💡 예방 방법

앞으로 `PGRST301` 오류를 방지하려면:

1. **환경변수 문서화**
   - 프로젝트 README에 필수 환경변수 목록 명시
   - 각 변수의 용도와 찾는 방법 설명

2. **환경변수 검증 스크립트**
   - 배포 전 환경변수 확인 스크립트 실행
   - `scripts/check-env.js` 활용

3. **코드 레벨 검증**
   - `getServiceRoleClient()`에서 환경변수 검증 강화
   - 명확한 에러 메시지 제공 (현재 적용됨)
