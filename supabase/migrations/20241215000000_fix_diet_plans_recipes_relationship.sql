-- diet_plans 테이블의 recipe_id 컬럼을 UUID로 정규화하고 관계를 명시적으로 설정
--
-- ⚠️ 주의(개발 환경):
-- - 이 프로젝트는 Clerk를 사용하며 JWT sub는 clerk_id(TEXT) 입니다.
-- - diet_plans.user_id는 users.id(UUID)이므로, auth.jwt()->>'sub' = user_id::text 기반 RLS 정책은
--   저장/조회가 막히는 원인이 됩니다.
-- - 개발 단계에서는 RLS를 활성화하지 않습니다. (별도 마이그레이션에서 DISABLE 처리 가능)

-- 1) recipe_id 컬럼 타입을 UUID로 정규화 (기존 데이터 중 UUID가 아닌 값은 NULL로 정리)
DO $$
BEGIN
  -- recipe_id가 text 계열로 존재할 때만 정리/변환 시도
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'recipe_id'
      AND data_type <> 'uuid'
  ) THEN
    -- UUID가 아닌 문자열은 변환 시 오류가 나므로, 먼저 NULL로 정리
    UPDATE public.diet_plans
    SET recipe_id = NULL
    WHERE recipe_id IS NOT NULL
      AND recipe_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    ALTER TABLE public.diet_plans
      ALTER COLUMN recipe_id TYPE uuid USING recipe_id::uuid;
  END IF;
END $$;

-- 2. 외래키 제약조건 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'diet_plans_recipe_id_fkey'
        AND table_name = 'diet_plans'
    ) THEN
        ALTER TABLE public.diet_plans
        ADD CONSTRAINT diet_plans_recipe_id_fkey
        FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
    END IF;
END $$;

-- recipe_id가 NULL이 아닌 경우에만 recipe_title을 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION update_recipe_title_from_id()
RETURNS TRIGGER AS $$
BEGIN
  -- recipe_id가 변경되었고 NULL이 아닌 경우
  IF NEW.recipe_id IS NOT NULL AND (OLD.recipe_id IS NULL OR OLD.recipe_id != NEW.recipe_id) THEN
    -- recipes 테이블에서 제목을 가져와서 업데이트
    SELECT title INTO NEW.recipe_title
    FROM public.recipes
    WHERE id = NEW.recipe_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_recipe_title ON public.diet_plans;
CREATE TRIGGER trigger_update_recipe_title
  BEFORE INSERT OR UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_title_from_id();

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diet_plans_recipe_id ON public.diet_plans(recipe_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_plan_date ON public.diet_plans(plan_date);

-- users 테이블에 clerk_id 인덱스 확인 및 추가
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);

-- 2) 개발 환경: RLS 비활성화 (저장/조회 막힘 방지)
ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;
