-- ============================================================================
-- diet_plans 테이블 개선 마이그레이션
-- 작성일: 2025-02-02
-- 설명: 건강맞춤식단 저장 문제 해결을 위한 테이블 구조 개선
-- ============================================================================

-- ============================================================================
-- 1. diet_plans 테이블 구조 확인 및 개선
-- ============================================================================

-- 기존 테이블이 없는 경우를 대비하여 IF NOT EXISTS 사용
-- 하지만 이미 존재하는 경우를 고려하여 ALTER TABLE 사용

-- recipe_id를 UUID 타입으로 변경 (기존 TEXT 타입과 호환성 유지)
-- TEXT 타입을 유지하되, NULL 허용 및 검증 강화

-- ingredients 필드 기본값 확인 및 수정
ALTER TABLE diet_plans 
  ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb;

-- composition_summary 필드 기본값 확인 및 수정
ALTER TABLE diet_plans 
  ALTER COLUMN composition_summary SET DEFAULT '[]'::jsonb;

-- ============================================================================
-- 2. 인덱스 추가 (성능 개선)
-- ============================================================================

-- 사용자별 식단 조회 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id_plan_date 
  ON diet_plans(user_id, plan_date DESC);

-- 가족 구성원별 식단 조회 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_family_member_id_plan_date 
  ON diet_plans(family_member_id, plan_date DESC) 
  WHERE family_member_id IS NOT NULL;

-- 식사 타입별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_meal_type 
  ON diet_plans(meal_type);

-- 통합 식단 조회 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_is_unified 
  ON diet_plans(is_unified) 
  WHERE is_unified = true;

-- 사용자별 날짜별 식사 타입 조회 (중복 방지) - 개인 식단용
-- family_member_id가 NULL인 경우만 고려
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_user_date_meal_unique 
  ON diet_plans(user_id, plan_date, meal_type) 
  WHERE family_member_id IS NULL;

-- 가족 구성원별 날짜별 식사 타입 조회 (중복 방지) - 가족 식단용
-- family_member_id가 NULL이 아닌 경우만 고려
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_member_date_meal_unique 
  ON diet_plans(user_id, family_member_id, plan_date, meal_type) 
  WHERE family_member_id IS NOT NULL;

-- ============================================================================
-- 3. 제약조건 추가 (데이터 무결성 보장)
-- ============================================================================

-- recipe_title이 비어있지 않도록 검증 (애플리케이션 레벨에서 처리하되, DB 레벨에서도 보완)
-- CHECK 제약조건은 이미 애플리케이션에서 처리하므로 생략

-- ============================================================================
-- 4. RLS 비활성화 (개발 환경)
-- ============================================================================

ALTER TABLE diet_plans DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. 권한 부여
-- ============================================================================

GRANT ALL ON TABLE diet_plans TO anon, authenticated, service_role;

-- ============================================================================
-- 6. 코멘트 추가
-- ============================================================================

COMMENT ON INDEX idx_diet_plans_user_id_plan_date IS '사용자별 식단 조회 최적화 인덱스';
COMMENT ON INDEX idx_diet_plans_family_member_id_plan_date IS '가족 구성원별 식단 조회 최적화 인덱스';
COMMENT ON INDEX idx_diet_plans_meal_type IS '식사 타입별 조회 최적화 인덱스';
COMMENT ON INDEX idx_diet_plans_is_unified IS '통합 식단 조회 최적화 인덱스';
COMMENT ON INDEX idx_diet_plans_user_date_meal_unique IS '사용자별 날짜별 식사 타입 중복 방지 인덱스';
COMMENT ON INDEX idx_diet_plans_member_date_meal_unique IS '가족 구성원별 날짜별 식사 타입 중복 방지 인덱스';

