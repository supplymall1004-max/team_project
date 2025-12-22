-- ============================================================================
-- Supabase 데이터베이스 전체 스키마 문서
-- ERD Cloud에서 관계성 수정 작업을 위한 완전한 SQL 문서
-- 생성일: 2025-01-28
-- ============================================================================

-- ============================================================================
-- 1. 테이블 생성 (CREATE TABLE)
-- ============================================================================

CREATE TABLE admin_copy_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  locale TEXT DEFAULT 'ko'::text,
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_security_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  severity_level VARCHAR(20) DEFAULT 'high'::character varying,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE allergy_derived_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  allergy_code VARCHAR(50),
  ingredient_name VARCHAR(200) NOT NULL,
  ingredient_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE calorie_calculation_formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  formula_name VARCHAR(100) NOT NULL,
  formula_type VARCHAR(50),
  gender VARCHAR(10),
  age_min INTEGER,
  age_max INTEGER,
  formula_expression TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID
);

CREATE TABLE calorie_calculation_formulas_backup (
  id UUID,
  formula_name VARCHAR(100),
  formula_type VARCHAR(50),
  gender VARCHAR(10),
  age_min INTEGER,
  age_max INTEGER,
  formula_expression TEXT,
  description TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_content TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'granted'::text,
  consent_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  location_country TEXT,
  location_region TEXT,
  location_city TEXT,
  verification_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deworming_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  medication_name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL,
  standard_dosage TEXT NOT NULL,
  standard_cycle_days INTEGER NOT NULL DEFAULT 90,
  target_parasites ARRAY DEFAULT '{}'::text[],
  age_group TEXT,
  contraindications ARRAY DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diet_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  popup_enabled BOOLEAN NOT NULL DEFAULT true,
  browser_enabled BOOLEAN DEFAULT false,
  notification_time TIME DEFAULT '05:00:00'::time without time zone,
  kcdc_enabled BOOLEAN NOT NULL DEFAULT true,
  last_notification_date DATE,
  last_dismissed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE disease_excluded_foods_extended (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  disease_code VARCHAR(50),
  food_name VARCHAR(200) NOT NULL,
  food_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'high'::character varying,
  reason TEXT,
  exclusion_type TEXT DEFAULT 'absolute'::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE disease_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  disease_name TEXT NOT NULL,
  disease_code TEXT,
  diagnosis_date DATE NOT NULL,
  hospital_name TEXT,
  hospital_record_id UUID,
  status TEXT NOT NULL DEFAULT 'active'::text,
  severity TEXT,
  treatment_plan TEXT,
  data_source_id UUID,
  is_auto_synced BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diseases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE emergency_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  allergy_code VARCHAR(50),
  procedure_type VARCHAR(50),
  title_ko VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  steps JSONB NOT NULL,
  warning_signs JSONB,
  when_to_call_911 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT,
  relationship TEXT NOT NULL,
  diseases ARRAY DEFAULT '{}'::text[],
  allergies ARRAY DEFAULT '{}'::text[],
  height_cm INTEGER,
  activity_level TEXT,
  dietary_preferences ARRAY DEFAULT '{}'::text[],
  include_in_unified_diet BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  vaccination_history JSONB DEFAULT '[]'::jsonb,
  last_health_checkup_date DATE
);

CREATE TABLE favorite_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipe_id UUID,
  recipe_title TEXT NOT NULL,
  meal_type TEXT,
  calories INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE foodsafety_recipes_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rcp_seq TEXT NOT NULL,
  rcp_nm TEXT NOT NULL,
  rcp_pat2 TEXT,
  rcp_way2 TEXT,
  rcp_parts_dtls TEXT,
  rcp_na_tip TEXT,
  att_file_no_main TEXT,
  att_file_no_mk TEXT,
  hash_tag TEXT,
  manual_data JSONB DEFAULT '[]'::jsonb,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE health_dashboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE health_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending'::text,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily'::text,
  connection_metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE health_data_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_source_id UUID,
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  hospital_records_count INTEGER DEFAULT 0,
  medication_records_count INTEGER DEFAULT 0,
  disease_records_count INTEGER DEFAULT 0,
  checkup_records_count INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB DEFAULT '{}'::jsonb,
  sync_duration_ms INTEGER,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE health_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  template_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'::text,
  context_data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent'::text,
  recipient TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_test BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hospital_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  visit_date DATE NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_code TEXT,
  department TEXT,
  diagnosis ARRAY DEFAULT '{}'::text[],
  diagnosis_codes ARRAY DEFAULT '{}'::text[],
  prescribed_medications JSONB DEFAULT '[]'::jsonb,
  treatment_summary TEXT,
  data_source_id UUID,
  is_auto_synced BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  national_id_hash TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  family_member_id UUID
);

CREATE TABLE image_cache_cleanup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  cleanup_date TIMESTAMPTZ NOT NULL,
  images_removed INTEGER DEFAULT 0,
  cleanup_duration_ms INTEGER,
  cleanup_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE image_cache_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  total_images INTEGER DEFAULT 0,
  static_images INTEGER DEFAULT 0,
  gemini_images INTEGER DEFAULT 0,
  placeholder_images INTEGER DEFAULT 0,
  total_access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE image_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  image_path TEXT NOT NULL,
  food_name TEXT,
  source_type TEXT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kcdc_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info'::text,
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

CREATE TABLE kcdc_disease_outbreaks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  disease_name TEXT NOT NULL,
  disease_code TEXT,
  region TEXT NOT NULL,
  outbreak_date DATE NOT NULL,
  case_count INTEGER DEFAULT 0,
  severity TEXT,
  alert_level TEXT,
  description TEXT,
  source_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kcdc_health_checkup_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  checkup_type TEXT NOT NULL,
  age_group TEXT NOT NULL,
  gender TEXT,
  year INTEGER NOT NULL,
  average_values JSONB DEFAULT '{}'::jsonb,
  normal_ranges JSONB DEFAULT '{}'::jsonb,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE legacy_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  video_id UUID,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  region TEXT NOT NULL,
  era TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  source JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE legacy_masters (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  bio TEXT
);

CREATE TABLE legacy_replacement_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  traditional JSONB NOT NULL,
  modern JSONB NOT NULL,
  tips ARRAY DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE legacy_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  master_id UUID,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  region TEXT NOT NULL,
  era TEXT NOT NULL,
  ingredients ARRAY DEFAULT '{}'::text[],
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  premium_only BOOLEAN DEFAULT false,
  tags ARRAY DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lifecycle_vaccination_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT,
  target_age_min_months INTEGER,
  target_age_max_months INTEGER,
  priority TEXT NOT NULL,
  dose_number INTEGER NOT NULL,
  total_doses INTEGER NOT NULL,
  interval_days INTEGER,
  gender_requirement TEXT,
  description TEXT,
  source TEXT DEFAULT 'kcdc'::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_kit_products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  coupang_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  discount_rate INTEGER,
  product_url TEXT NOT NULL,
  affiliate_link TEXT,
  calories INTEGER,
  category TEXT,
  meal_type ARRAY DEFAULT '{}'::text[],
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'success'::text,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  serving_size INTEGER,
  calories INTEGER,
  category TEXT,
  meal_type ARRAY DEFAULT '{}'::text[],
  purchase_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE medication_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  medication_a TEXT NOT NULL,
  medication_b TEXT NOT NULL,
  interaction_level TEXT NOT NULL,
  description TEXT,
  recommendation TEXT,
  source TEXT NOT NULL DEFAULT 'manual'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE medication_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  medication_name TEXT NOT NULL,
  medication_code TEXT,
  active_ingredient TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  reminder_times ARRAY DEFAULT '{}'::time without time zone[],
  reminder_enabled BOOLEAN DEFAULT true,
  hospital_record_id UUID,
  data_source_id UUID,
  is_auto_synced BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE medication_reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  medication_record_id UUID NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  family_member_id UUID,
  type TEXT NOT NULL,
  category TEXT,
  channel TEXT,
  title TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  priority TEXT DEFAULT 'normal'::text,
  context_data JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  related_id UUID,
  related_type TEXT,
  recipient TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  subscription_id UUID,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  pg_provider TEXT NOT NULL DEFAULT 'toss_payments'::text,
  pg_transaction_id TEXT,
  amount INTEGER NOT NULL,
  tax_amount INTEGER,
  net_amount INTEGER NOT NULL,
  payment_method TEXT,
  card_info JSONB,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  is_test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE popup_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'::text,
  priority INTEGER DEFAULT 0,
  target_segments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  link_url TEXT,
  display_type TEXT DEFAULT 'modal'::text,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  subscription_id UUID,
  used_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  applicable_plans ARRAY,
  new_users_only BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  name TEXT NOT NULL,
  ingredient_name TEXT,
  unit TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL,
  category ingredient_category DEFAULT '기타'::ingredient_category,
  is_optional BOOLEAN DEFAULT false,
  preparation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipe_rating_stats (
  recipe_id UUID,
  rating_count BIGINT
);

CREATE TABLE recipe_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  timer_minutes INTEGER,
  foodsafety_manual_img TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  recipe_title TEXT NOT NULL,
  recipe_url TEXT,
  meal_type TEXT,
  used_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty INTEGER NOT NULL,
  cooking_time_minutes INTEGER NOT NULL,
  servings INTEGER DEFAULT 1,
  foodsafety_rcp_seq TEXT,
  foodsafety_rcp_way2 TEXT,
  foodsafety_rcp_pat2 TEXT,
  foodsafety_rcp_parts_dtls TEXT,
  foodsafety_att_file_no_main TEXT,
  foodsafety_att_file_no_mk TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE royal_recipes_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  era TEXT NOT NULL,
  author_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive'::text,
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

CREATE TABLE user_deworming_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  taken_date DATE NOT NULL,
  next_due_date DATE,
  cycle_days INTEGER DEFAULT 90,
  prescribed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_health_checkup_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID NOT NULL,
  checkup_type TEXT NOT NULL,
  checkup_name TEXT NOT NULL,
  recommended_date DATE NOT NULL,
  priority TEXT NOT NULL,
  overdue BOOLEAN DEFAULT false,
  last_checkup_date DATE,
  age_requirement TEXT,
  gender_requirement TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_health_checkup_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  checkup_type TEXT NOT NULL,
  checkup_date DATE NOT NULL,
  checkup_site TEXT,
  checkup_site_address TEXT,
  results JSONB DEFAULT '{}'::jsonb,
  next_recommended_date DATE,
  overdue_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_health_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  disliked_ingredients ARRAY DEFAULT '{}'::text[],
  excluded_ingredients JSONB DEFAULT '[]'::jsonb,
  premium_features ARRAY DEFAULT '{}'::text[],
  height_cm INTEGER,
  age INTEGER,
  gender TEXT,
  activity_level TEXT,
  daily_calorie_goal INTEGER,
  calorie_calculation_method VARCHAR(50) DEFAULT 'auto'::character varying,
  manual_target_calories INTEGER,
  show_calculation_formula BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  vaccination_history JSONB DEFAULT '[]'::jsonb,
  last_health_checkup_date DATE,
  region TEXT,
  diseases JSONB NOT NULL DEFAULT '[]'::jsonb,
  allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  dietary_preferences JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE user_infection_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  flu_stage TEXT,
  flu_week TEXT,
  region TEXT,
  factors JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  periodic_services_enabled BOOLEAN DEFAULT true,
  periodic_services_reminder_days INTEGER DEFAULT 7,
  deworming_reminders_enabled BOOLEAN DEFAULT true,
  vaccination_reminders_enabled BOOLEAN DEFAULT true,
  checkup_reminders_enabled BOOLEAN DEFAULT true,
  infection_risk_alerts_enabled BOOLEAN DEFAULT true,
  travel_risk_alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_periodic_health_services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  cycle_type TEXT NOT NULL,
  cycle_days INTEGER,
  last_service_date DATE,
  next_service_date DATE,
  reminder_days_before INTEGER DEFAULT 7,
  reminder_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_periodic_service_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  service_due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent'::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'free'::text,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_travel_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_country TEXT NOT NULL,
  destination_region TEXT,
  travel_start_date DATE NOT NULL,
  travel_end_date DATE NOT NULL,
  risk_level TEXT NOT NULL,
  disease_alerts JSONB DEFAULT '[]'::jsonb,
  prevention_checklist JSONB DEFAULT '[]'::jsonb,
  vaccination_requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_vaccination_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT,
  target_age_group TEXT,
  scheduled_date DATE,
  completed_date DATE,
  dose_number INTEGER,
  total_doses INTEGER,
  vaccination_site TEXT,
  vaccination_site_address TEXT,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_vaccination_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID NOT NULL,
  vaccine_name TEXT NOT NULL,
  recommended_date DATE NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  source TEXT NOT NULL DEFAULT 'kcdc'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notification_sent_at TIMESTAMPTZ,
  notification_channel TEXT DEFAULT 'push'::text,
  reminder_count INTEGER DEFAULT 0
);

CREATE TABLE users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  mfa_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_backup_codes ARRAY,
  notification_settings JSONB DEFAULT '{"kcdcAlerts": false, "healthPopups": false, "generalNotifications": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_used_at TIMESTAMPTZ
);

CREATE TABLE vaccination_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  vaccination_schedule_id UUID,
  vaccination_record_id UUID,
  notification_type TEXT NOT NULL,
  notification_channel TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  notification_sent_at TIMESTAMPTZ,
  notification_status TEXT NOT NULL DEFAULT 'pending'::text,
  reminder_days_before INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
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

CREATE TABLE weekly_nutrition_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  date DATE NOT NULL,
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL,
  ingredient_name TEXT NOT NULL,
  unit TEXT,
  category TEXT,
  recipes_using JSONB DEFAULT '[]'::jsonb,
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. PRIMARY KEY 제약조건
-- ============================================================================

ALTER TABLE admin_copy_blocks ADD CONSTRAINT admin_copy_blocks_pkey PRIMARY KEY (id);
ALTER TABLE admin_security_audit ADD CONSTRAINT admin_security_audit_pkey PRIMARY KEY (id);
ALTER TABLE allergies ADD CONSTRAINT allergies_pkey PRIMARY KEY (id);
ALTER TABLE allergy_derived_ingredients ADD CONSTRAINT allergy_derived_ingredients_pkey PRIMARY KEY (id);
ALTER TABLE calorie_calculation_formulas ADD CONSTRAINT calorie_calculation_formulas_pkey PRIMARY KEY (id);
ALTER TABLE consent_records ADD CONSTRAINT consent_records_pkey PRIMARY KEY (id);
ALTER TABLE deworming_medications ADD CONSTRAINT deworming_medications_pkey PRIMARY KEY (id);
ALTER TABLE diet_notification_settings ADD CONSTRAINT diet_notification_settings_pkey PRIMARY KEY (id);
ALTER TABLE diet_plans ADD CONSTRAINT diet_plans_pkey PRIMARY KEY (id);
ALTER TABLE disease_excluded_foods_extended ADD CONSTRAINT disease_excluded_foods_extended_pkey PRIMARY KEY (id);
ALTER TABLE disease_records ADD CONSTRAINT disease_records_pkey PRIMARY KEY (id);
ALTER TABLE diseases ADD CONSTRAINT diseases_pkey PRIMARY KEY (id);
ALTER TABLE emergency_procedures ADD CONSTRAINT emergency_procedures_pkey PRIMARY KEY (id);
ALTER TABLE family_members ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);
ALTER TABLE favorite_meals ADD CONSTRAINT favorite_meals_pkey PRIMARY KEY (id);
ALTER TABLE foodsafety_recipes_cache ADD CONSTRAINT foodsafety_recipes_cache_pkey PRIMARY KEY (id);
ALTER TABLE health_dashboard_cache ADD CONSTRAINT health_dashboard_cache_pkey PRIMARY KEY (id);
ALTER TABLE health_data_sources ADD CONSTRAINT health_data_sources_pkey PRIMARY KEY (id);
ALTER TABLE health_data_sync_logs ADD CONSTRAINT health_data_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE health_notifications ADD CONSTRAINT health_notifications_pkey PRIMARY KEY (id);
ALTER TABLE hospital_records ADD CONSTRAINT hospital_records_pkey PRIMARY KEY (id);
ALTER TABLE identity_verifications ADD CONSTRAINT identity_verifications_pkey PRIMARY KEY (id);
ALTER TABLE image_cache_cleanup_logs ADD CONSTRAINT image_cache_cleanup_logs_pkey PRIMARY KEY (id);
ALTER TABLE image_cache_stats ADD CONSTRAINT image_cache_stats_pkey PRIMARY KEY (id);
ALTER TABLE image_usage_logs ADD CONSTRAINT image_usage_logs_pkey PRIMARY KEY (id);
ALTER TABLE kcdc_alerts ADD CONSTRAINT kcdc_alerts_pkey PRIMARY KEY (id);
ALTER TABLE kcdc_disease_outbreaks ADD CONSTRAINT kcdc_disease_outbreaks_pkey PRIMARY KEY (id);
ALTER TABLE kcdc_health_checkup_statistics ADD CONSTRAINT kcdc_health_checkup_statistics_pkey PRIMARY KEY (id);
ALTER TABLE legacy_documents ADD CONSTRAINT legacy_documents_pkey PRIMARY KEY (id);
ALTER TABLE legacy_masters ADD CONSTRAINT legacy_masters_pkey PRIMARY KEY (id);
ALTER TABLE legacy_replacement_guides ADD CONSTRAINT legacy_replacement_guides_pkey PRIMARY KEY (id);
ALTER TABLE legacy_videos ADD CONSTRAINT legacy_videos_pkey PRIMARY KEY (id);
ALTER TABLE lifecycle_vaccination_schedules ADD CONSTRAINT lifecycle_vaccination_schedules_pkey PRIMARY KEY (id);
ALTER TABLE meal_kit_products ADD CONSTRAINT meal_kit_products_pkey PRIMARY KEY (id);
ALTER TABLE meal_kits ADD CONSTRAINT meal_kits_pkey PRIMARY KEY (id);
ALTER TABLE medication_interactions ADD CONSTRAINT medication_interactions_pkey PRIMARY KEY (id);
ALTER TABLE medication_records ADD CONSTRAINT medication_records_pkey PRIMARY KEY (id);
ALTER TABLE medication_reminder_logs ADD CONSTRAINT medication_reminder_logs_pkey PRIMARY KEY (id);
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);
ALTER TABLE notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);
ALTER TABLE popup_announcements ADD CONSTRAINT popup_announcements_pkey PRIMARY KEY (id);
ALTER TABLE promo_code_uses ADD CONSTRAINT promo_code_uses_pkey PRIMARY KEY (id);
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);
ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);
ALTER TABLE recipe_ratings ADD CONSTRAINT recipe_ratings_pkey PRIMARY KEY (id);
ALTER TABLE recipe_reports ADD CONSTRAINT recipe_reports_pkey PRIMARY KEY (id);
ALTER TABLE recipe_steps ADD CONSTRAINT recipe_steps_pkey PRIMARY KEY (id);
ALTER TABLE recipe_usage_history ADD CONSTRAINT recipe_usage_history_pkey PRIMARY KEY (id);
ALTER TABLE recipes ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);
ALTER TABLE royal_recipes_posts ADD CONSTRAINT royal_recipes_posts_pkey PRIMARY KEY (id);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE user_deworming_records ADD CONSTRAINT user_deworming_records_pkey PRIMARY KEY (id);
ALTER TABLE user_health_checkup_recommendations ADD CONSTRAINT user_health_checkup_recommendations_pkey PRIMARY KEY (id);
ALTER TABLE user_health_checkup_records ADD CONSTRAINT user_health_checkup_records_pkey PRIMARY KEY (id);
ALTER TABLE user_health_profiles ADD CONSTRAINT user_health_profiles_pkey PRIMARY KEY (id);
ALTER TABLE user_infection_risk_scores ADD CONSTRAINT user_infection_risk_scores_pkey PRIMARY KEY (id);
ALTER TABLE user_notification_settings ADD CONSTRAINT user_notification_settings_pkey PRIMARY KEY (id);
ALTER TABLE user_periodic_health_services ADD CONSTRAINT user_periodic_health_services_pkey PRIMARY KEY (id);
ALTER TABLE user_periodic_service_reminders ADD CONSTRAINT user_periodic_service_reminders_pkey PRIMARY KEY (id);
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE user_travel_risk_assessments ADD CONSTRAINT user_travel_risk_assessments_pkey PRIMARY KEY (id);
ALTER TABLE user_vaccination_records ADD CONSTRAINT user_vaccination_records_pkey PRIMARY KEY (id);
ALTER TABLE user_vaccination_schedules ADD CONSTRAINT user_vaccination_schedules_pkey PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE vaccination_notification_logs ADD CONSTRAINT vaccination_notification_logs_pkey PRIMARY KEY (id);
ALTER TABLE weekly_diet_plans ADD CONSTRAINT weekly_diet_plans_pkey PRIMARY KEY (id);
ALTER TABLE weekly_nutrition_stats ADD CONSTRAINT weekly_nutrition_stats_pkey PRIMARY KEY (id);
ALTER TABLE weekly_shopping_lists ADD CONSTRAINT weekly_shopping_lists_pkey PRIMARY KEY (id);

-- ============================================================================
-- 3. FOREIGN KEY 제약조건 (관계성)
-- ============================================================================

ALTER TABLE allergy_derived_ingredients 
  ADD CONSTRAINT allergy_derived_ingredients_allergy_code_fkey 
  FOREIGN KEY (allergy_code) REFERENCES allergies(code);

ALTER TABLE calorie_calculation_formulas 
  ADD CONSTRAINT calorie_calculation_formulas_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE consent_records 
  ADD CONSTRAINT fk_consent_records_clerk_user 
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_id);

ALTER TABLE consent_records 
  ADD CONSTRAINT consent_records_verification_id_fkey 
  FOREIGN KEY (verification_id) REFERENCES identity_verifications(id);

ALTER TABLE diet_notification_settings 
  ADD CONSTRAINT diet_notification_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE diet_plans 
  ADD CONSTRAINT diet_plans_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE diet_plans 
  ADD CONSTRAINT diet_plans_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE diet_plans 
  ADD CONSTRAINT diet_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE disease_excluded_foods_extended 
  ADD CONSTRAINT disease_excluded_foods_extended_disease_code_fkey 
  FOREIGN KEY (disease_code) REFERENCES diseases(code);

ALTER TABLE disease_records 
  ADD CONSTRAINT disease_records_data_source_id_fkey 
  FOREIGN KEY (data_source_id) REFERENCES health_data_sources(id);

ALTER TABLE disease_records 
  ADD CONSTRAINT disease_records_disease_code_fkey 
  FOREIGN KEY (disease_code) REFERENCES diseases(code);

ALTER TABLE disease_records 
  ADD CONSTRAINT disease_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE disease_records 
  ADD CONSTRAINT disease_records_hospital_record_id_fkey 
  FOREIGN KEY (hospital_record_id) REFERENCES hospital_records(id);

ALTER TABLE disease_records 
  ADD CONSTRAINT disease_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE emergency_procedures 
  ADD CONSTRAINT emergency_procedures_allergy_code_fkey 
  FOREIGN KEY (allergy_code) REFERENCES allergies(code);

ALTER TABLE family_members 
  ADD CONSTRAINT family_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE favorite_meals 
  ADD CONSTRAINT favorite_meals_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE favorite_meals 
  ADD CONSTRAINT favorite_meals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE health_dashboard_cache 
  ADD CONSTRAINT health_dashboard_cache_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE health_dashboard_cache 
  ADD CONSTRAINT health_dashboard_cache_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE health_data_sources 
  ADD CONSTRAINT health_data_sources_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE health_data_sync_logs 
  ADD CONSTRAINT health_data_sync_logs_data_source_id_fkey 
  FOREIGN KEY (data_source_id) REFERENCES health_data_sources(id);

ALTER TABLE health_data_sync_logs 
  ADD CONSTRAINT health_data_sync_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE health_notifications 
  ADD CONSTRAINT health_notifications_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE health_notifications 
  ADD CONSTRAINT health_notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE hospital_records 
  ADD CONSTRAINT hospital_records_data_source_id_fkey 
  FOREIGN KEY (data_source_id) REFERENCES health_data_sources(id);

ALTER TABLE hospital_records 
  ADD CONSTRAINT hospital_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE hospital_records 
  ADD CONSTRAINT hospital_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE identity_verifications 
  ADD CONSTRAINT fk_identity_verifications_clerk_user 
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_id);

ALTER TABLE identity_verifications 
  ADD CONSTRAINT fk_identity_verifications_family_member 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE legacy_documents 
  ADD CONSTRAINT legacy_documents_video_id_fkey 
  FOREIGN KEY (video_id) REFERENCES legacy_videos(id);

ALTER TABLE legacy_videos 
  ADD CONSTRAINT legacy_videos_master_id_fkey 
  FOREIGN KEY (master_id) REFERENCES legacy_masters(id);

ALTER TABLE meal_kits 
  ADD CONSTRAINT meal_kits_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE medication_records 
  ADD CONSTRAINT medication_records_data_source_id_fkey 
  FOREIGN KEY (data_source_id) REFERENCES health_data_sources(id);

ALTER TABLE medication_records 
  ADD CONSTRAINT medication_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE medication_records 
  ADD CONSTRAINT medication_records_hospital_record_id_fkey 
  FOREIGN KEY (hospital_record_id) REFERENCES hospital_records(id);

ALTER TABLE medication_records 
  ADD CONSTRAINT medication_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE medication_reminder_logs 
  ADD CONSTRAINT medication_reminder_logs_medication_record_id_fkey 
  FOREIGN KEY (medication_record_id) REFERENCES medication_records(id);

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE payment_transactions 
  ADD CONSTRAINT payment_transactions_subscription_id_fkey 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

ALTER TABLE payment_transactions 
  ADD CONSTRAINT payment_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE promo_code_uses 
  ADD CONSTRAINT promo_code_uses_promo_code_id_fkey 
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);

ALTER TABLE promo_code_uses 
  ADD CONSTRAINT promo_code_uses_subscription_id_fkey 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

ALTER TABLE promo_code_uses 
  ADD CONSTRAINT promo_code_uses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE promo_codes 
  ADD CONSTRAINT promo_codes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE recipe_ingredients 
  ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_ratings 
  ADD CONSTRAINT recipe_ratings_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_ratings 
  ADD CONSTRAINT recipe_ratings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE recipe_reports 
  ADD CONSTRAINT recipe_reports_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_reports 
  ADD CONSTRAINT recipe_reports_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE recipe_steps 
  ADD CONSTRAINT recipe_steps_recipe_id_fkey 
  FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_usage_history 
  ADD CONSTRAINT recipe_usage_history_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE recipe_usage_history 
  ADD CONSTRAINT recipe_usage_history_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE recipes 
  ADD CONSTRAINT recipes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_deworming_records 
  ADD CONSTRAINT user_deworming_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_deworming_records 
  ADD CONSTRAINT user_deworming_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_health_checkup_recommendations 
  ADD CONSTRAINT user_health_checkup_recommendations_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_health_checkup_recommendations 
  ADD CONSTRAINT user_health_checkup_recommendations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_health_checkup_records 
  ADD CONSTRAINT user_health_checkup_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_health_checkup_records 
  ADD CONSTRAINT user_health_checkup_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_health_profiles 
  ADD CONSTRAINT user_health_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_infection_risk_scores 
  ADD CONSTRAINT user_infection_risk_scores_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_infection_risk_scores 
  ADD CONSTRAINT user_infection_risk_scores_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_notification_settings 
  ADD CONSTRAINT user_notification_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_periodic_health_services 
  ADD CONSTRAINT user_periodic_health_services_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_periodic_health_services 
  ADD CONSTRAINT user_periodic_health_services_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_periodic_service_reminders 
  ADD CONSTRAINT user_periodic_service_reminders_service_id_fkey 
  FOREIGN KEY (service_id) REFERENCES user_periodic_health_services(id);

ALTER TABLE user_periodic_service_reminders 
  ADD CONSTRAINT user_periodic_service_reminders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_travel_risk_assessments 
  ADD CONSTRAINT user_travel_risk_assessments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_vaccination_records 
  ADD CONSTRAINT user_vaccination_records_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_vaccination_records 
  ADD CONSTRAINT user_vaccination_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_vaccination_schedules 
  ADD CONSTRAINT user_vaccination_schedules_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE user_vaccination_schedules 
  ADD CONSTRAINT user_vaccination_schedules_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE vaccination_notification_logs 
  ADD CONSTRAINT vaccination_notification_logs_family_member_id_fkey 
  FOREIGN KEY (family_member_id) REFERENCES family_members(id);

ALTER TABLE vaccination_notification_logs 
  ADD CONSTRAINT vaccination_notification_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE vaccination_notification_logs 
  ADD CONSTRAINT vaccination_notification_logs_vaccination_record_id_fkey 
  FOREIGN KEY (vaccination_record_id) REFERENCES user_vaccination_records(id);

ALTER TABLE vaccination_notification_logs 
  ADD CONSTRAINT vaccination_notification_logs_vaccination_schedule_id_fkey 
  FOREIGN KEY (vaccination_schedule_id) REFERENCES user_vaccination_schedules(id);

ALTER TABLE weekly_diet_plans 
  ADD CONSTRAINT weekly_diet_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE weekly_nutrition_stats 
  ADD CONSTRAINT weekly_nutrition_stats_weekly_diet_plan_id_fkey 
  FOREIGN KEY (weekly_diet_plan_id) REFERENCES weekly_diet_plans(id);

ALTER TABLE weekly_shopping_lists 
  ADD CONSTRAINT weekly_shopping_lists_weekly_diet_plan_id_fkey 
  FOREIGN KEY (weekly_diet_plan_id) REFERENCES weekly_diet_plans(id);

-- ============================================================================
-- 4. UNIQUE 제약조건
-- ============================================================================

ALTER TABLE admin_copy_blocks 
  ADD CONSTRAINT admin_copy_blocks_slug_locale_unique 
  UNIQUE (slug, locale);

ALTER TABLE allergies 
  ADD CONSTRAINT allergies_code_key 
  UNIQUE (code);

ALTER TABLE calorie_calculation_formulas 
  ADD CONSTRAINT calorie_calculation_formulas_formula_name_key 
  UNIQUE (formula_name);

ALTER TABLE deworming_medications 
  ADD CONSTRAINT deworming_medications_medication_name_key 
  UNIQUE (medication_name);

ALTER TABLE diet_notification_settings 
  ADD CONSTRAINT diet_notification_settings_user_id_unique 
  UNIQUE (user_id);

ALTER TABLE diseases 
  ADD CONSTRAINT diseases_code_key 
  UNIQUE (code);

ALTER TABLE favorite_meals 
  ADD CONSTRAINT favorite_meals_user_recipe_unique 
  UNIQUE (user_id, recipe_id);

ALTER TABLE foodsafety_recipes_cache 
  ADD CONSTRAINT foodsafety_recipes_cache_rcp_seq_key 
  UNIQUE (rcp_seq);

ALTER TABLE health_dashboard_cache 
  ADD CONSTRAINT health_dashboard_cache_unique 
  UNIQUE (user_id, family_member_id, cache_key);

ALTER TABLE health_data_sources 
  ADD CONSTRAINT health_data_sources_user_source_unique 
  UNIQUE (user_id, source_type, source_name);

ALTER TABLE image_cache_stats 
  ADD CONSTRAINT image_cache_stats_stat_date_key 
  UNIQUE (stat_date);

ALTER TABLE kcdc_health_checkup_statistics 
  ADD CONSTRAINT kcdc_health_checkup_statistics_unique 
  UNIQUE (checkup_type, age_group, gender, year);

ALTER TABLE legacy_videos 
  ADD CONSTRAINT legacy_videos_slug_key 
  UNIQUE (slug);

ALTER TABLE meal_kit_products 
  ADD CONSTRAINT meal_kit_products_coupang_product_id_key 
  UNIQUE (coupang_product_id);

ALTER TABLE medication_interactions 
  ADD CONSTRAINT medication_interactions_unique 
  UNIQUE (medication_a, medication_b);

ALTER TABLE payment_transactions 
  ADD CONSTRAINT payment_transactions_pg_transaction_id_key 
  UNIQUE (pg_transaction_id);

ALTER TABLE promo_code_uses 
  ADD CONSTRAINT promo_code_uses_promo_user_unique 
  UNIQUE (promo_code_id, user_id);

ALTER TABLE promo_codes 
  ADD CONSTRAINT promo_codes_code_key 
  UNIQUE (code);

ALTER TABLE recipe_ratings 
  ADD CONSTRAINT recipe_ratings_recipe_user_unique 
  UNIQUE (recipe_id, user_id);

ALTER TABLE recipes 
  ADD CONSTRAINT recipes_slug_key 
  UNIQUE (slug);

ALTER TABLE royal_recipes_posts 
  ADD CONSTRAINT royal_recipes_posts_slug_key 
  UNIQUE (slug);

ALTER TABLE user_health_profiles 
  ADD CONSTRAINT user_health_profiles_user_id_unique 
  UNIQUE (user_id);

ALTER TABLE user_notification_settings 
  ADD CONSTRAINT user_notification_settings_user_id_unique 
  UNIQUE (user_id);

ALTER TABLE user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_unique 
  UNIQUE (user_id);

ALTER TABLE users 
  ADD CONSTRAINT users_clerk_id_key 
  UNIQUE (clerk_id);

ALTER TABLE users 
  ADD CONSTRAINT users_clerk_id_unique 
  UNIQUE (clerk_id);

ALTER TABLE weekly_diet_plans 
  ADD CONSTRAINT weekly_diet_plans_user_week_unique 
  UNIQUE (user_id, week_number, week_year);

ALTER TABLE weekly_nutrition_stats 
  ADD CONSTRAINT weekly_nutrition_stats_plan_day_unique 
  UNIQUE (weekly_diet_plan_id, day_of_week);

-- ============================================================================
-- 문서 끝
-- ============================================================================


