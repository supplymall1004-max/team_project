-- ============================================================================
-- 건강정보 관리 시스템 대폭 강화 마이그레이션
-- 작성일: 2025-11-30
-- 설명: 질병, 알레르기, 칼로리 계산, 응급조치 정보 등 종합 건강 관리 시스템
-- ============================================================================

-- ============================================================================
-- 1. 질병 관리 테이블
-- ============================================================================

-- 질병 마스터 테이블
CREATE TABLE IF NOT EXISTS diseases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),  -- 'metabolic', 'cardiovascular', 'digestive', 'kidney', 'gout', 'maternity'
  description TEXT,
  calorie_adjustment_factor DECIMAL(3,2) DEFAULT 1.00,  -- 칼로리 조정 계수 (예: 0.85 = 15% 감량)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 질병별 제외 음식 (확장)
CREATE TABLE IF NOT EXISTS disease_excluded_foods_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_code VARCHAR(50) REFERENCES diseases(code) ON DELETE CASCADE,
  food_name VARCHAR(200) NOT NULL,
  food_type VARCHAR(50),  -- 'ingredient', 'recipe_keyword', 'cooking_method', 'category'
  severity VARCHAR(20) DEFAULT 'high',  -- 'critical', 'high', 'moderate'
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON disease_excluded_foods_extended(disease_code);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_type ON disease_excluded_foods_extended(food_type);

-- ============================================================================
-- 2. 알레르기 관리 테이블
-- ============================================================================

-- 알레르기 마스터 테이블
CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),  -- 'major_8', 'special', 'intolerance'
  severity_level VARCHAR(20) DEFAULT 'high',  -- 'critical', 'high', 'moderate'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 알레르기 파생 재료 (엄격한 필터링용)
CREATE TABLE IF NOT EXISTS allergy_derived_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  ingredient_name VARCHAR(200) NOT NULL,
  ingredient_type VARCHAR(50),  -- 'direct', 'processed', 'sauce', 'seasoning', 'fermented'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allergy_derived_allergy ON allergy_derived_ingredients(allergy_code);
CREATE INDEX IF NOT EXISTS idx_allergy_derived_name ON allergy_derived_ingredients(ingredient_name);

-- ============================================================================
-- 3. 응급조치 정보 테이블
-- ============================================================================

-- 응급조치 정보
CREATE TABLE IF NOT EXISTS emergency_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  procedure_type VARCHAR(50),  -- 'anaphylaxis', 'mild_reaction', 'epinephrine_use'
  title_ko VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  steps JSONB NOT NULL,  -- [{step: 1, description: "..."}]
  warning_signs JSONB,  -- ["호흡 곤란", "목이 조이는 느낌", ...]
  when_to_call_911 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_procedures_allergy ON emergency_procedures(allergy_code);
CREATE INDEX IF NOT EXISTS idx_emergency_procedures_type ON emergency_procedures(procedure_type);

-- ============================================================================
-- 4. 칼로리 계산 공식 테이블
-- ============================================================================

-- 칼로리 계산 공식
CREATE TABLE IF NOT EXISTS calorie_calculation_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_name VARCHAR(100) UNIQUE NOT NULL,
  formula_type VARCHAR(50),  -- 'bmr', 'tdee', 'eer', 'maternity'
  gender VARCHAR(10),  -- 'male', 'female', 'both'
  age_min INT,
  age_max INT,
  formula_expression TEXT NOT NULL,  -- 수식 문자열
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulas_type ON calorie_calculation_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_gender ON calorie_calculation_formulas(gender);

-- ============================================================================
-- 5. user_health_profiles 테이블 확장
-- ============================================================================

-- 기존 user_health_profiles 테이블에 새 컬럼 추가
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS diseases JSONB DEFAULT '[]',  -- [{code: 'diabetes_type2', custom_name: null}]
ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]',  -- [{code: 'peanuts', custom_name: null}]
ADD COLUMN IF NOT EXISTS preferred_ingredients JSONB DEFAULT '[]',  -- ['chicken', 'broccoli']
ADD COLUMN IF NOT EXISTS excluded_ingredients JSONB DEFAULT '[]',  -- ['pork', 'mushroom']
ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]',  -- ['bento', 'fitness', 'low_carb', 'vegan']
ADD COLUMN IF NOT EXISTS calorie_calculation_method VARCHAR(50) DEFAULT 'auto',  -- 'auto', 'manual'
ADD COLUMN IF NOT EXISTS manual_target_calories INT,
ADD COLUMN IF NOT EXISTS show_calculation_formula BOOLEAN DEFAULT false;

-- ============================================================================
-- 6. 인덱스 생성
-- ============================================================================

-- user_health_profiles JSONB 컬럼에 GIN 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_diseases ON user_health_profiles USING GIN (diseases);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_allergies ON user_health_profiles USING GIN (allergies);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_dietary_preferences ON user_health_profiles USING GIN (dietary_preferences);

-- ============================================================================
-- 7. 코멘트 추가
-- ============================================================================

COMMENT ON TABLE diseases IS '질병 마스터 데이터 (당뇨, 심혈관, CKD, 통풍 등)';
COMMENT ON TABLE disease_excluded_foods_extended IS '질병별 제외 음식 목록';
COMMENT ON TABLE allergies IS '알레르기 마스터 데이터 (8대 알레르기 + 특수 알레르기)';
COMMENT ON TABLE allergy_derived_ingredients IS '알레르기 파생 재료 (새우→새우젓 등)';
COMMENT ON TABLE emergency_procedures IS '알레르기 응급조치 정보';
COMMENT ON TABLE calorie_calculation_formulas IS '칼로리 계산 공식 (Mifflin-St Jeor, Harris-Benedict 등)';

COMMENT ON COLUMN user_health_profiles.diseases IS '사용자 질병 목록 (JSON 배열)';
COMMENT ON COLUMN user_health_profiles.allergies IS '사용자 알레르기 목록 (JSON 배열)';
COMMENT ON COLUMN user_health_profiles.preferred_ingredients IS '선호 식재료 목록';
COMMENT ON COLUMN user_health_profiles.excluded_ingredients IS '비선호 식재료 목록';
COMMENT ON COLUMN user_health_profiles.dietary_preferences IS '프리미엄 식단 타입 (도시락, 헬스, 다이어트, 비건 등)';
COMMENT ON COLUMN user_health_profiles.calorie_calculation_method IS '칼로리 계산 방식 (auto: 자동 계산, manual: 수동 설정)';
COMMENT ON COLUMN user_health_profiles.manual_target_calories IS '사용자가 직접 설정한 목표 칼로리';
COMMENT ON COLUMN user_health_profiles.show_calculation_formula IS '칼로리 계산 공식 표시 여부';
