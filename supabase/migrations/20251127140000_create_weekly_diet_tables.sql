-- 주간 식단 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- 주간 식단 메타데이터 테이블
CREATE TABLE IF NOT EXISTS weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- 주차 시작일 (월요일)
  week_year INTEGER NOT NULL, -- 연도
  week_number INTEGER NOT NULL, -- 주차 번호 (1-53)
  is_family BOOLEAN DEFAULT false, -- 가족 식단 여부
  total_recipes_count INTEGER DEFAULT 0, -- 총 레시피 수
  generation_duration_ms INTEGER, -- 생성 소요 시간
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_week_start_date ON weekly_diet_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week ON weekly_diet_plans(user_id, week_year, week_number);

-- 유니크 제약조건 (사용자별 주차 식단은 하나만)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_diet_plans_unique 
  ON weekly_diet_plans(user_id, week_year, week_number);

-- 주간 장보기 리스트 테이블
CREATE TABLE IF NOT EXISTS weekly_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  total_quantity DECIMAL(10, 2), -- 총 필요량
  unit TEXT, -- 단위 (g, ml, 개 등)
  category TEXT, -- 재료 카테고리 (채소, 육류, 곡물 등)
  recipes_using JSONB DEFAULT '[]'::jsonb, -- 사용하는 레시피 ID 배열
  is_purchased BOOLEAN DEFAULT false, -- 구매 완료 여부
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_plan_id ON weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_category ON weekly_shopping_lists(category);

-- 주간 영양 통계 테이블
CREATE TABLE IF NOT EXISTS weekly_nutrition_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 요일 (1=월요일, 7=일요일)
  date DATE NOT NULL,
  total_calories DECIMAL(10, 2),
  total_carbohydrates DECIMAL(10, 2),
  total_protein DECIMAL(10, 2),
  total_fat DECIMAL(10, 2),
  total_sodium DECIMAL(10, 2),
  meal_count INTEGER DEFAULT 0, -- 식사 수
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_date ON weekly_nutrition_stats(date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_weekly_diet_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_weekly_diet_plans_updated_at
  BEFORE UPDATE ON weekly_diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_diet_plans_updated_at();

-- RLS 비활성화 (개발 환경)
ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 (7일치 식단 정보)';
COMMENT ON TABLE weekly_shopping_lists IS '주간 장보기 리스트 (식단 기반 재료 통합)';
COMMENT ON TABLE weekly_nutrition_stats IS '주간 영양 통계 (일별 영양소 합계)';

COMMENT ON COLUMN weekly_diet_plans.week_start_date IS '주차 시작일 (항상 월요일)';
COMMENT ON COLUMN weekly_diet_plans.week_number IS 'ISO 8601 주차 번호 (1-53)';
COMMENT ON COLUMN weekly_shopping_lists.recipes_using IS '해당 재료를 사용하는 레시피 ID 목록';
COMMENT ON COLUMN weekly_nutrition_stats.day_of_week IS '1=월요일, 7=일요일';




















