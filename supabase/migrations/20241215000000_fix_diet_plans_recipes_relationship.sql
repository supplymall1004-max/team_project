-- diet_plans 테이블의 recipe_id 컬럼 타입을 TEXT에서 UUID로 변경하고 외래키 제약조건 추가
-- 기존 데이터는 유지하면서 관계를 명시적으로 설정

-- 1. 기존 recipe_id 컬럼이 TEXT 타입이므로 UUID로 변경
-- NULL 값이 있는 경우를 고려하여 안전하게 타입 변경
ALTER TABLE diet_plans
ALTER COLUMN recipe_id TYPE UUID USING recipe_id::uuid;

-- 2. 외래키 제약조건 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'diet_plans_recipe_id_fkey'
        AND table_name = 'diet_plans'
    ) THEN
        ALTER TABLE diet_plans
        ADD CONSTRAINT diet_plans_recipe_id_fkey
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;
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
    FROM recipes
    WHERE id = NEW.recipe_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_recipe_title ON diet_plans;
CREATE TRIGGER trigger_update_recipe_title
  BEFORE INSERT OR UPDATE ON diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_title_from_id();

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diet_plans_recipe_id ON diet_plans(recipe_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_plan_date ON diet_plans(plan_date);

-- users 테이블에 clerk_id 인덱스 확인 및 추가
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- RLS 정책 확인
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Users can view their own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can insert their own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can update their own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can delete their own diet plans" ON diet_plans;

-- 새로운 RLS 정책 생성
CREATE POLICY "Users can view their own diet plans" ON diet_plans
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id::text);

CREATE POLICY "Users can insert their own diet plans" ON diet_plans
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id::text);

CREATE POLICY "Users can update their own diet plans" ON diet_plans
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id::text);

CREATE POLICY "Users can delete their own diet plans" ON diet_plans
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id::text);
