-- ============================================
-- 통합 마이그레이션 스크립트 (개발 환경용)
-- ============================================
-- 목적:
-- - 개발 환경에서 "한 번에" 핵심 스키마를 안전하게 구성
-- - 중복/레거시/검사용 SQL은 제외
-- - 저장/조회가 막히는 RLS/정책 문제를 방지 (개발 단계: RLS 비활성)
--
-- 포함 범위(최소 핵심):
-- 1) 건강정보 관리 시스템 강화(질병/알레르기/응급조치/칼로리 공식 + health profile 확장)
-- 2) 주간 식단 테이블(weekly_diet_plans / weekly_shopping_lists / weekly_nutrition_stats)
-- 3) 식단/주간식단 저장 보정(diet_plans 기본값/중복 인덱스 + RLS 비활성)
--
-- ⚠️ 주의:
-- - 이 파일은 "편의용" 통합 스크립트입니다.
-- - 실제 Supabase 마이그레이션은 개별 파일 체인을 권장합니다.
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '▶ apply_all_migrations.sql (dev) start';
END $$;

-- ============================================
-- 1) 건강정보 관리 시스템 강화 (2025-11-30)
-- ============================================

-- 1-1. 질병 마스터 테이블
CREATE TABLE IF NOT EXISTS public.diseases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  description TEXT,
  calorie_adjustment_factor DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1-2. 질병별 제외 음식(확장)
CREATE TABLE IF NOT EXISTS public.disease_excluded_foods_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_code VARCHAR(50) REFERENCES public.diseases(code) ON DELETE CASCADE,
  food_name VARCHAR(200) NOT NULL,
  food_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'high',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON public.disease_excluded_foods_extended(disease_code);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_type ON public.disease_excluded_foods_extended(food_type);

-- 2-1. 알레르기 마스터 테이블
CREATE TABLE IF NOT EXISTS public.allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  severity_level VARCHAR(20) DEFAULT 'high',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2-2. 알레르기 파생 재료
CREATE TABLE IF NOT EXISTS public.allergy_derived_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES public.allergies(code) ON DELETE CASCADE,
  ingredient_name VARCHAR(200) NOT NULL,
  ingredient_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allergy_derived_allergy ON public.allergy_derived_ingredients(allergy_code);
CREATE INDEX IF NOT EXISTS idx_allergy_derived_name ON public.allergy_derived_ingredients(ingredient_name);

-- 3. 응급조치 정보
CREATE TABLE IF NOT EXISTS public.emergency_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES public.allergies(code) ON DELETE CASCADE,
  procedure_type VARCHAR(50),
  title_ko VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  steps JSONB NOT NULL,
  warning_signs JSONB,
  when_to_call_911 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_procedures_allergy ON public.emergency_procedures(allergy_code);
CREATE INDEX IF NOT EXISTS idx_emergency_procedures_type ON public.emergency_procedures(procedure_type);

-- 4. 칼로리 계산 공식
CREATE TABLE IF NOT EXISTS public.calorie_calculation_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_name VARCHAR(100) UNIQUE NOT NULL,
  formula_type VARCHAR(50),
  gender VARCHAR(10),
  age_min INT,
  age_max INT,
  formula_expression TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulas_type ON public.calorie_calculation_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_gender ON public.calorie_calculation_formulas(gender);

-- 5. user_health_profiles 확장(존재할 때만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_health_profiles') THEN
    ALTER TABLE public.user_health_profiles
      ADD COLUMN IF NOT EXISTS diseases JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS preferred_ingredients JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS excluded_ingredients JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS calorie_calculation_method VARCHAR(50) DEFAULT 'auto',
      ADD COLUMN IF NOT EXISTS manual_target_calories INT,
      ADD COLUMN IF NOT EXISTS show_calculation_formula BOOLEAN DEFAULT false;

    CREATE INDEX IF NOT EXISTS idx_user_health_profiles_diseases ON public.user_health_profiles USING GIN (diseases);
    CREATE INDEX IF NOT EXISTS idx_user_health_profiles_allergies ON public.user_health_profiles USING GIN (allergies);
    CREATE INDEX IF NOT EXISTS idx_user_health_profiles_dietary_preferences ON public.user_health_profiles USING GIN (dietary_preferences);
  END IF;
END $$;

-- ============================================
-- 2) 주간 식단 테이블 (day_of_week: 0~6, dev: RLS 비활성)
-- ============================================

CREATE TABLE IF NOT EXISTS public.weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  is_family BOOLEAN DEFAULT false,
  total_recipes_count INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_id ON public.weekly_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_week_start_date ON public.weekly_diet_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week ON public.weekly_diet_plans(user_id, week_year, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_diet_plans_unique ON public.weekly_diet_plans(user_id, week_year, week_number);

CREATE TABLE IF NOT EXISTS public.weekly_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES public.weekly_diet_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  total_quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  recipes_using JSONB DEFAULT '[]'::jsonb,
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_plan_id ON public.weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_category ON public.weekly_shopping_lists(category);

CREATE TABLE IF NOT EXISTS public.weekly_nutrition_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES public.weekly_diet_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  date DATE NOT NULL,
  total_calories DECIMAL(10, 2),
  total_carbohydrates DECIMAL(10, 2),
  total_protein DECIMAL(10, 2),
  total_fat DECIMAL(10, 2),
  total_sodium DECIMAL(10, 2),
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_id ON public.weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_date ON public.weekly_nutrition_stats(date);

-- updated_at 트리거(재실행 안전)
CREATE OR REPLACE FUNCTION public.update_weekly_diet_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_weekly_diet_plans_updated_at ON public.weekly_diet_plans;
CREATE TRIGGER trigger_update_weekly_diet_plans_updated_at
  BEFORE UPDATE ON public.weekly_diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_diet_plans_updated_at();

ALTER TABLE public.weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3) 식단/주간식단 저장 보정 (2025-12-17)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='diet_plans') THEN
    ALTER TABLE public.diet_plans
      ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb;

    ALTER TABLE public.diet_plans
      ALTER COLUMN composition_summary SET DEFAULT '[]'::jsonb;

    ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;

    -- 과거 정책이 남아있으면 제거(없어도 무시)
    IF EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'diet_plans'
    ) THEN
      EXECUTE 'DROP POLICY IF EXISTS "Users can view their own diet plans" ON public.diet_plans';
      EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own diet plans" ON public.diet_plans';
      EXECUTE 'DROP POLICY IF EXISTS "Users can update their own diet plans" ON public.diet_plans';
      EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own diet plans" ON public.diet_plans';
      EXECUTE 'DROP POLICY IF EXISTS "Service role can do anything" ON public.diet_plans';
    END IF;

    -- 저장 중복 방지 인덱스
    CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_user_date_meal_unique
      ON public.diet_plans(user_id, plan_date, meal_type)
      WHERE family_member_id IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_member_date_meal_unique
      ON public.diet_plans(user_id, family_member_id, plan_date, meal_type)
      WHERE family_member_id IS NOT NULL;

    GRANT ALL ON TABLE public.diet_plans TO anon, authenticated, service_role;
  END IF;

  -- 주간 테이블도 개발 환경 RLS 비활성(존재할 때만)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_diet_plans') THEN
    ALTER TABLE public.weekly_diet_plans DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_shopping_lists') THEN
    ALTER TABLE public.weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_nutrition_stats') THEN
    ALTER TABLE public.weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ apply_all_migrations.sql (dev) done';
END $$;
