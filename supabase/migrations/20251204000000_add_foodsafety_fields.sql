-- ============================================================================
-- 식약처 API 필드 추가 마이그레이션
-- 작성일: 2025-12-04
-- 설명: recipes 테이블과 recipe_steps 테이블에 식약처 API 필드 추가
-- ============================================================================

-- ============================================================================
-- 1. recipes 테이블에 식약처 API 필드 추가
-- ============================================================================

-- 식약처 레시피 순번 (UNIQUE 제약조건 추가)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_rcp_seq TEXT;

-- UNIQUE 인덱스 생성 (NULL 값은 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_foodsafety_rcp_seq 
ON public.recipes(foodsafety_rcp_seq) 
WHERE foodsafety_rcp_seq IS NOT NULL;

-- 조리방법
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_rcp_way2 TEXT;

-- 요리종류
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_rcp_pat2 TEXT;

-- 영양 정보 (NUMERIC 타입으로 저장)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_eng NUMERIC(10, 2); -- 칼로리

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_car NUMERIC(10, 2); -- 탄수화물

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_pro NUMERIC(10, 2); -- 단백질

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_fat NUMERIC(10, 2); -- 지방

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_na NUMERIC(10, 2); -- 나트륨

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_info_fiber NUMERIC(10, 2); -- 식이섬유

-- 재료 정보 (원본 텍스트)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_rcp_parts_dtls TEXT;

-- 이미지 URL
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_att_file_no_main TEXT; -- 대표 이미지 URL

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS foodsafety_att_file_no_mk TEXT; -- 만드는 법 이미지 URL

-- 인덱스 추가 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_recipes_foodsafety_rcp_way2 
ON public.recipes(foodsafety_rcp_way2) 
WHERE foodsafety_rcp_way2 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_foodsafety_rcp_pat2 
ON public.recipes(foodsafety_rcp_pat2) 
WHERE foodsafety_rcp_pat2 IS NOT NULL;

-- ============================================================================
-- 2. recipe_steps 테이블에 식약처 API 조리 방법 이미지 필드 추가
-- ============================================================================

ALTER TABLE public.recipe_steps
ADD COLUMN IF NOT EXISTS foodsafety_manual_img TEXT; -- 식약처 API 조리 방법 이미지 URL

-- 코멘트 추가
COMMENT ON COLUMN public.recipes.foodsafety_rcp_seq IS '식약처 레시피 순번 (RCP_SEQ)';
COMMENT ON COLUMN public.recipes.foodsafety_rcp_way2 IS '조리방법 (볶음, 끓이기 등)';
COMMENT ON COLUMN public.recipes.foodsafety_rcp_pat2 IS '요리종류 (밥, 국, 찌개 등)';
COMMENT ON COLUMN public.recipes.foodsafety_info_eng IS '칼로리 (kcal)';
COMMENT ON COLUMN public.recipes.foodsafety_info_car IS '탄수화물 (g)';
COMMENT ON COLUMN public.recipes.foodsafety_info_pro IS '단백질 (g)';
COMMENT ON COLUMN public.recipes.foodsafety_info_fat IS '지방 (g)';
COMMENT ON COLUMN public.recipes.foodsafety_info_na IS '나트륨 (mg)';
COMMENT ON COLUMN public.recipes.foodsafety_info_fiber IS '식이섬유 (g)';
COMMENT ON COLUMN public.recipes.foodsafety_rcp_parts_dtls IS '재료 정보 원본 텍스트';
COMMENT ON COLUMN public.recipes.foodsafety_att_file_no_main IS '대표 이미지 URL';
COMMENT ON COLUMN public.recipes.foodsafety_att_file_no_mk IS '만드는 법 이미지 URL';
COMMENT ON COLUMN public.recipe_steps.foodsafety_manual_img IS '식약처 API 조리 방법 이미지 URL';

