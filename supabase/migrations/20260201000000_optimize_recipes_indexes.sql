-- 레시피 조회 성능 최적화를 위한 인덱스 추가
-- 이 마이그레이션은 recipes 테이블의 쿼리 성능을 향상시킵니다.

-- 1. title 컬럼에 GIN 인덱스 추가 (ILIKE 검색 최적화)
-- PostgreSQL의 pg_trgm 확장을 사용하여 한글 텍스트 검색 최적화
DO $$
BEGIN
  -- pg_trgm 확장이 없으면 생성
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    RAISE NOTICE '✅ pg_trgm 확장 생성 완료';
  ELSE
    RAISE NOTICE 'ℹ️ pg_trgm 확장이 이미 존재합니다';
  END IF;

  -- title에 대한 GIN 인덱스 생성 (ILIKE 검색 최적화)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_title_gin'
  ) THEN
    CREATE INDEX idx_recipes_title_gin
      ON public.recipes
      USING gin(title gin_trgm_ops);
    
    RAISE NOTICE '✅ title GIN 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ idx_recipes_title_gin 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 2. foodsafety_rcp_seq 인덱스 확인 및 추가 (이미 있을 수 있음)
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
    RAISE NOTICE 'ℹ️ idx_recipes_foodsafety_rcp_seq 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 3. 복합 인덱스 추가 (created_at + title 조합 조회 최적화)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_created_at_title'
  ) THEN
    CREATE INDEX idx_recipes_created_at_title
      ON public.recipes(created_at DESC, title);
    
    RAISE NOTICE '✅ created_at + title 복합 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ idx_recipes_created_at_title 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 4. calories 인덱스 추가 (칼로리 범위 검색 최적화)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_calories'
  ) THEN
    CREATE INDEX idx_recipes_calories
      ON public.recipes(calories)
      WHERE calories IS NOT NULL;
    
    RAISE NOTICE '✅ calories 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ idx_recipes_calories 인덱스가 이미 존재합니다';
  END IF;
END $$;

-- 5. 기존 인덱스 확인 (없으면 추가)
DO $$
BEGIN
  -- title 인덱스 (일반 B-tree, GIN과 별도)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_title'
  ) THEN
    CREATE INDEX idx_recipes_title
      ON public.recipes(title);
    
    RAISE NOTICE '✅ title B-tree 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ idx_recipes_title 인덱스가 이미 존재합니다';
  END IF;

  -- created_at 인덱스
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND indexname = 'idx_recipes_created_at'
  ) THEN
    CREATE INDEX idx_recipes_created_at
      ON public.recipes(created_at DESC);
    
    RAISE NOTICE '✅ created_at 인덱스 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️ idx_recipes_created_at 인덱스가 이미 존재합니다';
  END IF;
END $$;

