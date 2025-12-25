-- ============================================================================
-- 데이터베이스 관계성 개선 마이그레이션
-- 작성일: 2025-01-29
-- 목적: 누락된 외래 키 관계 추가 및 기존 관계 개선
-- ============================================================================

-- ============================================================================
-- 1. diet_plans에 weekly_diet_plan_id 컬럼 추가 및 외래 키 설정
-- ============================================================================

-- 1-1. weekly_diet_plan_id 컬럼 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'weekly_diet_plan_id'
  ) THEN
    ALTER TABLE public.diet_plans
    ADD COLUMN weekly_diet_plan_id UUID;
    
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 1-2. 외래 키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'diet_plans_weekly_diet_plan_id_fkey'
    AND conrelid = 'diet_plans'::regclass
  ) THEN
    ALTER TABLE public.diet_plans
    ADD CONSTRAINT diet_plans_weekly_diet_plan_id_fkey
    FOREIGN KEY (weekly_diet_plan_id) REFERENCES public.weekly_diet_plans(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 외래 키 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 외래 키 제약조건이 이미 존재합니다';
  END IF;
END $$;

-- 1-3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diet_plans_weekly_diet_plan_id 
ON public.diet_plans(weekly_diet_plan_id) 
WHERE weekly_diet_plan_id IS NOT NULL;

-- ============================================================================
-- 2. favorite_meals에 recipe_id 외래 키 제약조건 추가
-- ============================================================================

DO $$
BEGIN
  -- recipe_id 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'favorite_meals'
      AND column_name = 'recipe_id'
  ) THEN
    -- 외래 키 제약조건 추가
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'favorite_meals_recipe_id_fkey'
      AND conrelid = 'favorite_meals'::regclass
    ) THEN
      ALTER TABLE public.favorite_meals
      ADD CONSTRAINT favorite_meals_recipe_id_fkey
      FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'favorite_meals.recipe_id 외래 키 제약조건 추가 완료';
    ELSE
      RAISE NOTICE 'favorite_meals.recipe_id 외래 키 제약조건이 이미 존재합니다';
    END IF;
  ELSE
    RAISE NOTICE 'favorite_meals.recipe_id 컬럼이 존재하지 않습니다';
  END IF;
END $$;

-- ============================================================================
-- 3. recipe_usage_history에 recipe_id 컬럼 추가 및 외래 키 설정
-- ============================================================================

-- 3-1. recipe_id 컬럼 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipe_usage_history'
      AND column_name = 'recipe_id'
  ) THEN
    ALTER TABLE public.recipe_usage_history
    ADD COLUMN recipe_id UUID;
    
    RAISE NOTICE 'recipe_usage_history.recipe_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'recipe_usage_history.recipe_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 3-2. 외래 키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_usage_history_recipe_id_fkey'
    AND conrelid = 'recipe_usage_history'::regclass
  ) THEN
    ALTER TABLE public.recipe_usage_history
    ADD CONSTRAINT recipe_usage_history_recipe_id_fkey
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'recipe_usage_history.recipe_id 외래 키 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'recipe_usage_history.recipe_id 외래 키 제약조건이 이미 존재합니다';
  END IF;
END $$;

-- 3-3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_recipe_usage_history_recipe_id 
ON public.recipe_usage_history(recipe_id) 
WHERE recipe_id IS NOT NULL;

-- ============================================================================
-- 4. meal_kits에 created_by 외래 키 제약조건 추가
-- ============================================================================

DO $$
BEGIN
  -- created_by 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meal_kits'
      AND column_name = 'created_by'
  ) THEN
    -- 외래 키 제약조건 추가
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'meal_kits_created_by_fkey'
      AND conrelid = 'meal_kits'::regclass
    ) THEN
      ALTER TABLE public.meal_kits
      ADD CONSTRAINT meal_kits_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'meal_kits.created_by 외래 키 제약조건 추가 완료';
    ELSE
      RAISE NOTICE 'meal_kits.created_by 외래 키 제약조건이 이미 존재합니다';
    END IF;
  ELSE
    RAISE NOTICE 'meal_kits.created_by 컬럼이 존재하지 않습니다';
  END IF;
END $$;

-- ============================================================================
-- 5. 코멘트 추가 (관계 설명)
-- ============================================================================

COMMENT ON COLUMN diet_plans.weekly_diet_plan_id IS 
'주간 식단 계획 ID (선택적). 주간 식단 생성 시 일일 식단들을 그룹화하는 데 사용됩니다. 주간 식단 삭제 시 NULL로 설정됩니다.';

COMMENT ON COLUMN recipe_usage_history.recipe_id IS 
'레시피 ID (선택적). 레시피 제목 대신 레시피 ID로 직접 참조할 수 있습니다. 레시피 삭제 시 NULL로 설정됩니다.';

COMMENT ON CONSTRAINT favorite_meals_recipe_id_fkey ON favorite_meals IS 
'즐겨찾기한 레시피 참조. 레시피 삭제 시 즐겨찾기도 함께 삭제됩니다 (CASCADE).';

COMMENT ON CONSTRAINT meal_kits_created_by_fkey ON meal_kits IS 
'밀키트 생성자 참조. 관리자가 생성한 밀키트를 추적할 수 있습니다. 사용자 삭제 시 NULL로 설정됩니다 (SET NULL).';

-- ============================================================================
-- 6. 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- ============================================================================

-- 모든 외래 키 제약조건 확인
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('diet_plans', 'favorite_meals', 'recipe_usage_history', 'meal_kits')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================

