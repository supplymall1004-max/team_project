# 프로덕션 배포 체크리스트

> **작성일**: 2025년 12월 2일  
> **목적**: 프로덕션 배포 전 필수 확인 사항  
> **상태**: ✅ **준비 완료**

---

## 📋 배포 전 필수 확인 사항

### 1. 환경 변수 확인 ✅

다음 환경 변수가 모두 설정되어 있는지 확인:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**확인 방법:**
- `.env.local` 또는 배포 플랫폼의 환경 변수 설정 확인
- 모든 변수가 비어있지 않은지 확인

---

### 2. 데이터베이스 마이그레이션 확인 ✅

**필수 마이그레이션 파일:**
- ✅ `000_integrated_01_base_schema.sql`
- ✅ `000_integrated_02_recipes.sql`
- ✅ `000_integrated_03_health.sql`
- ✅ `000_integrated_04_diet.sql`
- ✅ `000_integrated_05_payment_premium.sql`
- ✅ `000_integrated_06_admin_legacy.sql`
- ✅ `20251130000000_insert_homepage_default_content.sql` (초기 데이터)

**확인 방법:**
```bash
# Supabase CLI 사용
supabase migration list

# 또는 Supabase 대시보드에서 확인
```

---

### 3. RLS 정책 설정 ⚠️ **프로덕션 배포 전 필수**

**현재 상태**: 모든 테이블 RLS 비활성화 (개발 환경)

**프로덕션 배포 전 조치:**
1. RLS 정책 마이그레이션 파일 검토: `20251202020000_production_rls_policies.sql`
2. 정책 내용 검토 및 필요시 수정
3. 프로덕션 데이터베이스에 마이그레이션 실행

**주의사항:**
- 개발 환경에서는 RLS를 비활성화해야 합니다
- 프로덕션에서만 RLS 정책을 활성화하세요
- RLS 정책 활성화 후 충분한 테스트 수행

**실행 방법:**
```bash
# 프로덕션 데이터베이스에만 실행
psql -f supabase/migrations/20251202020000_production_rls_policies.sql

# 또는 Supabase CLI 사용 (프로덕션 프로젝트)
supabase migration up
```

---

### 4. 관리자 계정 설정 ✅

**완료 여부 확인:**
- [ ] Clerk 대시보드에서 관리자 역할 부여 완료
- [ ] 관리자 콘솔 접근 테스트 완료 (`/admin`)
- [ ] 관리자 기능 테스트 완료

**설정 방법:**
- `docs/admin-setup-guide.md` 참고
- 또는 `scripts/setup-admin.ts` 스크립트 사용

---

### 5. 보안 설정 확인

#### 5.1 API 키 보안
- [ ] Service Role Key가 클라이언트에 노출되지 않았는지 확인
- [ ] 환경 변수가 `.env.local`에만 있고 Git에 커밋되지 않았는지 확인

#### 5.2 CORS 설정
- [ ] Supabase 대시보드에서 CORS 설정 확인
- [ ] 프로덕션 도메인만 허용되도록 설정

#### 5.3 Storage 버킷 보안
- [ ] `uploads` 버킷이 private으로 설정되어 있는지 확인
- [ ] RLS 정책이 올바르게 설정되어 있는지 확인

---

### 6. 성능 최적화 확인 ✅

**완료된 작업:**
- ✅ 성능 최적화 인덱스 마이그레이션 실행 완료 (28개 인덱스)
- ✅ 통계 정보 업데이트 (ANALYZE)

**추가 확인 사항:**
- [ ] 쿼리 성능 테스트
- [ ] 인덱스 사용률 확인
- [ ] 느린 쿼리 로그 확인

---

### 7. 데이터 백업

**프로덕션 배포 전:**
- [ ] 데이터베이스 백업 생성
- [ ] 중요 데이터 수동 백업 (필요시)

**백업 방법:**
```bash
# Supabase CLI 사용
supabase db dump -f backup.sql

# 또는 Supabase 대시보드에서 백업 다운로드
```

---

### 8. 모니터링 설정

**설정 권장 사항:**
- [ ] Supabase 대시보드에서 알림 설정
- [ ] 에러 로그 모니터링 설정
- [ ] 성능 모니터링 설정

---

### 9. 테스트 실행 ✅

**완료된 테스트:**
- ✅ 시스템 상태 확인 (`/test/system-check`)
- ✅ CRUD 기능 테스트 (`/test/crud-check`)
- ✅ API 엔드포인트 검증 (`/test/api-check`)
- ✅ 관리자 콘솔 기능 테스트 (`/test/admin-check`)
- ✅ 테스트 데이터 검증 (`/test/data-check`)
- ✅ 최종 종합 검증 (`/test/final-check`)

**프로덕션 배포 전 추가 테스트:**
- [ ] RLS 정책 활성화 후 모든 기능 테스트
- [ ] 권한 없는 사용자 접근 차단 확인
- [ ] 관리자 기능 정상 작동 확인

---

### 10. 문서화 확인

**확인된 문서:**
- ✅ `docs/todocheck.md` - 전수조사 체크리스트
- ✅ `docs/admin-setup-guide.md` - 관리자 설정 가이드
- ✅ `docs/final-status-report.md` - 최종 상태 보고서
- ✅ `docs/production-checklist.md` - 프로덕션 체크리스트 (이 문서)

---

## 🚀 배포 단계

### Step 1: 프로덕션 환경 준비
1. 프로덕션 Supabase 프로젝트 생성 (또는 기존 프로젝트 확인)
2. 프로덕션 환경 변수 설정
3. 데이터베이스 마이그레이션 실행

### Step 2: RLS 정책 활성화
1. `20251202020000_production_rls_policies.sql` 파일 검토
2. 프로덕션 데이터베이스에 마이그레이션 실행
3. RLS 정책 테스트

### Step 3: 애플리케이션 배포
1. Next.js 애플리케이션 빌드
2. 프로덕션 서버에 배포
3. 환경 변수 설정 확인

### Step 4: 배포 후 검증
1. 홈페이지 접근 확인
2. 로그인/회원가입 기능 확인
3. 주요 기능 동작 확인
4. 관리자 콘솔 접근 확인

---

## ⚠️ 주의사항

### 개발 환경 vs 프로덕션 환경

**개발 환경:**
- RLS 비활성화 (현재 상태 유지)
- 테스트 데이터 사용 가능
- 디버깅 로그 활성화

**프로덕션 환경:**
- RLS 정책 활성화 필수
- 테스트 데이터 제거 권장
- 디버깅 로그 비활성화

### RLS 정책 롤백

RLS 정책 활성화 후 문제가 발생하면:

```sql
-- 모든 테이블의 RLS 비활성화
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;
```

---

## 📞 문제 발생 시

1. **RLS 정책 오류**: `docs/production-checklist.md`의 롤백 방법 참고
2. **관리자 접근 문제**: `docs/admin-setup-guide.md` 참고
3. **데이터베이스 오류**: Supabase 대시보드 로그 확인

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 2일  
**버전**: 1.0

