-- ============================================================================
-- 통합 마이그레이션 04: 식단 관련 테이블
-- ============================================================================
-- 작성일: 2025-12-02
-- 설명: 식단 계획, 주간 식단, 알림 설정 등 식단 관리 시스템
-- ============================================================================

-- ============================================================================
-- 1. 식단 계획 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK 
    (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id TEXT,
  recipe_title TEXT NOT NULL,
  recipe_description TEXT,
  ingredients JSONB,
  instructions TEXT,
  calories INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  sodium_mg INTEGER,
  fiber_g DECIMAL(5,2),
  composition_summary JSONB,
  is_unified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_family_member_id ON public.diet_plans(family_member_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_plan_date ON public.diet_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_date ON public.diet_plans(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_diet_plans_is_unified ON public.diet_plans(is_unified);
CREATE INDEX IF NOT EXISTS idx_diet_plans_composition_summary ON public.diet_plans USING GIN(composition_summary);

ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.diet_plans TO anon, authenticated, service_role;

-- ============================================================================
-- 2. 주간 식단 메타데이터 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  is_family BOOLEAN DEFAULT false,
  total_recipes_count INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_week_start_date ON weekly_diet_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week ON weekly_diet_plans(user_id, week_year, week_number);

DROP TRIGGER IF EXISTS trigger_update_weekly_diet_plans_updated_at ON weekly_diet_plans;
CREATE TRIGGER trigger_update_weekly_diet_plans_updated_at
  BEFORE UPDATE ON weekly_diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE weekly_diet_plans TO anon, authenticated, service_role;

-- ============================================================================
-- 3. 주간 장보기 리스트 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  total_quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  recipes_using JSONB DEFAULT '[]'::jsonb,
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_plan_id ON weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_category ON weekly_shopping_lists(category);

ALTER TABLE weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE weekly_shopping_lists TO anon, authenticated, service_role;

-- ============================================================================
-- 4. 주간 영양 통계 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_nutrition_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  date DATE NOT NULL,
  total_calories DECIMAL(10, 2),
  total_carbohydrates DECIMAL(10, 2),
  total_protein DECIMAL(10, 2),
  total_fat DECIMAL(10, 2),
  total_sodium DECIMAL(10, 2),
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_date ON weekly_nutrition_stats(date);

ALTER TABLE weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE weekly_nutrition_stats TO anon, authenticated, service_role;

-- ============================================================================
-- 5. 식단 알림 설정 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diet_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  popup_enabled BOOLEAN DEFAULT true NOT NULL,
  browser_enabled BOOLEAN DEFAULT false,
  notification_time TIME DEFAULT '05:00:00',
  kcdc_enabled BOOLEAN DEFAULT true NOT NULL,
  last_notification_date DATE,
  last_dismissed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_notification_settings_user_id ON public.diet_notification_settings(user_id);

DROP TRIGGER IF EXISTS update_diet_notification_settings_updated_at ON public.diet_notification_settings;
CREATE TRIGGER update_diet_notification_settings_updated_at
  BEFORE UPDATE ON public.diet_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.diet_notification_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.diet_notification_settings TO anon, authenticated, service_role;

COMMENT ON COLUMN public.diet_notification_settings.kcdc_enabled IS 'KCDC 질병청 알림 활성화 여부';

-- ============================================================================
-- 코멘트 추가
-- ============================================================================
COMMENT ON TABLE public.diet_plans IS '식단 계획 (개인별 + 통합)';
COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 (7일치 식단 정보)';
COMMENT ON TABLE weekly_shopping_lists IS '주간 장보기 리스트';
COMMENT ON TABLE weekly_nutrition_stats IS '주간 영양 통계 (일별 영양소 합계)';
COMMENT ON TABLE public.diet_notification_settings IS '식단 알림 설정';

