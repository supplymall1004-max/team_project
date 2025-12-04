-- ============================================================================
-- 통합 마이그레이션 03: 건강 관련 테이블
-- ============================================================================
-- 작성일: 2025-12-02
-- 설명: 사용자 건강 프로필, 가족 구성원, 질병, 알레르기 등 건강 관리 시스템
-- ============================================================================

-- ============================================================================
-- 1. 사용자 건강 프로필 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferred_ingredients TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  excluded_ingredients JSONB DEFAULT '[]',
  daily_calorie_goal INTEGER,
  dietary_preferences TEXT[] DEFAULT '{}',
  premium_features TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN 
    ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  -- 건강 시스템 강화 컬럼들
  diseases_jsonb JSONB DEFAULT '[]',
  allergies_jsonb JSONB DEFAULT '[]',
  preferred_ingredients_jsonb JSONB DEFAULT '[]',
  dietary_preferences_jsonb JSONB DEFAULT '[]',
  calorie_calculation_method VARCHAR(50) DEFAULT 'auto',
  manual_target_calories INT,
  show_calculation_formula BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id ON public.user_health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_diseases ON public.user_health_profiles USING GIN (diseases_jsonb);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_allergies ON public.user_health_profiles USING GIN (allergies_jsonb);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_dietary_preferences ON public.user_health_profiles USING GIN (dietary_preferences_jsonb);

DROP TRIGGER IF EXISTS update_user_health_profiles_updated_at ON public.user_health_profiles;
CREATE TRIGGER update_user_health_profiles_updated_at
  BEFORE UPDATE ON public.user_health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.user_health_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.user_health_profiles TO anon, authenticated, service_role;

-- ============================================================================
-- 2. 가족 구성원 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relationship TEXT NOT NULL,
  diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN
    ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_preferences TEXT[] DEFAULT '{}',
  include_in_unified_diet BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_birth_date ON public.family_members(birth_date);
CREATE INDEX IF NOT EXISTS idx_family_members_include_in_unified_diet ON public.family_members(include_in_unified_diet);

DROP TRIGGER IF EXISTS update_family_members_updated_at ON public.family_members;
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.family_members TO anon, authenticated, service_role;

-- 가족 구성원 최대 10명 제한 함수
CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  max_members INTEGER := 10;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.family_members
  WHERE user_id = NEW.user_id;
  
  IF member_count >= max_members THEN
    RAISE EXCEPTION '가족 구성원은 최대 %명까지 추가할 수 있습니다. (현재: %명)', max_members, member_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_family_member_limit_trigger ON public.family_members;
CREATE TRIGGER check_family_member_limit_trigger
  BEFORE INSERT ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION check_family_member_limit();

-- ============================================================================
-- 3. 질병 마스터 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  description TEXT,
  calorie_adjustment_factor DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diseases_code ON diseases(code);
CREATE INDEX IF NOT EXISTS idx_diseases_category ON diseases(category);

DROP TRIGGER IF EXISTS update_diseases_updated_at ON diseases;
CREATE TRIGGER update_diseases_updated_at
  BEFORE UPDATE ON diseases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE diseases DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE diseases TO anon, authenticated, service_role;

-- ============================================================================
-- 4. 질병별 제외 음식 테이블 (통합 버전)
-- ============================================================================
CREATE TABLE IF NOT EXISTS disease_excluded_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT NOT NULL,
  excluded_food_name TEXT NOT NULL,
  excluded_food_type TEXT NOT NULL CHECK 
    (excluded_food_type IN ('ingredient', 'recipe_keyword')),
  reason TEXT,
  severity TEXT DEFAULT 'high' CHECK 
    (severity IN ('low', 'medium', 'high', 'critical', 'moderate', 'severe', 'mild')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(disease, excluded_food_name)
);

CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON disease_excluded_foods(disease);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_food_name ON disease_excluded_foods(excluded_food_name);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_type ON disease_excluded_foods(excluded_food_type);

DROP TRIGGER IF EXISTS update_disease_excluded_foods_updated_at ON disease_excluded_foods;
CREATE TRIGGER update_disease_excluded_foods_updated_at
  BEFORE UPDATE ON disease_excluded_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE disease_excluded_foods DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE disease_excluded_foods TO anon, authenticated, service_role;

-- 질병별 제외 음식 확장 테이블 (새로운 구조)
CREATE TABLE IF NOT EXISTS disease_excluded_foods_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_code VARCHAR(50) REFERENCES diseases(code) ON DELETE CASCADE,
  food_name VARCHAR(200) NOT NULL,
  food_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'high',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_extended_disease ON disease_excluded_foods_extended(disease_code);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_extended_type ON disease_excluded_foods_extended(food_type);

ALTER TABLE disease_excluded_foods_extended DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE disease_excluded_foods_extended TO anon, authenticated, service_role;

-- ============================================================================
-- 5. 알레르기 마스터 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  severity_level VARCHAR(20) DEFAULT 'high',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allergies_code ON allergies(code);
CREATE INDEX IF NOT EXISTS idx_allergies_category ON allergies(category);

DROP TRIGGER IF EXISTS update_allergies_updated_at ON allergies;
CREATE TRIGGER update_allergies_updated_at
  BEFORE UPDATE ON allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE allergies DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE allergies TO anon, authenticated, service_role;

-- ============================================================================
-- 6. 알레르기 파생 재료 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS allergy_derived_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  ingredient_name VARCHAR(200) NOT NULL,
  ingredient_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allergy_derived_allergy ON allergy_derived_ingredients(allergy_code);
CREATE INDEX IF NOT EXISTS idx_allergy_derived_name ON allergy_derived_ingredients(ingredient_name);

ALTER TABLE allergy_derived_ingredients DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE allergy_derived_ingredients TO anon, authenticated, service_role;

-- ============================================================================
-- 7. 응급조치 정보 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS emergency_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  procedure_type VARCHAR(50),
  title_ko VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  steps JSONB NOT NULL,
  warning_signs JSONB,
  when_to_call_911 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_procedures_allergy ON emergency_procedures(allergy_code);
CREATE INDEX IF NOT EXISTS idx_emergency_procedures_type ON emergency_procedures(procedure_type);

DROP TRIGGER IF EXISTS update_emergency_procedures_updated_at ON emergency_procedures;
CREATE TRIGGER update_emergency_procedures_updated_at
  BEFORE UPDATE ON emergency_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE emergency_procedures DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE emergency_procedures TO anon, authenticated, service_role;

-- ============================================================================
-- 8. 칼로리 계산 공식 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS calorie_calculation_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_name VARCHAR(100) UNIQUE NOT NULL,
  formula_type VARCHAR(50),
  gender VARCHAR(10),
  age_min INT,
  age_max INT,
  formula_expression TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulas_type ON calorie_calculation_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_gender ON calorie_calculation_formulas(gender);

DROP TRIGGER IF EXISTS update_calorie_calculation_formulas_updated_at ON calorie_calculation_formulas;
CREATE TRIGGER update_calorie_calculation_formulas_updated_at
  BEFORE UPDATE ON calorie_calculation_formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE calorie_calculation_formulas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE calorie_calculation_formulas TO anon, authenticated, service_role;

-- ============================================================================
-- 코멘트 추가
-- ============================================================================
COMMENT ON TABLE public.user_health_profiles IS '사용자 건강 프로필';
COMMENT ON TABLE public.family_members IS '가족 구성원 정보';
COMMENT ON TABLE diseases IS '질병 마스터 데이터';
COMMENT ON TABLE disease_excluded_foods IS '질병별 제외 음식 목록 (레거시)';
COMMENT ON TABLE disease_excluded_foods_extended IS '질병별 제외 음식 목록 (확장)';
COMMENT ON TABLE allergies IS '알레르기 마스터 데이터';
COMMENT ON TABLE allergy_derived_ingredients IS '알레르기 파생 재료';
COMMENT ON TABLE emergency_procedures IS '알레르기 응급조치 정보';
COMMENT ON TABLE calorie_calculation_formulas IS '칼로리 계산 공식';

