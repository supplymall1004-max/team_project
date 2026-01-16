-- ERDCloud용 데이터베이스 스키마 DDL
-- Supabase 프로젝트: xlbhrgvnfioxtvocwban
-- 생성일: 2025-01-27

-- ============================================
-- 테이블 생성
-- ============================================

-- users 테이블
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  mfa_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_backup_codes TEXT[],
  notification_settings JSONB DEFAULT '{"kcdcAlerts": false, "healthPopups": false, "generalNotifications": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  trial_used_at TIMESTAMPTZ,
  bio TEXT,
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  game_settings JSONB DEFAULT '{"gameTheme": "default", "soundEnabled": true, "autoWalkEnabled": true, "notificationEnabled": true, "characterGameEnabled": true}'::jsonb,
  home_customization JSONB
);
COMMENT ON TABLE public.users IS '중앙 허브 테이블 - 모든 사용자 관련 테이블의 부모';

-- diseases 테이블
CREATE TABLE public.diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  name_ko VARCHAR NOT NULL,
  name_en VARCHAR,
  category VARCHAR,
  description TEXT,
  calorie_adjustment_factor NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.diseases IS '질병 마스터 데이터 (당뇨, 심혈관, CKD, 통풍 등)';

-- allergies 테이블
CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  name_ko VARCHAR NOT NULL,
  name_en VARCHAR,
  category VARCHAR,
  severity_level VARCHAR DEFAULT 'high',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.allergies IS '알레르기 마스터 데이터 (8대 알레르기 + 특수 알레르기)';

-- user_health_profiles 테이블
CREATE TABLE public.user_health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  disliked_ingredients TEXT[] DEFAULT '{}',
  excluded_ingredients JSONB DEFAULT '[]'::jsonb,
  premium_features TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg NUMERIC,
  age INTEGER,
  gender TEXT,
  activity_level TEXT,
  daily_calorie_goal INTEGER,
  calorie_calculation_method VARCHAR DEFAULT 'auto',
  manual_target_calories INTEGER,
  show_calculation_formula BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  vaccination_history JSONB DEFAULT '[]'::jsonb,
  last_health_checkup_date DATE,
  region TEXT,
  diseases JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  preferred_ingredients JSONB DEFAULT '[]'::jsonb,
  dietary_preferences JSONB DEFAULT '[]'::jsonb,
  birth_date DATE
);
COMMENT ON TABLE public.user_health_profiles IS '사용자 건강 프로필 - users와 1:1 관계';

-- family_members 테이블
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT,
  relationship TEXT NOT NULL,
  diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg NUMERIC,
  activity_level TEXT,
  dietary_preferences TEXT[] DEFAULT '{}',
  include_in_unified_diet BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  vaccination_history JSONB DEFAULT '[]'::jsonb,
  last_health_checkup_date DATE,
  member_type TEXT DEFAULT 'human',
  pet_type TEXT,
  breed TEXT,
  lifecycle_stage TEXT,
  pet_metadata JSONB DEFAULT '{}'::jsonb,
  photo_url TEXT,
  avatar_type TEXT DEFAULT 'icon',
  health_score INTEGER,
  health_score_updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.family_members IS '가족 구성원 테이블 - 사람(human)과 반려동물(pet) 모두 관리';

-- subscriptions 테이블
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'inactive',
  plan_type TEXT NOT NULL,
  billing_key TEXT,
  payment_method TEXT,
  last_four_digits TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  price_per_month INTEGER NOT NULL,
  total_paid INTEGER DEFAULT 0,
  is_test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.subscriptions IS '구독 정보 테이블 (결제 시스템)';

-- promo_codes 테이블
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  applicable_plans TEXT[],
  new_users_only BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.promo_codes IS '프로모션 코드 테이블';

-- recipes 테이블
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty INTEGER NOT NULL,
  cooking_time_minutes INTEGER NOT NULL,
  servings INTEGER DEFAULT 1,
  calories NUMERIC,
  carbohydrates NUMERIC,
  protein NUMERIC,
  fat NUMERIC,
  sodium NUMERIC,
  foodsafety_rcp_seq TEXT,
  foodsafety_rcp_way2 TEXT,
  foodsafety_rcp_pat2 TEXT,
  foodsafety_info_eng NUMERIC,
  foodsafety_info_car NUMERIC,
  foodsafety_info_pro NUMERIC,
  foodsafety_info_fat NUMERIC,
  foodsafety_info_na NUMERIC,
  foodsafety_info_fiber NUMERIC,
  foodsafety_rcp_parts_dtls TEXT,
  foodsafety_att_file_no_main TEXT,
  foodsafety_att_file_no_mk TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  static_file_path TEXT,
  static_file_updated_at TIMESTAMPTZ,
  main_ingredients TEXT[] DEFAULT ARRAY[]::text[],
  cooking_method TEXT,
  variation_group_id UUID,
  nutrition_focus TEXT[] DEFAULT ARRAY[]::text[],
  age_group_suitable TEXT[] DEFAULT ARRAY[]::text[]
);
COMMENT ON TABLE public.recipes IS '레시피 기본 정보 테이블';

-- recipe_ingredients 테이블
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  name TEXT NOT NULL,
  ingredient_name TEXT,
  quantity NUMERIC,
  unit TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL,
  category ingredient_category DEFAULT '기타',
  is_optional BOOLEAN DEFAULT false,
  preparation_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.recipe_ingredients IS '레시피 재료 정보 테이블';

-- recipe_steps 테이블
CREATE TABLE public.recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  timer_minutes INTEGER,
  foodsafety_manual_img TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.recipe_steps IS '레시피 조리 단계 테이블';

-- weekly_diet_plans 테이블
CREATE TABLE public.weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  is_family BOOLEAN DEFAULT false,
  total_recipes_count INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.weekly_diet_plans IS '주간 식단 메타데이터 (7일치 식단 정보)';

-- diet_plans 테이블
CREATE TABLE public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID,
  recipe_title TEXT NOT NULL,
  recipe_description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  sodium_mg INTEGER,
  fiber_g NUMERIC,
  potassium_mg INTEGER,
  phosphorus_mg INTEGER,
  gi_index NUMERIC,
  composition_summary JSONB DEFAULT '[]'::jsonb,
  is_unified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  weekly_diet_plan_id UUID
);
COMMENT ON TABLE public.diet_plans IS '식단 계획 테이블 (일일/주간)';

-- ============================================
-- 외래키 관계
-- ============================================

-- user_health_profiles
ALTER TABLE public.user_health_profiles 
  ADD CONSTRAINT user_health_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- family_members
ALTER TABLE public.family_members 
  ADD CONSTRAINT family_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- subscriptions
ALTER TABLE public.subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- promo_codes
ALTER TABLE public.promo_codes 
  ADD CONSTRAINT promo_codes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- recipes
ALTER TABLE public.recipes 
  ADD CONSTRAINT recipes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.recipes 
  ADD CONSTRAINT fk_recipes_variation_group_id 
  FOREIGN KEY (variation_group_id) REFERENCES public.recipe_variation_groups(id) ON DELETE SET NULL;

-- recipe_ingredients
ALTER TABLE public.recipe_ingredients 
  ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

-- recipe_steps
ALTER TABLE public.recipe_steps 
  ADD CONSTRAINT recipe_steps_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

-- weekly_diet_plans
ALTER TABLE public.weekly_diet_plans 
  ADD CONSTRAINT weekly_diet_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- diet_plans
ALTER TABLE public.diet_plans 
  ADD CONSTRAINT diet_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.diet_plans 
  ADD CONSTRAINT diet_plans_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES public.family_members(id) ON DELETE CASCADE;

ALTER TABLE public.diet_plans 
  ADD CONSTRAINT diet_plans_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;

ALTER TABLE public.diet_plans 
  ADD CONSTRAINT diet_plans_weekly_diet_plan_id_fkey 
  FOREIGN KEY (weekly_diet_plan_id) REFERENCES public.weekly_diet_plans(id) ON DELETE SET NULL;

-- diseases 관계
ALTER TABLE public.disease_records 
  ADD CONSTRAINT disease_records_disease_code_fkey 
  FOREIGN KEY (disease_code) REFERENCES public.diseases(code) ON DELETE RESTRICT;

-- allergies 관계
ALTER TABLE public.allergy_derived_ingredients 
  ADD CONSTRAINT allergy_derived_ingredients_allergy_code_fkey 
  FOREIGN KEY (allergy_code) REFERENCES public.allergies(code) ON DELETE RESTRICT;

