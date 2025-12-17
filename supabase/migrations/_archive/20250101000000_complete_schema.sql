-- ============================================
-- 통합 데이터베이스 스키마 (PostgreSQL/Supabase)
-- 개발용: 전체 데이터베이스 DROP 및 재생성
-- ============================================

-- ============================================
-- 1. 전체 데이터베이스 DROP (개발용)
-- ============================================

-- 테이블 삭제 (역순으로 외래키 제약조건 고려)
DROP TABLE IF EXISTS user_health_profiles CASCADE;
DROP TABLE IF EXISTS legacy_documents CASCADE;
DROP TABLE IF EXISTS favorite_meals CASCADE;
DROP TABLE IF EXISTS legacy_replacement_guides CASCADE;
DROP TABLE IF EXISTS recipe_ratings CASCADE;
DROP TABLE IF EXISTS image_cache_stats CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS disease_excluded_foods_extended CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS meal_kit_products CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS promo_code_uses CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS weekly_nutrition_stats CASCADE;
DROP TABLE IF EXISTS emergency_procedures CASCADE;
DROP TABLE IF EXISTS recipe_reports CASCADE;
DROP TABLE IF EXISTS recipe_usage_history CASCADE;
DROP TABLE IF EXISTS weekly_shopping_lists CASCADE;
DROP TABLE IF EXISTS calorie_calculation_formulas CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS diet_notification_settings CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS allergy_derived_ingredients CASCADE;
DROP TABLE IF EXISTS image_usage_logs CASCADE;
DROP TABLE IF EXISTS kcdc_alerts CASCADE;
DROP TABLE IF EXISTS royal_recipes_posts CASCADE;
DROP TABLE IF EXISTS meal_kits CASCADE;
DROP TABLE IF EXISTS image_cache_cleanup_logs CASCADE;
DROP TABLE IF EXISTS foodsafety_recipes_cache CASCADE;
DROP TABLE IF EXISTS legacy_videos CASCADE;
DROP TABLE IF EXISTS legacy_masters CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS admin_security_audit CASCADE;
DROP TABLE IF EXISTS admin_copy_blocks CASCADE;
DROP TABLE IF EXISTS diseases CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS popup_announcements CASCADE;
DROP TABLE IF EXISTS weekly_diet_plans CASCADE;

-- 함수 및 트리거 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_family_member_limit() CASCADE;

-- ENUM 타입 삭제
DROP TYPE IF EXISTS ingredient_category CASCADE;

-- ============================================
-- 2. ENUM 타입 생성
-- ============================================

CREATE TYPE ingredient_category AS ENUM ('주재료', '부재료', '양념', '소스', '기타');

-- ============================================
-- 3. 핵심 테이블 생성
-- ============================================

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    mfa_secret TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_backup_codes TEXT[],
    notification_settings JSONB DEFAULT '{"kcdcAlerts": false, "healthPopups": false, "generalNotifications": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS '사용자 기본 정보 테이블 (Clerk 인증 연동)';
COMMENT ON COLUMN users.clerk_id IS 'Clerk 사용자 ID (Unique)';
COMMENT ON COLUMN users.is_premium IS '프리미엄 구독 여부';

-- 질병 테이블
CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ko VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    category VARCHAR(100),
    description TEXT,
    calorie_adjustment_factor NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE diseases IS '질병 마스터 데이터 테이블';
COMMENT ON COLUMN diseases.code IS '질병 코드 (Unique)';

-- 알레르기 테이블
CREATE TABLE allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ko VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    category VARCHAR(100),
    severity_level VARCHAR(20) DEFAULT 'high' CHECK (severity_level IN ('high', 'medium', 'low')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE allergies IS '알레르기 마스터 데이터 테이블';
COMMENT ON COLUMN allergies.code IS '알레르기 코드 (Unique)';
COMMENT ON COLUMN allergies.severity_level IS '심각도 레벨: high, medium, low';

-- 사용자 건강 프로필
CREATE TABLE user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diseases TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    preferred_ingredients TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    excluded_ingredients JSONB DEFAULT '[]'::jsonb,
    dietary_preferences TEXT[] DEFAULT '{}',
    premium_features TEXT[] DEFAULT '{}',
    diseases_jsonb JSONB DEFAULT '[]'::jsonb,
    allergies_jsonb JSONB DEFAULT '[]'::jsonb,
    preferred_ingredients_jsonb JSONB DEFAULT '[]'::jsonb,
    dietary_preferences_jsonb JSONB DEFAULT '[]'::jsonb,
    height_cm INTEGER,
    weight_kg NUMERIC,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    daily_calorie_goal INTEGER,
    calorie_calculation_method VARCHAR(50) DEFAULT 'auto',
    manual_target_calories INTEGER,
    show_calculation_formula BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_health_profiles_user_id_unique UNIQUE(user_id)
);

COMMENT ON TABLE user_health_profiles IS '사용자 건강 프로필 정보';
COMMENT ON COLUMN user_health_profiles.gender IS '성별: male, female, other';
COMMENT ON COLUMN user_health_profiles.activity_level IS '활동 수준: sedentary, light, moderate, active, very_active';

-- 가족 구성원
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    relationship TEXT NOT NULL,
    diseases TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    height_cm INTEGER,
    weight_kg NUMERIC,
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    dietary_preferences TEXT[] DEFAULT '{}',
    include_in_unified_diet BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE family_members IS '가족 구성원 정보 (사용자당 최대 10명)';
COMMENT ON COLUMN family_members.gender IS '성별: male, female, other';
COMMENT ON COLUMN family_members.activity_level IS '활동 수준: sedentary, light, moderate, active, very_active';

-- 구독 정보
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'paused')),
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
    is_test_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE subscriptions IS '구독 정보 테이블 (결제 시스템)';
COMMENT ON COLUMN subscriptions.status IS '구독 상태: active, inactive, cancelled, paused';

-- 프로모션 코드
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
    discount_value INTEGER NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    applicable_plans TEXT[],
    new_users_only BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE promo_codes IS '프로모션 코드 테이블';
COMMENT ON COLUMN promo_codes.discount_type IS '할인 유형: percentage, fixed_amount, free_trial';

-- 레시피 테이블
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE recipes IS '레시피 기본 정보 테이블';
COMMENT ON COLUMN recipes.difficulty IS '난이도 (1~5점)';
COMMENT ON COLUMN recipes.slug IS 'URL 친화적 식별자 (Unique)';

-- 레시피 재료
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ingredient_name TEXT,
    quantity NUMERIC,
    unit TEXT,
    notes TEXT,
    display_order INTEGER NOT NULL,
    category ingredient_category DEFAULT '기타',
    is_optional BOOLEAN DEFAULT FALSE,
    preparation_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE recipe_ingredients IS '레시피 재료 정보 테이블';

-- 레시피 단계
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    timer_minutes INTEGER,
    foodsafety_manual_img TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE recipe_steps IS '레시피 조리 단계 테이블';

-- 주간 식단 계획
CREATE TABLE weekly_diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    is_family BOOLEAN DEFAULT FALSE,
    total_recipes_count INTEGER DEFAULT 0,
    generation_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT weekly_diet_plans_user_week_unique UNIQUE(user_id, week_year, week_number)
);

COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 테이블';

-- 식단 계획
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    plan_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id TEXT,
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
    is_unified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE diet_plans IS '식단 계획 테이블 (일일/주간)';
COMMENT ON COLUMN diet_plans.meal_type IS '식사 타입: breakfast, lunch, dinner, snack';

-- ============================================
-- 4. 보조 테이블
-- ============================================

-- 관리자 보안 감사
CREATE TABLE admin_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('password-change', 'mfa-enable', 'mfa-disable', 'session-revoke', 'admin-access')),
    user_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_security_audit IS '관리자 보안 감사 로그';
COMMENT ON COLUMN admin_security_audit.action IS '보안 액션: password-change, mfa-enable, mfa-disable, session-revoke, admin-access';

-- 사용자 구독 (레거시)
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'single', 'premium', 'enterprise')),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_subscriptions_user_id_unique UNIQUE(user_id)
);

COMMENT ON TABLE user_subscriptions IS '사용자 구독 관리 테이블 (레거시)';
COMMENT ON COLUMN user_subscriptions.subscription_plan IS '구독 플랜: free, single, premium, enterprise';

-- 레거시 마스터
CREATE TABLE legacy_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    bio TEXT
);

COMMENT ON TABLE legacy_masters IS '레거시 명인 정보 테이블';

-- 레거시 비디오
CREATE TABLE legacy_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID REFERENCES legacy_masters(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms')),
    ingredients TEXT[] DEFAULT '{}',
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    premium_only BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE legacy_videos IS '레거시 비디오 정보 테이블';
COMMENT ON COLUMN legacy_videos.era IS '시대: goryeo, joseon, three_kingdoms';

-- 식품안전 레시피 캐시
CREATE TABLE foodsafety_recipes_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rcp_seq TEXT NOT NULL UNIQUE,
    rcp_nm TEXT NOT NULL,
    rcp_pat2 TEXT,
    rcp_way2 TEXT,
    info_eng NUMERIC,
    info_car NUMERIC,
    info_pro NUMERIC,
    info_fat NUMERIC,
    info_na NUMERIC,
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

COMMENT ON TABLE foodsafety_recipes_cache IS '식약처 레시피 캐시 테이블';
COMMENT ON COLUMN foodsafety_recipes_cache.rcp_seq IS '식약처 레시피 순번 (Unique)';

-- 이미지 캐시 정리 로그
CREATE TABLE image_cache_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleanup_date TIMESTAMPTZ NOT NULL,
    images_removed INTEGER DEFAULT 0,
    space_freed_mb NUMERIC,
    cleanup_duration_ms INTEGER,
    cleanup_type TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE image_cache_cleanup_logs IS '이미지 캐시 정리 로그 테이블';

-- 밀키트
CREATE TABLE meal_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price INTEGER NOT NULL,
    serving_size INTEGER,
    calories INTEGER,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    category TEXT,
    meal_type TEXT[] DEFAULT '{}',
    purchase_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium_only BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE meal_kits IS '수동 등록 밀키트 제품 테이블';

-- 왕실 레시피 포스트
CREATE TABLE royal_recipes_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    era TEXT NOT NULL CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms')),
    author_id TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail_url TEXT,
    excerpt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE royal_recipes_posts IS '궁중 레시피 블로그 테이블';
COMMENT ON COLUMN royal_recipes_posts.era IS '시대: goryeo, joseon, three_kingdoms';

-- 질병관리청 알림
CREATE TABLE kcdc_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    flu_stage TEXT,
    flu_week TEXT,
    vaccine_name TEXT,
    target_age_group TEXT,
    recommended_date DATE,
    source_url TEXT,
    published_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kcdc_alerts IS '질병관리청 알림 테이블';
COMMENT ON COLUMN kcdc_alerts.severity IS '심각도: info, warning, critical';

-- 이미지 사용 로그
CREATE TABLE image_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_path TEXT NOT NULL,
    food_name TEXT,
    source_type TEXT CHECK (source_type IN ('static', 'gemini', 'placeholder')),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE image_usage_logs IS '이미지 사용 로그 테이블';
COMMENT ON COLUMN image_usage_logs.source_type IS '이미지 소스 타입: static, gemini, placeholder';

-- 알레르기 유래 재료
CREATE TABLE allergy_derived_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
    ingredient_name VARCHAR(200) NOT NULL,
    ingredient_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE allergy_derived_ingredients IS '알레르기 파생 재료 테이블';

-- 식단 알림 설정
CREATE TABLE diet_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    popup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    browser_enabled BOOLEAN DEFAULT FALSE,
    notification_time TIME DEFAULT '05:00:00',
    kcdc_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_notification_date DATE,
    last_dismissed_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT diet_notification_settings_user_id_unique UNIQUE(user_id)
);

COMMENT ON TABLE diet_notification_settings IS '식단 알림 설정 테이블';

-- 칼로리 계산 공식
CREATE TABLE calorie_calculation_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_name VARCHAR(100) NOT NULL UNIQUE,
    formula_type VARCHAR(50),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'all')),
    age_min INTEGER,
    age_max INTEGER,
    formula_expression TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE calorie_calculation_formulas IS '칼로리 계산 공식 테이블';
COMMENT ON COLUMN calorie_calculation_formulas.gender IS '성별: male, female, all';

-- 주간 쇼핑 목록
CREATE TABLE weekly_shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    total_quantity NUMERIC,
    unit TEXT,
    category TEXT,
    recipes_using JSONB DEFAULT '[]'::jsonb,
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE weekly_shopping_lists IS '주간 장보기 리스트 테이블';

-- 레시피 사용 이력
CREATE TABLE recipe_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    recipe_title TEXT NOT NULL,
    recipe_url TEXT,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    used_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE recipe_usage_history IS '레시피 사용 이력 테이블';
COMMENT ON COLUMN recipe_usage_history.meal_type IS '식사 타입: breakfast, lunch, dinner, snack';

-- 레시피 신고
CREATE TABLE recipe_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate', 'copyright', 'spam', 'other')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE recipe_reports IS '레시피 신고 테이블';
COMMENT ON COLUMN recipe_reports.report_type IS '신고 유형: inappropriate, copyright, spam, other';
COMMENT ON COLUMN recipe_reports.status IS '신고 상태: pending, reviewing, resolved, dismissed';

-- 응급 처치 절차
CREATE TABLE emergency_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allergy_code VARCHAR(50) REFERENCES allergies(code) ON DELETE CASCADE,
    procedure_type VARCHAR(50),
    title_ko VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    steps JSONB NOT NULL,
    warning_signs JSONB,
    when_to_call_911 TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE emergency_procedures IS '응급조치 정보 테이블';

-- 관리자 카피 블록
CREATE TABLE admin_copy_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    locale TEXT DEFAULT 'ko',
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT admin_copy_blocks_slug_locale_unique UNIQUE(slug, locale)
);

COMMENT ON TABLE admin_copy_blocks IS '페이지 문구 관리 테이블';

-- 주간 영양 통계
CREATE TABLE weekly_nutrition_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    date DATE NOT NULL,
    total_calories NUMERIC,
    total_carbohydrates NUMERIC,
    total_protein NUMERIC,
    total_fat NUMERIC,
    total_sodium NUMERIC,
    meal_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE weekly_nutrition_stats IS '주간 영양 통계 테이블';
COMMENT ON COLUMN weekly_nutrition_stats.day_of_week IS '요일 (0=일요일, 6=토요일)';

-- 결제 거래
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'one_time', 'refund')),
    pg_provider TEXT NOT NULL DEFAULT 'toss_payments',
    pg_transaction_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    tax_amount INTEGER,
    net_amount INTEGER NOT NULL,
    payment_method TEXT,
    card_info JSONB,
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    metadata JSONB,
    is_test_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE payment_transactions IS '결제 내역 테이블';
COMMENT ON COLUMN payment_transactions.status IS '거래 상태: pending, completed, failed, refunded';
COMMENT ON COLUMN payment_transactions.transaction_type IS '거래 유형: subscription, one_time, refund';

-- 프로모션 코드 사용
CREATE TABLE promo_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT promo_code_uses_promo_user_unique UNIQUE(promo_code_id, user_id)
);

COMMENT ON TABLE promo_code_uses IS '프로모션 코드 사용 내역 테이블';

-- 알림 로그
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('kcdc', 'diet-popup', 'system')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    payload JSONB DEFAULT '{}'::jsonb,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE notification_logs IS '알림 로그 테이블';
COMMENT ON COLUMN notification_logs.type IS '알림 타입: kcdc, diet-popup, system';
COMMENT ON COLUMN notification_logs.status IS '알림 상태: success, failed, pending';

-- 밀키트 상품
CREATE TABLE meal_kit_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupang_product_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price INTEGER NOT NULL,
    original_price INTEGER,
    discount_rate INTEGER,
    product_url TEXT NOT NULL,
    affiliate_link TEXT,
    calories INTEGER,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    category TEXT,
    meal_type TEXT[] DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'success' CHECK (sync_status IN ('success', 'failed', 'pending')),
    sync_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE meal_kit_products IS '쿠팡 API 제품 캐시 테이블';
COMMENT ON COLUMN meal_kit_products.coupang_product_id IS '쿠팡 제품 ID (Unique)';
COMMENT ON COLUMN meal_kit_products.sync_status IS '동기화 상태: success, failed, pending';

-- 팝업 공지사항
CREATE TABLE popup_announcements (
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
    display_type TEXT DEFAULT 'modal' CHECK (display_type IN ('modal', 'checkpoint')),
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE popup_announcements IS '팝업 공지 관리 테이블';
COMMENT ON COLUMN popup_announcements.status IS '공지 상태: draft, published, archived';
COMMENT ON COLUMN popup_announcements.display_type IS '표시 유형: modal, checkpoint';

-- 질병 제외 식품 확장
CREATE TABLE disease_excluded_foods_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_code VARCHAR(50) REFERENCES diseases(code) ON DELETE CASCADE,
    food_name VARCHAR(200) NOT NULL,
    food_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'high' CHECK (severity IN ('high', 'medium', 'low')),
    reason TEXT,
    exclusion_type TEXT DEFAULT 'absolute',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE disease_excluded_foods_extended IS '질병별 제외 음식 확장 테이블';
COMMENT ON COLUMN disease_excluded_foods_extended.severity IS '심각도: high, medium, low';

-- 이미지 캐시 통계
CREATE TABLE image_cache_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL UNIQUE,
    total_images INTEGER DEFAULT 0,
    static_images INTEGER DEFAULT 0,
    gemini_images INTEGER DEFAULT 0,
    placeholder_images INTEGER DEFAULT 0,
    total_access_count INTEGER DEFAULT 0,
    cache_hit_rate NUMERIC,
    storage_size_mb NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE image_cache_stats IS '이미지 캐시 통계 테이블';
COMMENT ON COLUMN image_cache_stats.stat_date IS '통계 날짜 (Unique)';

-- 레시피 평가
CREATE TABLE recipe_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating NUMERIC NOT NULL CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recipe_ratings_recipe_user_unique UNIQUE(recipe_id, user_id)
);

COMMENT ON TABLE recipe_ratings IS '레시피 평가 테이블 (별점 0~5점)';

-- 레거시 대체 가이드
CREATE TABLE legacy_replacement_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traditional JSONB NOT NULL,
    modern JSONB NOT NULL,
    tips TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE legacy_replacement_guides IS '레거시 대체 가이드 테이블';

-- 즐겨찾는 식사
CREATE TABLE favorite_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    recipe_title TEXT NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    calories INTEGER,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT favorite_meals_user_recipe_unique UNIQUE(user_id, recipe_id)
);

COMMENT ON TABLE favorite_meals IS '즐겨찾기 식단 테이블';
COMMENT ON COLUMN favorite_meals.meal_type IS '식사 타입: breakfast, lunch, dinner, snack';

-- 레거시 문서
CREATE TABLE legacy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES legacy_videos(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms')),
    ingredients JSONB DEFAULT '[]'::jsonb,
    tools JSONB DEFAULT '[]'::jsonb,
    source JSONB DEFAULT '{}'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE legacy_documents IS '레거시 문서화 기록 테이블';
COMMENT ON COLUMN legacy_documents.era IS '시대: goryeo, joseon, three_kingdoms';

-- ============================================
-- 5. 인덱스 생성 (자주 검색되는 컬럼)
-- ============================================

-- 사용자 관련 인덱스
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_birth_date ON family_members(birth_date);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- 레시피 관련 인덱스
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_title ON recipes(title);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(name);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_rating ON recipe_ratings(rating);
CREATE INDEX idx_recipe_reports_recipe_id ON recipe_reports(recipe_id);
CREATE INDEX idx_recipe_reports_user_id ON recipe_reports(user_id);
CREATE INDEX idx_recipe_reports_status ON recipe_reports(status);
CREATE INDEX idx_recipe_usage_history_user_id ON recipe_usage_history(user_id);
CREATE INDEX idx_recipe_usage_history_used_date ON recipe_usage_history(used_date);

-- 식단 관련 인덱스
CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX idx_diet_plans_family_member_id ON diet_plans(family_member_id);
CREATE INDEX idx_diet_plans_plan_date ON diet_plans(plan_date);
CREATE INDEX idx_diet_plans_meal_type ON diet_plans(meal_type);
CREATE INDEX idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX idx_weekly_diet_plans_week ON weekly_diet_plans(week_year, week_number);
CREATE INDEX idx_weekly_diet_plans_week_start_date ON weekly_diet_plans(week_start_date);
CREATE INDEX idx_weekly_shopping_lists_weekly_diet_plan_id ON weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX idx_weekly_nutrition_stats_weekly_diet_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX idx_weekly_nutrition_stats_date ON weekly_nutrition_stats(date);
CREATE INDEX idx_diet_notification_settings_user_id ON diet_notification_settings(user_id);

-- 건강 관리 관련 인덱스
CREATE INDEX idx_diseases_code ON diseases(code);
CREATE INDEX idx_allergies_code ON allergies(code);
CREATE INDEX idx_allergy_derived_ingredients_allergy_code ON allergy_derived_ingredients(allergy_code);
CREATE INDEX idx_disease_excluded_foods_extended_disease_code ON disease_excluded_foods_extended(disease_code);
CREATE INDEX idx_emergency_procedures_allergy_code ON emergency_procedures(allergy_code);
CREATE INDEX idx_calorie_calculation_formulas_formula_name ON calorie_calculation_formulas(formula_name);

-- 레거시 관련 인덱스
CREATE INDEX idx_legacy_videos_master_id ON legacy_videos(master_id);
CREATE INDEX idx_legacy_videos_slug ON legacy_videos(slug);
CREATE INDEX idx_legacy_videos_era ON legacy_videos(era);
CREATE INDEX idx_legacy_videos_region ON legacy_videos(region);
CREATE INDEX idx_legacy_documents_video_id ON legacy_documents(video_id);
CREATE INDEX idx_royal_recipes_posts_slug ON royal_recipes_posts(slug);
CREATE INDEX idx_royal_recipes_posts_era ON royal_recipes_posts(era);
CREATE INDEX idx_royal_recipes_posts_published ON royal_recipes_posts(published);

-- 결제 관련 인덱스
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_pg_transaction_id ON payment_transactions(pg_transaction_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user_id ON promo_code_uses(user_id);

-- 관리자 관련 인덱스
CREATE INDEX idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX idx_admin_copy_blocks_slug_locale ON admin_copy_blocks(slug, locale);
CREATE INDEX idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX idx_popup_announcements_active_from ON popup_announcements(active_from);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_triggered_at ON notification_logs(triggered_at);
CREATE INDEX idx_admin_security_audit_user_id ON admin_security_audit(user_id);
CREATE INDEX idx_admin_security_audit_action ON admin_security_audit(action);
CREATE INDEX idx_admin_security_audit_created_at ON admin_security_audit(created_at);

-- 기타 인덱스
CREATE INDEX idx_favorite_meals_user_id ON favorite_meals(user_id);
CREATE INDEX idx_favorite_meals_recipe_id ON favorite_meals(recipe_id);
CREATE INDEX idx_meal_kits_created_by ON meal_kits(created_by);
CREATE INDEX idx_meal_kit_products_coupang_product_id ON meal_kit_products(coupang_product_id);
CREATE INDEX idx_meal_kit_products_sync_status ON meal_kit_products(sync_status);
CREATE INDEX idx_foodsafety_recipes_cache_rcp_seq ON foodsafety_recipes_cache(rcp_seq);
CREATE INDEX idx_kcdc_alerts_is_active ON kcdc_alerts(is_active);
CREATE INDEX idx_kcdc_alerts_severity ON kcdc_alerts(severity);
CREATE INDEX idx_kcdc_alerts_published_at ON kcdc_alerts(published_at);
CREATE INDEX idx_image_usage_logs_image_path ON image_usage_logs(image_path);
CREATE INDEX idx_image_cache_stats_stat_date ON image_cache_stats(stat_date);

-- ============================================
-- 6. updated_at 자동 업데이트 트리거 함수 생성
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_at 컬럼을 자동으로 현재 시간으로 업데이트하는 트리거 함수';

-- ============================================
-- 7. updated_at 트리거 생성
-- ============================================

CREATE TRIGGER trigger_diseases_updated_at
    BEFORE UPDATE ON diseases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_allergies_updated_at
    BEFORE UPDATE ON allergies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_health_profiles_updated_at
    BEFORE UPDATE ON user_health_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recipe_ingredients_updated_at
    BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_weekly_diet_plans_updated_at
    BEFORE UPDATE ON weekly_diet_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recipe_reports_updated_at
    BEFORE UPDATE ON recipe_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_emergency_procedures_updated_at
    BEFORE UPDATE ON emergency_procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_copy_blocks_updated_at
    BEFORE UPDATE ON admin_copy_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_kcdc_alerts_updated_at
    BEFORE UPDATE ON kcdc_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meal_kits_updated_at
    BEFORE UPDATE ON meal_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_royal_recipes_posts_updated_at
    BEFORE UPDATE ON royal_recipes_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_diet_notification_settings_updated_at
    BEFORE UPDATE ON diet_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_calorie_calculation_formulas_updated_at
    BEFORE UPDATE ON calorie_calculation_formulas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meal_kit_products_updated_at
    BEFORE UPDATE ON meal_kit_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_popup_announcements_updated_at
    BEFORE UPDATE ON popup_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_disease_excluded_foods_extended_updated_at
    BEFORE UPDATE ON disease_excluded_foods_extended
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_image_cache_stats_updated_at
    BEFORE UPDATE ON image_cache_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recipe_ratings_updated_at
    BEFORE UPDATE ON recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_favorite_meals_updated_at
    BEFORE UPDATE ON favorite_meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_foodsafety_recipes_cache_updated_at
    BEFORE UPDATE ON foodsafety_recipes_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 가족 구성원 제한 함수 및 트리거 (선택사항)
-- ============================================

CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM family_members
    WHERE user_id = NEW.user_id;
    
    IF member_count >= 10 THEN
        RAISE EXCEPTION '사용자당 최대 10명의 가족 구성원만 등록할 수 있습니다.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_family_member_limit() IS '사용자당 최대 10명의 가족 구성원만 등록할 수 있도록 제한하는 함수';

CREATE TRIGGER trigger_family_members_limit
    BEFORE INSERT ON family_members
    FOR EACH ROW
    EXECUTE FUNCTION check_family_member_limit();

-- ============================================
-- 9. RLS 비활성화 (MVP용 - 개발 환경)
-- ============================================

-- 모든 테이블에 대해 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE diseases DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_masters DISABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE foodsafety_recipes_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_cleanup_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE royal_recipes_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcdc_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_derived_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_calculation_formulas DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_usage_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_procedures DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_copy_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_kit_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE popup_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE disease_excluded_foods_extended DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_replacement_guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_documents DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 완료
-- ============================================

-- 스키마 생성 완료



