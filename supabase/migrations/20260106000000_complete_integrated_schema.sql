-- ============================================================================
-- 통합 데이터베이스 스키마 마이그레이션
-- 작성일: 2026-01-06
-- 목적: 모든 마이그레이션을 통합한 완전한 스키마 정의
--       추후 수정 및 에러 발생 시 재등록을 위한 백업 목적
-- 
-- ⚠️ 주의사항:
-- - 이 파일은 개발 환경용입니다 (RLS 비활성화)
-- - 프로덕션 배포 전 적절한 RLS 정책을 설정해야 합니다
-- - Clerk 인증을 사용하며, JWT sub는 clerk_id(TEXT)입니다
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ 통합 스키마 마이그레이션 시작';
END $$;

-- ============================================================================
-- 1. 기본 확장 및 함수
-- ============================================================================

-- UUID 생성 함수
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. ENUM 타입 정의
-- ============================================================================

-- 재료 카테고리 ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingredient_category') THEN
    CREATE TYPE ingredient_category AS ENUM (
      '곡물', '채소', '과일', '육류', '해산물', '유제품', '조미료', '기타'
    );
  END IF;
END $$;

-- ============================================================================
-- 3. 핵심 사용자 및 인증 테이블
-- ============================================================================

-- users 테이블 (기본 구조)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 프리미엄 관련
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  trial_used_at TIMESTAMPTZ,
  
  -- MFA 관련
  mfa_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_backup_codes TEXT[],
  
  -- 게임 설정
  game_settings JSONB DEFAULT '{
    "characterGameEnabled": true,
    "autoWalkEnabled": true,
    "soundEnabled": true,
    "notificationEnabled": true,
    "gameTheme": "default"
  }'::jsonb,
  
  -- 커뮤니티 관련
  bio TEXT,
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- user_health_profiles 테이블
CREATE TABLE IF NOT EXISTS user_health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE,
  diseases JSONB DEFAULT '[]'::jsonb NOT NULL,
  allergies JSONB DEFAULT '[]'::jsonb NOT NULL,
  preferred_ingredients JSONB DEFAULT '[]'::jsonb NOT NULL,
  excluded_ingredients JSONB DEFAULT '[]'::jsonb,
  dietary_preferences JSONB DEFAULT '[]'::jsonb NOT NULL,
  calorie_calculation_method VARCHAR(50) DEFAULT 'auto',
  manual_target_calories INT,
  show_calculation_formula BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_diseases ON user_health_profiles USING GIN (diseases);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_allergies ON user_health_profiles USING GIN (allergies);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_dietary_preferences ON user_health_profiles USING GIN (dietary_preferences);
ALTER TABLE user_health_profiles DISABLE ROW LEVEL SECURITY;

-- family_members 테이블
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  birth_date DATE,
  gender TEXT,
  member_type TEXT DEFAULT 'human' CHECK (member_type IN ('human', 'pet')),
  pet_type TEXT CHECK (pet_type IN ('dog', 'cat', 'other')),
  breed TEXT,
  lifecycle_stage TEXT,
  pet_metadata JSONB DEFAULT '{}'::jsonb,
  photo_url TEXT,
  avatar_type TEXT DEFAULT 'icon' CHECK (avatar_type IN ('photo', 'icon')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_score_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_member_type ON family_members(member_type);
CREATE INDEX IF NOT EXISTS idx_family_members_pet_type ON family_members(pet_type) WHERE pet_type IS NOT NULL;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. 신원확인 및 동의 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  national_id_hash TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_clerk ON identity_verifications(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_family_member ON identity_verifications(family_member_id);
ALTER TABLE identity_verifications DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_content TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'granted' CHECK (consent_status IN ('granted', 'withdrawn', 'expired')),
  consent_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  location_country TEXT,
  location_region TEXT,
  location_city TEXT,
  verification_id UUID REFERENCES identity_verifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_clerk_user ON consent_records(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
ALTER TABLE consent_records DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. 건강 관리 시스템
-- ============================================================================

-- 질병 마스터
CREATE TABLE IF NOT EXISTS diseases (
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

-- 질병별 제외 음식
CREATE TABLE IF NOT EXISTS disease_excluded_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT NOT NULL,
  excluded_food_name TEXT NOT NULL,
  excluded_type TEXT NOT NULL CHECK (excluded_type IN ('ingredient', 'recipe_keyword')),
  reason TEXT,
  severity TEXT DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT disease_excluded_foods_unique UNIQUE(disease, excluded_food_name)
);

CREATE TABLE IF NOT EXISTS disease_excluded_foods_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_code VARCHAR(50) REFERENCES diseases(code) ON DELETE CASCADE,
  food_name VARCHAR(200) NOT NULL,
  food_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'high',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON disease_excluded_foods(disease);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_extended_disease ON disease_excluded_foods_extended(disease_code);

-- 알레르기 마스터
CREATE TABLE IF NOT EXISTS allergies (
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

CREATE TABLE IF NOT EXISTS allergy_derived_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  ingredient_name VARCHAR(200) NOT NULL,
  ingredient_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allergy_derived_allergy ON allergy_derived_ingredients(allergy_code);

-- 응급조치 정보
CREATE TABLE IF NOT EXISTS emergency_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
  procedure_type VARCHAR(50),
  title_ko VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  steps JSONB NOT NULL,
  warning_signs JSONB,
  when_to_call_911 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_procedures_allergy ON emergency_procedures(allergy_code);

-- 칼로리 계산 공식
CREATE TABLE IF NOT EXISTS calorie_calculation_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  formula_name VARCHAR(100) UNIQUE NOT NULL,
  formula_type VARCHAR(50),
  gender VARCHAR(10),
  age_min INT,
  age_max INT,
  formula_expression TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calorie_formulas_user_id ON calorie_calculation_formulas(user_id);
CREATE INDEX IF NOT EXISTS idx_formulas_type ON calorie_calculation_formulas(formula_type);
ALTER TABLE calorie_calculation_formulas DISABLE ROW LEVEL SECURITY;

-- 약물 상호작용
CREATE TABLE IF NOT EXISTS medication_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_a TEXT NOT NULL,
  medication_b TEXT NOT NULL,
  interaction_level TEXT NOT NULL CHECK (interaction_level IN ('severe', 'moderate', 'mild', 'info')),
  description TEXT,
  recommendation TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('mfds', 'manual', 'external_api')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT medication_interactions_unique UNIQUE(medication_a, medication_b)
);

CREATE INDEX IF NOT EXISTS idx_medication_interactions_medication_a ON medication_interactions(medication_a);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_medication_b ON medication_interactions(medication_b);

-- 건강 시각화 테이블
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_duration_minutes INTEGER,
  sleep_quality_score INTEGER CHECK (sleep_quality_score BETWEEN 1 AND 10),
  deep_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  bedtime TIME,
  wake_time TIME,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'fitbit', 'apple_health', 'samsung_health')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT sleep_logs_unique UNIQUE(user_id, family_member_id, date)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  exercise_minutes INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  activity_type TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_fit', 'apple_health', 'samsung_health')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT activity_logs_unique UNIQUE(user_id, family_member_id, date)
);

CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  fasting_glucose INTEGER,
  postprandial_glucose INTEGER,
  heart_rate INTEGER,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'health_checkup', 'health_highway', 'mydata')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  body_fat_percentage DECIMAL(5,2),
  muscle_mass_kg DECIMAL(5,2),
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT weight_logs_unique UNIQUE(user_id, family_member_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_id ON vital_signs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);

-- 건강 대시보드 캐시
CREATE TABLE IF NOT EXISTS health_dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT health_dashboard_cache_unique UNIQUE(user_id, family_member_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_health_dashboard_cache_user_id ON health_dashboard_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_health_dashboard_cache_expires_at ON health_dashboard_cache(expires_at);

-- ============================================================================
-- 6. 반려동물 관련 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS pet_vaccine_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT NOT NULL UNIQUE,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat', 'both')),
  lifecycle_stage TEXT,
  recommended_age_weeks INTEGER,
  recommended_age_months INTEGER,
  booster_interval_months INTEGER,
  is_required BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_vaccine_master_pet_type ON pet_vaccine_master(pet_type);
ALTER TABLE pet_vaccine_master DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. 레시피 및 식단 시스템
-- ============================================================================

-- recipes 테이블 (기본 구조만, 실제 스키마는 별도)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- recipe_ingredients 테이블
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  category ingredient_category DEFAULT '기타',
  is_optional BOOLEAN DEFAULT false,
  preparation_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;

-- diet_plans 테이블
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_title TEXT,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb,
  composition_summary JSONB DEFAULT '[]'::jsonb,
  weekly_diet_plan_id UUID REFERENCES weekly_diet_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_recipe_id ON diet_plans(recipe_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_plan_date ON diet_plans(plan_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_user_date_meal_unique
  ON diet_plans(user_id, plan_date, meal_type)
  WHERE family_member_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_member_date_meal_unique
  ON diet_plans(user_id, family_member_id, plan_date, meal_type)
  WHERE family_member_id IS NOT NULL;
ALTER TABLE diet_plans DISABLE ROW LEVEL SECURITY;

-- 주간 식단 테이블
CREATE TABLE IF NOT EXISTS weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  is_family BOOLEAN DEFAULT false,
  total_recipes_count INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week ON weekly_diet_plans(user_id, week_year, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_diet_plans_unique 
  ON weekly_diet_plans(user_id, week_year, week_number);
ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;

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
ALTER TABLE weekly_shopping_lists DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS weekly_nutrition_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
ALTER TABLE weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;

-- favorite_meals 테이블
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_title TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_meals_user_id ON favorite_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_recipe_id ON favorite_meals(recipe_id);
ALTER TABLE favorite_meals DISABLE ROW LEVEL SECURITY;

-- meal_kits 테이블
CREATE TABLE IF NOT EXISTS meal_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  serving_size INTEGER DEFAULT 1,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  category TEXT,
  meal_type TEXT[] DEFAULT '{}',
  purchase_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_kits_is_active ON meal_kits(is_active) WHERE is_active = true;
ALTER TABLE meal_kits DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. 결제 및 구독 시스템
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'paused')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  billing_key TEXT,
  payment_method TEXT,
  last_four_digits TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  price_per_month INTEGER NOT NULL,
  total_paid INTEGER,
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'one_time', 'refund')),
  pg_provider TEXT NOT NULL DEFAULT 'toss_payments',
  pg_transaction_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL,
  payment_method TEXT,
  card_info JSONB,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON payment_transactions(subscription_id);
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  applicable_plans TEXT[],
  new_users_only BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- ============================================================================
-- 9. 알림 시스템
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'system', 'health', 'vaccination', 'medication', 'periodic_service',
    'lifecycle_event', 'pet_healthcare'
  )),
  category TEXT CHECK (category IN (
    'kcdc', 'diet-popup', 'system', 'scheduled', 'reminder', 'overdue', 
    'checkup', 'appointment', 'general',
    'sensitive_health', 'education', 'military', 'career', 'milestone',
    'puberty', 'menopause', 'aging', 'family_formation', 'housing_finance',
    'legal_social', 'senior_retirement', 'lifestyle',
    'pet_healthcare', 'pet_vaccination', 'pet_weight', 'pet_checkup', 'pet_dental'
  )),
  channel TEXT CHECK (channel IN ('push', 'sms', 'email', 'in_app')),
  title TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'dismissed', 'confirmed', 'missed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  context_data JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('vaccination_schedule', 'medication_record', 'periodic_service', 'health_checkup', 'appointment')),
  recipient TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_family_member_id ON notifications(family_member_id) WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at DESC) WHERE scheduled_at IS NOT NULL;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_id TEXT,
  app_version TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  CONSTRAINT user_push_tokens_user_token_unique UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(active) WHERE active = true;

-- KCDC 알림
CREATE TABLE IF NOT EXISTS kcdc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  flu_stage TEXT,
  flu_week TEXT,
  vaccine_name TEXT,
  target_age_group TEXT,
  recommended_date DATE,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_type ON kcdc_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active ON kcdc_alerts(is_active);
ALTER TABLE kcdc_alerts DISABLE ROW LEVEL SECURITY;

-- 생애주기 알림 설정
CREATE TABLE IF NOT EXISTS lifecycle_notification_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER[] DEFAULT ARRAY[0, 1, 7],
  notification_channels TEXT[] DEFAULT ARRAY['in_app', 'push'],
  quiet_hours_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  per_notification_settings JSONB DEFAULT '{}'::jsonb,
  timezone TEXT DEFAULT 'Asia/Seoul',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_reminder_settings_user_id ON lifecycle_notification_reminder_settings(user_id);
ALTER TABLE lifecycle_notification_reminder_settings DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS lifecycle_notification_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  share_completion_status BOOLEAN DEFAULT true,
  share_reminders BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notification_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_shares_notification_id ON lifecycle_notification_shares(notification_id);
ALTER TABLE lifecycle_notification_shares DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. 관리자 콘솔
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_copy_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  locale TEXT DEFAULT 'ko',
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT admin_copy_blocks_slug_locale_unique UNIQUE (slug, locale)
);

CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug_locale ON admin_copy_blocks(slug, locale);
ALTER TABLE admin_copy_blocks DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS popup_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority INTEGER DEFAULT 0,
  target_segments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  link_url TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_priority ON popup_announcements(priority DESC);
ALTER TABLE popup_announcements DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('password-change', 'mfa-enable', 'mfa-disable', 'session-revoke', 'admin-access')),
  user_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_security_audit_user_id ON admin_security_audit(user_id);
ALTER TABLE admin_security_audit DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. 이미지 캐시 시스템
-- ============================================================================

CREATE TABLE IF NOT EXISTS image_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path TEXT NOT NULL,
  food_name TEXT,
  source_type TEXT,
  access_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_cache_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_images INTEGER DEFAULT 0,
  static_images INTEGER DEFAULT 0,
  gemini_images INTEGER DEFAULT 0,
  placeholder_images INTEGER DEFAULT 0,
  total_access_count INTEGER DEFAULT 0,
  cache_hit_rate DECIMAL(5, 2),
  storage_size_mb DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_cache_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_date TIMESTAMPTZ NOT NULL,
  images_removed INTEGER DEFAULT 0,
  space_freed_mb DECIMAL(10, 2),
  cleanup_duration_ms INTEGER,
  cleanup_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_usage_logs_image_path ON image_usage_logs(image_path);
CREATE INDEX IF NOT EXISTS idx_image_cache_stats_date ON image_cache_stats(stat_date);
ALTER TABLE image_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_cleanup_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. 게임화 시스템
-- ============================================================================

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL,
  category TEXT,
  target_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  reward_experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_quest_id UUID NOT NULL REFERENCES user_quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  last_completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;

-- 게임 요소 테이블
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quest_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

CREATE TABLE IF NOT EXISTS character_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  experience_to_next_level INTEGER DEFAULT 100,
  last_level_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS character_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT false,
  UNIQUE(user_id, family_member_id, skin_id)
);

CREATE TABLE IF NOT EXISTS random_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('daily', 'family', 'special', 'seasonal')),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  triggered_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_points INTEGER DEFAULT 0,
  UNIQUE(user_id, event_id, triggered_date)
);

CREATE TABLE IF NOT EXISTS family_intimacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  intimacy_score INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS family_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('weekly', 'monthly', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS minigame_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('medication_memory', 'exercise_timing', 'nutrition_puzzle')),
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  reward_points INTEGER DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  reward_points INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_character_levels_user_id ON character_levels(user_id);
ALTER TABLE daily_quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_skins DISABLE ROW LEVEL SECURITY;
ALTER TABLE random_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_intimacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE minigame_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_records DISABLE ROW LEVEL SECURITY;

-- 캐릭터 게임 이벤트
CREATE TABLE IF NOT EXISTS character_game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'medication', 'baby_feeding', 'health_checkup', 'vaccination',
    'kcdc_alert', 'lifecycle_event', 'custom'
  )),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'missed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS baby_feeding_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  feeding_interval_hours NUMERIC(4,2) NOT NULL DEFAULT 3.0 CHECK (feeding_interval_hours > 0),
  last_feeding_time TIMESTAMPTZ,
  next_feeding_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS character_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  current_position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  target_position JSONB,
  activity_type TEXT CHECK (activity_type IN (
    'idle', 'walking', 'talking', 'working', 'eating', 'sleeping', 'playing'
  )),
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, family_member_id)
);

CREATE TABLE IF NOT EXISTS character_game_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES character_game_events(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'medication_given', 'feeding_given', 'checkup_scheduled',
    'vaccination_scheduled', 'dialogue_completed', 'event_completed'
  )),
  interaction_data JSONB DEFAULT '{}'::jsonb,
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_character_game_events_user_id ON character_game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_feeding_schedules_user_id ON baby_feeding_schedules(user_id);
ALTER TABLE character_game_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_feeding_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_game_interactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. 커뮤니티 시스템
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('health', 'pet', 'recipe', 'exercise', 'region')),
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_family_only BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'question', 'recipe', 'achievement', 'challenge')),
  images JSONB DEFAULT '[]'::jsonb,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES group_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_post_or_comment CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_post_like 
ON post_likes(post_id, user_id) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_comment_like 
ON post_likes(comment_id, user_id) 
WHERE comment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT check_no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_community_groups_owner_id ON community_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
ALTER TABLE community_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. 트리거 설정
-- ============================================================================

-- updated_at 트리거들
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_health_profiles_updated_at ON user_health_profiles;
CREATE TRIGGER update_user_health_profiles_updated_at
  BEFORE UPDATE ON user_health_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_diet_plans_updated_at ON weekly_diet_plans;
CREATE TRIGGER update_weekly_diet_plans_updated_at
  BEFORE UPDATE ON weekly_diet_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_copy_blocks_updated_at ON admin_copy_blocks;
CREATE TRIGGER update_admin_copy_blocks_updated_at
  BEFORE UPDATE ON admin_copy_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_popup_announcements_updated_at ON popup_announcements;
CREATE TRIGGER update_popup_announcements_updated_at
  BEFORE UPDATE ON popup_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- recipe_title 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_recipe_title_from_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recipe_id IS NOT NULL AND (OLD.recipe_id IS NULL OR OLD.recipe_id != NEW.recipe_id) THEN
    SELECT title INTO NEW.recipe_title
    FROM public.recipes
    WHERE id = NEW.recipe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recipe_title ON public.diet_plans;
CREATE TRIGGER trigger_update_recipe_title
  BEFORE INSERT OR UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_title_from_id();

-- ============================================================================
-- 15. Storage 버킷 생성
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('popup-images', 'popup-images', true),
  ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 16. 외래키 제약조건 확인 및 추가
-- ============================================================================

-- diet_plans 외래키
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'diet_plans_recipe_id_fkey'
    AND conrelid = 'diet_plans'::regclass
  ) THEN
    ALTER TABLE public.diet_plans
    ADD CONSTRAINT diet_plans_recipe_id_fkey
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'diet_plans_weekly_diet_plan_id_fkey'
    AND conrelid = 'diet_plans'::regclass
  ) THEN
    ALTER TABLE public.diet_plans
    ADD CONSTRAINT diet_plans_weekly_diet_plan_id_fkey
    FOREIGN KEY (weekly_diet_plan_id) REFERENCES public.weekly_diet_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- favorite_meals 외래키
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'favorite_meals_recipe_id_fkey'
    AND conrelid = 'favorite_meals'::regclass
  ) THEN
    ALTER TABLE public.favorite_meals
    ADD CONSTRAINT favorite_meals_recipe_id_fkey
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- meal_kits 외래키
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'meal_kits_created_by_fkey'
    AND conrelid = 'meal_kits'::regclass
  ) THEN
    ALTER TABLE public.meal_kits
    ADD CONSTRAINT meal_kits_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 17. 코멘트 추가
-- ============================================================================

COMMENT ON TABLE users IS '중앙 허브 테이블 - 모든 사용자 관련 테이블의 부모';
COMMENT ON TABLE user_health_profiles IS '사용자 건강 프로필 - users와 1:1 관계';
COMMENT ON TABLE family_members IS '가족 구성원 테이블 - 사람과 반려동물 모두 관리';
COMMENT ON TABLE notifications IS '통합 알림 로그 테이블 - 모든 알림 타입을 하나의 테이블로 관리';
COMMENT ON TABLE diet_plans IS '일일 식단 계획 테이블';
COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 테이블';
COMMENT ON TABLE subscriptions IS '사용자 구독 정보';
COMMENT ON TABLE payment_transactions IS '결제 내역';

DO $$
BEGIN
  RAISE NOTICE '✅ 통합 스키마 마이그레이션 완료';
END $$;

