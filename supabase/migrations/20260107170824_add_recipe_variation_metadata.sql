-- ============================================================================
-- 레시피 변형 시스템을 위한 메타데이터 스키마 확장
-- ============================================================================
-- 
-- 목적:
-- 1. recipes 테이블에 변형 관련 메타데이터 컬럼 추가
-- 2. recipe_variation_groups 테이블 생성
-- 3. 변형 레시피 탐색을 위한 인덱스 추가
--
-- 영향 범위:
-- - recipes 테이블: 메타데이터 컬럼 추가 (기존 데이터 유지)
-- - recipe_variation_groups 테이블: 신규 생성
-- - 인덱스: 메인 재료, 영양소 강점, 변형 그룹 조회 최적화
-- ============================================================================

-- 1. recipes 테이블에 메타데이터 컬럼 추가
DO $$
BEGIN
  -- main_ingredients: 메인 재료 목록 (TEXT 배열)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'main_ingredients'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN main_ingredients TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    COMMENT ON COLUMN public.recipes.main_ingredients IS '메인 재료 목록 (예: ["닭고기", "양파"])';
    RAISE NOTICE '✅ main_ingredients 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ main_ingredients 컬럼이 이미 존재합니다';
  END IF;

  -- cooking_method: 조리법 (볶음, 조림, 구이 등)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'cooking_method'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN cooking_method TEXT NULL;
    
    COMMENT ON COLUMN public.recipes.cooking_method IS '조리법 (볶음, 조림, 구이, 찜, 튀김 등)';
    RAISE NOTICE '✅ cooking_method 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ cooking_method 컬럼이 이미 존재합니다';
  END IF;

  -- variation_group_id: 변형 그룹 ID (같은 메인 재료의 변형 레시피 그룹)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'variation_group_id'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN variation_group_id UUID NULL;
    
    COMMENT ON COLUMN public.recipes.variation_group_id IS '변형 그룹 ID (같은 메인 재료의 변형 레시피 그룹)';
    RAISE NOTICE '✅ variation_group_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ variation_group_id 컬럼이 이미 존재합니다';
  END IF;

  -- nutrition_focus: 영양소 강점 (단백질, 칼슘, 철분 등)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'nutrition_focus'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN nutrition_focus TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    COMMENT ON COLUMN public.recipes.nutrition_focus IS '영양소 강점 (예: ["단백질", "칼슘", "철분"])';
    RAISE NOTICE '✅ nutrition_focus 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ nutrition_focus 컬럼이 이미 존재합니다';
  END IF;

  -- age_group_suitable: 적합 연령대
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'age_group_suitable'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN age_group_suitable TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    COMMENT ON COLUMN public.recipes.age_group_suitable IS '적합 연령대 (예: ["청소년", "성인", "어린이"])';
    RAISE NOTICE '✅ age_group_suitable 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ age_group_suitable 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 2. recipe_variation_groups 테이블 생성
CREATE TABLE IF NOT EXISTS public.recipe_variation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_ingredient TEXT NOT NULL,
  base_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  variation_type TEXT NOT NULL CHECK (variation_type IN ('cooking_method', 'seasoning', 'combination')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.recipe_variation_groups IS '레시피 변형 그룹 (같은 메인 재료의 변형 레시피 그룹)';
COMMENT ON COLUMN public.recipe_variation_groups.main_ingredient IS '메인 재료 (예: "닭고기", "돼지고기")';
COMMENT ON COLUMN public.recipe_variation_groups.base_recipe_id IS '기본 레시피 ID (변형의 기준이 되는 레시피)';
COMMENT ON COLUMN public.recipe_variation_groups.variation_type IS '변형 타입 (cooking_method: 조리법, seasoning: 양념, combination: 조합)';

-- 3. 인덱스 생성
-- main_ingredients 배열 인덱스 (GIN 인덱스로 배열 검색 최적화)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_main_ingredients'
  ) THEN
    CREATE INDEX idx_recipes_main_ingredients
      ON public.recipes USING GIN(main_ingredients)
      WHERE main_ingredients IS NOT NULL AND array_length(main_ingredients, 1) > 0;
    
    RAISE NOTICE '✅ main_ingredients GIN 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ main_ingredients 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- cooking_method 인덱스
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_cooking_method'
  ) THEN
    CREATE INDEX idx_recipes_cooking_method
      ON public.recipes(cooking_method)
      WHERE cooking_method IS NOT NULL;
    
    RAISE NOTICE '✅ cooking_method 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ cooking_method 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- variation_group_id 인덱스
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_variation_group_id'
  ) THEN
    CREATE INDEX idx_recipes_variation_group_id
      ON public.recipes(variation_group_id)
      WHERE variation_group_id IS NOT NULL;
    
    RAISE NOTICE '✅ variation_group_id 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ variation_group_id 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- nutrition_focus 배열 인덱스 (GIN 인덱스)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_nutrition_focus'
  ) THEN
    CREATE INDEX idx_recipes_nutrition_focus
      ON public.recipes USING GIN(nutrition_focus)
      WHERE nutrition_focus IS NOT NULL AND array_length(nutrition_focus, 1) > 0;
    
    RAISE NOTICE '✅ nutrition_focus GIN 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ nutrition_focus 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- recipe_variation_groups 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_recipe_variation_groups_main_ingredient
  ON public.recipe_variation_groups(main_ingredient);

CREATE INDEX IF NOT EXISTS idx_recipe_variation_groups_base_recipe_id
  ON public.recipe_variation_groups(base_recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_variation_groups_variation_type
  ON public.recipe_variation_groups(variation_type);

-- 4. 외래키 관계 설정 (variation_group_id → recipe_variation_groups.id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'recipes'
      AND constraint_name = 'fk_recipes_variation_group_id'
  ) THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT fk_recipes_variation_group_id
      FOREIGN KEY (variation_group_id)
      REFERENCES public.recipe_variation_groups(id)
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ variation_group_id 외래키 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ variation_group_id 외래키가 이미 존재합니다';
  END IF;
END $$;

-- 5. RLS 비활성화 (개발 환경)
ALTER TABLE public.recipe_variation_groups DISABLE ROW LEVEL SECURITY;

-- 6. 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '레시피 변형 시스템 메타데이터 스키마 확장 완료';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '추가된 컬럼 (recipes 테이블):';
  RAISE NOTICE '  - main_ingredients (TEXT[], 메인 재료 목록)';
  RAISE NOTICE '  - cooking_method (TEXT, 조리법)';
  RAISE NOTICE '  - variation_group_id (UUID, 변형 그룹 ID)';
  RAISE NOTICE '  - nutrition_focus (TEXT[], 영양소 강점)';
  RAISE NOTICE '  - age_group_suitable (TEXT[], 적합 연령대)';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - recipe_variation_groups (변형 그룹 테이블)';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 인덱스:';
  RAISE NOTICE '  - idx_recipes_main_ingredients (GIN)';
  RAISE NOTICE '  - idx_recipes_cooking_method';
  RAISE NOTICE '  - idx_recipes_variation_group_id';
  RAISE NOTICE '  - idx_recipes_nutrition_focus (GIN)';
  RAISE NOTICE '  - idx_recipe_variation_groups_main_ingredient';
  RAISE NOTICE '  - idx_recipe_variation_groups_base_recipe_id';
  RAISE NOTICE '  - idx_recipe_variation_groups_variation_type';
  RAISE NOTICE '============================================================================';
END $$;

