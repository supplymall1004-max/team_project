# RLS 정책 가이드

> **작성일**: 2025년 12월 2일  
> **목적**: Row Level Security 정책 이해 및 관리 가이드  
> **대상**: 개발자 및 운영자

---

## 📚 RLS 기본 개념

### Row Level Security란?

Row Level Security (RLS)는 PostgreSQL의 보안 기능으로, 사용자별로 데이터베이스 행(row)에 대한 접근을 제어합니다.

**장점:**
- 데이터 보안 강화
- 사용자별 데이터 격리
- 애플리케이션 레벨 보안 로직 최소화

**단점:**
- 쿼리 성능에 약간의 영향
- 정책 관리 복잡도 증가

---

## 🔐 Clerk + Supabase RLS 통합

### 인증 방식

이 프로젝트는 Clerk를 인증 제공자로 사용하며, Supabase는 Clerk의 JWT 토큰을 사용합니다.

**JWT 구조:**
```json
{
  "sub": "user_2abc123def456",  // Clerk User ID
  "email": "user@example.com",
  ...
}
```

**RLS 정책에서 사용:**
```sql
-- Clerk User ID로 사용자 확인
clerk_id = (SELECT auth.jwt()->>'sub')
```

---

## 📋 테이블별 RLS 정책 가이드

### 1. 사용자 개인 데이터 테이블

**테이블**: `users`, `user_health_profiles`, `family_members`

**정책 원칙:**
- 사용자는 자신의 데이터만 조회/수정 가능
- 다른 사용자의 데이터는 접근 불가

**예시:**
```sql
-- 자신의 프로필만 조회
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  clerk_id = (SELECT auth.jwt()->>'sub')
);
```

---

### 2. 공개 데이터 테이블

**테이블**: `recipes`, `diseases`, `allergies`, `kcdc_alerts`

**정책 원칙:**
- 모든 인증된 사용자가 조회 가능
- 작성자만 수정/삭제 가능 (레시피의 경우)

**예시:**
```sql
-- 모든 인증된 사용자가 레시피 조회 가능
CREATE POLICY "Authenticated users can view recipes"
ON public.recipes FOR SELECT
TO authenticated
USING (true);

-- 자신이 만든 레시피만 수정 가능
CREATE POLICY "Users can manage own recipes"
ON public.recipes FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
```

---

### 3. 식단 계획 테이블

**테이블**: `diet_plans`, `weekly_diet_plans`

**정책 원칙:**
- 사용자는 자신의 식단 계획만 조회/수정 가능
- 가족 구성원의 식단도 포함 (통합 식단)

**예시:**
```sql
-- 자신의 식단 계획만 조회
CREATE POLICY "Users can view own diet plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
```

---

### 4. 관리자 전용 테이블

**테이블**: `admin_copy_blocks`, `popup_announcements`

**정책 원칙:**
- 실제 권한은 서버 사이드에서 검증 (Clerk 메타데이터)
- RLS는 추가 보안 레이어로만 사용
- 공개 콘텐츠는 인증된 사용자 모두 조회 가능

**예시:**
```sql
-- 공개된 팝업만 조회 가능
CREATE POLICY "Public can view published popups"
ON public.popup_announcements FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND active_from <= now() 
  AND (active_until IS NULL OR active_until >= now())
);
```

---

## 🛠️ RLS 정책 관리

### 정책 활성화/비활성화

**개발 환경 (RLS 비활성화):**
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

**프로덕션 환경 (RLS 활성화):**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 정책 확인

```sql
-- 테이블별 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 테이블별 정책 목록 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 정책 삭제

```sql
-- 특정 정책 삭제
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- 테이블의 모든 정책 삭제
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || 
            ' ON public.' || quote_ident(r.tablename);
  END LOOP;
END $$;
```

---

## 🔍 디버깅

### RLS 정책 테스트

**서버 사이드에서 테스트:**
```typescript
// lib/supabase/server.ts 사용
const supabase = createClerkSupabaseClient();
const { data, error } = await supabase
  .from('users')
  .select('*');
```

**클라이언트 사이드에서 테스트:**
```typescript
// lib/supabase/clerk-client.ts 사용
const supabase = useClerkSupabaseClient();
const { data, error } = await supabase
  .from('users')
  .select('*');
```

### 일반적인 문제 해결

**문제 1: "permission denied" 오류**
- 원인: RLS 정책이 데이터 접근을 차단
- 해결: 정책 조건 확인, 사용자 인증 상태 확인

**문제 2: 모든 데이터가 보이지 않음**
- 원인: RLS 정책이 너무 엄격함
- 해결: 정책 조건 완화 또는 서비스 역할 클라이언트 사용

**문제 3: 인증된 사용자가 데이터를 볼 수 없음**
- 원인: JWT 토큰이 올바르게 전달되지 않음
- 해결: Clerk 인증 상태 확인, Supabase 클라이언트 설정 확인

---

## 📝 정책 작성 가이드

### 정책 구조

```sql
CREATE POLICY "policy_name"
ON table_name
FOR operation  -- SELECT, INSERT, UPDATE, DELETE, ALL
TO role       -- authenticated, anon, service_role
USING (condition)    -- 조회/수정/삭제 조건
WITH CHECK (condition);  -- 삽입/수정 시 검증 조건
```

### 일반적인 패턴

**1. 자신의 데이터만 접근:**
```sql
CREATE POLICY "Users can manage own data"
ON table_name FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
```

**2. 공개 데이터 조회:**
```sql
CREATE POLICY "Public can view data"
ON table_name FOR SELECT
TO authenticated
USING (true);
```

**3. 조건부 접근:**
```sql
CREATE POLICY "Conditional access"
ON table_name FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND created_at <= now()
);
```

---

## ⚠️ 주의사항

### 개발 환경

- **RLS 비활성화 권장**: 개발 중에는 RLS를 비활성화하여 권한 문제를 피하세요
- **테스트 데이터**: 개발 환경에서는 테스트 데이터 사용 가능

### 프로덕션 환경

- **RLS 활성화 필수**: 프로덕션에서는 반드시 RLS를 활성화하세요
- **정책 테스트**: RLS 정책 활성화 후 충분한 테스트 수행
- **성능 모니터링**: RLS 정책이 쿼리 성능에 미치는 영향 모니터링

### 보안 고려사항

- **서비스 역할**: 관리 작업은 서비스 역할 클라이언트 사용
- **정책 검증**: 정책이 의도한 대로 작동하는지 정기적으로 검증
- **최소 권한 원칙**: 필요한 최소한의 권한만 부여

---

## 📚 참고 자료

- **RLS 정책 마이그레이션**: `supabase/migrations/20251202020000_production_rls_policies.sql`
- **프로덕션 체크리스트**: `docs/production-checklist.md`
- **Supabase RLS 문서**: https://supabase.com/docs/guides/auth/row-level-security

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 2일  
**버전**: 1.0

