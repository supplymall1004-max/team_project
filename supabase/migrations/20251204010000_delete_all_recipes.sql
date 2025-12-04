-- ============================================================================
-- 현대 레시피북 데이터 전체 삭제
-- 작성일: 2025-12-04
-- 설명: recipes 테이블 및 관련 테이블의 모든 데이터 삭제
-- ============================================================================

-- 외래 키 제약조건 때문에 참조하는 테이블부터 삭제해야 함

-- 1. 레시피 평가 삭제
DELETE FROM public.recipe_ratings;

-- 2. 레시피 신고 삭제
DELETE FROM public.recipe_reports;

-- 3. 조리 단계 삭제
DELETE FROM public.recipe_steps;

-- 4. 재료 정보 삭제
DELETE FROM public.recipe_ingredients;

-- 5. 레시피 기본 정보 삭제 (메인 테이블)
DELETE FROM public.recipes;

-- 삭제 완료 로그
DO $$
BEGIN
  RAISE NOTICE '현대 레시피북 데이터가 모두 삭제되었습니다.';
END $$;

