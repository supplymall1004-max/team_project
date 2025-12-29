-- ============================================================================
-- 정적 파일 기반 식약처 레시피 시스템 지원 마이그레이션
-- ============================================================================
-- 
-- 목적:
-- 1. recipes 테이블에 정적 파일 경로 저장 컬럼 추가
-- 2. 정적 파일 기반 레시피 조회를 위한 인덱스 추가
-- 3. 기존 데이터베이스 관계 유지 (하위 호환성)
--
-- 영향 범위:
-- - recipes 테이블: static_file_path 컬럼 추가
-- - 인덱스: foodsafety_rcp_seq 인덱스 추가 (없는 경우)
-- - 관계성: 기존 외래키 관계 유지 (diet_plans.recipe_id → recipes.id)
-- ============================================================================

-- 1. recipes 테이블에 정적 파일 경로 컬럼 추가
DO $$
BEGIN
  -- static_file_path 컬럼 추가 (없는 경우만)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'static_file_path'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN static_file_path TEXT NULL
      COMMENT ON COLUMN public.recipes.static_file_path IS '정적 파일 경로 (마크다운 파일 경로, 예: docs/mfds-recipes/recipes/{RCP_SEQ}.md)';
    
    RAISE NOTICE '✅ static_file_path 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ static_file_path 컬럼이 이미 존재합니다';
  END IF;

  -- static_file_updated_at 컬럼 추가 (선택적, 파일 업데이트 시간 추적)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'static_file_updated_at'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN static_file_updated_at TIMESTAMPTZ NULL
      COMMENT ON COLUMN public.recipes.static_file_updated_at IS '정적 파일 마지막 업데이트 시간';
    
    RAISE NOTICE '✅ static_file_updated_at 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ static_file_updated_at 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 2. foodsafety_rcp_seq 인덱스 추가 (없는 경우만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_foodsafety_rcp_seq'
  ) THEN
    CREATE INDEX idx_recipes_foodsafety_rcp_seq
      ON public.recipes(foodsafety_rcp_seq)
      WHERE foodsafety_rcp_seq IS NOT NULL;
    
    RAISE NOTICE '✅ foodsafety_rcp_seq 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ foodsafety_rcp_seq 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 3. static_file_path 인덱스 추가 (빠른 조회를 위해)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_static_file_path'
  ) THEN
    CREATE INDEX idx_recipes_static_file_path
      ON public.recipes(static_file_path)
      WHERE static_file_path IS NOT NULL;
    
    RAISE NOTICE '✅ static_file_path 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ static_file_path 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 4. 복합 인덱스 추가 (foodsafety_rcp_seq와 static_file_path 조합 조회 최적화)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_foodsafety_static'
  ) THEN
    CREATE INDEX idx_recipes_foodsafety_static
      ON public.recipes(foodsafety_rcp_seq, static_file_path)
      WHERE foodsafety_rcp_seq IS NOT NULL;
    
    RAISE NOTICE '✅ foodsafety_rcp_seq + static_file_path 복합 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ foodsafety_rcp_seq + static_file_path 복합 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 5. 기존 외래키 관계 확인 및 유지
-- diet_plans.recipe_id → recipes.id 관계는 이미 존재하므로 유지
-- 추가 작업 불필요

-- 6. 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '정적 파일 기반 식약처 레시피 시스템 지원 마이그레이션 완료';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '  - recipes.static_file_path (TEXT, NULL 가능)';
  RAISE NOTICE '  - recipes.static_file_updated_at (TIMESTAMPTZ, NULL 가능)';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 인덱스:';
  RAISE NOTICE '  - idx_recipes_foodsafety_rcp_seq';
  RAISE NOTICE '  - idx_recipes_static_file_path';
  RAISE NOTICE '  - idx_recipes_foodsafety_static (복합 인덱스)';
  RAISE NOTICE '';
  RAISE NOTICE '유지된 관계:';
  RAISE NOTICE '  - diet_plans.recipe_id → recipes.id (외래키)';
  RAISE NOTICE '============================================================================';
END $$;

