-- Migration: add family_member_id to identity_verifications table
-- 가족 구성원별 신원확인을 지원하기 위한 마이그레이션

-- 1. family_member_id 컬럼 추가 (NULL 허용 - 본인인 경우 NULL)
ALTER TABLE IF EXISTS public.identity_verifications
  ADD COLUMN IF NOT EXISTS family_member_id UUID;

-- 2. Foreign Key 제약조건 추가 (family_members 테이블 참조)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'family_members'
  ) THEN
    -- FK 제약조건이 없으면 추가
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_name = 'fk_identity_verifications_family_member'
        AND tc.table_name = 'identity_verifications'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE public.identity_verifications
        ADD CONSTRAINT fk_identity_verifications_family_member
        FOREIGN KEY (family_member_id)
        REFERENCES public.family_members (id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END
$$;

-- 3. 인덱스 추가 (가족 구성원별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_identity_verifications_family_member 
  ON public.identity_verifications (family_member_id);

-- 4. 복합 인덱스 추가 (사용자 + 가족 구성원 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_family 
  ON public.identity_verifications (clerk_user_id, family_member_id);

-- 5. 제약조건 추가: 본인이거나 가족 구성원 중 하나만 있어야 함
-- (clerk_user_id는 항상 있어야 하고, family_member_id는 선택적)
-- 이 제약조건은 애플리케이션 레벨에서 처리 (본인인 경우 family_member_id는 NULL)

COMMENT ON COLUMN public.identity_verifications.family_member_id IS 
  '가족 구성원 ID (본인인 경우 NULL, 가족 구성원인 경우 해당 구성원의 ID)';

-- ============================================================================
-- 관계도 요약 (이 마이그레이션으로 추가/변경된 관계)
-- ============================================================================
--
-- identity_verifications 테이블 관계:
--   ├── clerk_user_id → users(clerk_id) CASCADE (기존)
--   └── family_member_id → family_members(id) CASCADE (신규 추가)
--       └── 본인인 경우: family_member_id = NULL
--       └── 가족 구성원인 경우: family_member_id = 해당 구성원의 ID
--
-- consent_records 테이블 관계 (기존):
--   ├── clerk_user_id → users(clerk_id) CASCADE
--   └── verification_id → identity_verifications(id) SET NULL
--       └── 신원확인과 연결된 동의 내역 추적
--
-- 전체 관계도 구조:
--
-- users (id, clerk_id) - 중앙 허브 테이블
--   ├── identity_verifications (clerk_user_id) → users(clerk_id) CASCADE
--   │   ├── 본인 신원확인: family_member_id = NULL
--   │   └── 가족 구성원 신원확인: family_member_id → family_members(id) CASCADE
--   │       └── family_members (user_id) → users(id) CASCADE
--   │           └── 가족 구성원 정보 (이름, 생년월일, 성별, 관계 등)
--   └── consent_records (clerk_user_id) → users(clerk_id) CASCADE
--       └── consent_records (verification_id) → identity_verifications(id) SET NULL
--           └── 신원확인별 동의 내역 추적
--
-- ============================================================================
-- 참조 관계별 분류
-- ============================================================================
--
-- CASCADE 삭제 (부모 삭제시 자식도 삭제):
-- - identity_verifications → users (clerk_user_id)
-- - identity_verifications → family_members (family_member_id) [신규]
-- - consent_records → users (clerk_user_id)
--
-- SET NULL (부모 삭제시 자식 필드 NULL):
-- - consent_records → identity_verifications (verification_id)
--
-- ============================================================================
-- 인덱스 최적화
-- ============================================================================
--
-- idx_identity_verifications_clerk: clerk_user_id 조회 최적화 (기존)
-- idx_identity_verifications_family_member: family_member_id 조회 최적화 (신규)
-- idx_identity_verifications_user_family: (clerk_user_id, family_member_id) 복합 조회 최적화 (신규)
--
-- ============================================================================
-- 사용 시나리오
-- ============================================================================
--
-- 1. 본인 신원확인:
--    - identity_verifications.clerk_user_id = 사용자 ID
--    - identity_verifications.family_member_id = NULL
--
-- 2. 가족 구성원 신원확인:
--    - identity_verifications.clerk_user_id = 본인(부모) 사용자 ID
--    - identity_verifications.family_member_id = 가족 구성원 ID
--    - family_members.user_id = 본인(부모) 사용자 ID
--
-- 3. 동의 내역 추적:
--    - consent_records.verification_id → identity_verifications.id
--    - 본인 및 가족 구성원별 동의 내역을 신원확인과 연결하여 추적
--
-- ============================================================================
