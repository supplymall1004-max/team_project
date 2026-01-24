-- ============================================================================
-- Supabase to AWS RDS PostgreSQL Migration Script
-- Part 1: 마스터 데이터 및 사용자 테이블
-- ============================================================================
-- 
-- 이 스크립트는 Supabase PostgreSQL 데이터베이스를 AWS RDS PostgreSQL로 
-- 마이그레이션하기 위한 SQL 스크립트입니다.
--
-- 주의사항:
-- 1. Supabase 특수 기능(auth 스키마, RLS 정책, Extensions)은 제외되었습니다.
-- 2. 테이블 생성 순서는 외래 키 의존성을 고려하여 정렬되었습니다.
-- 3. AWS Query Editor에서 실행 시 한 번에 하나의 블록씩 실행하는 것을 권장합니다.
--
-- 실행 순서:
-- 1. Part 1: 마스터 데이터 및 사용자 테이블 (이 파일)
-- 2. Part 2: 가족 구성원 및 레시피 테이블
-- 3. Part 3: 식단 및 건강 관리 테이블
-- 4. Part 4: 알림 및 커뮤니티 테이블
-- 5. Part 5: 게임화 및 기타 테이블
-- ============================================================================

-- ============================================================================
-- 1단계: 마스터 데이터 테이블 (외래 키 없음)
-- ============================================================================

-- 알레르기 마스터 데이터
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL UNIQUE,
    name_ko VARCHAR NOT NULL,
    name_en VARCHAR,
    category VARCHAR,
    severity_level VARCHAR DEFAULT 'high' CHECK (severity_level IN ('high', 'medium', 'low')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.allergies IS '알레르기 마스터 데이터 (8대 알레르기 + 특수 알레르기)';
COMMENT ON COLUMN public.allergies.code IS '알레르기 코드 (Unique)';
COMMENT ON COLUMN public.allergies.severity_level IS '심각도 레벨: high, medium, low';

-- 질병 마스터 데이터
CREATE TABLE IF NOT EXISTS public.diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL UNIQUE,
    name_ko VARCHAR NOT NULL,
    name_en VARCHAR,
    category VARCHAR,
    description TEXT,
    calorie_adjustment_factor NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.diseases IS '질병 마스터 데이터 (당뇨, 심혈관, CKD, 통풍 등)';
COMMENT ON COLUMN public.diseases.code IS '질병 코드 (Unique)';

-- 구충제 마스터 데이터
CREATE TABLE IF NOT EXISTS public.deworming_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_name TEXT NOT NULL UNIQUE,
    active_ingredient TEXT NOT NULL,
    standard_dosage TEXT NOT NULL,
    standard_cycle_days INTEGER NOT NULL DEFAULT 90,
    target_parasites TEXT[] DEFAULT '{}',
    age_group TEXT,
    contraindications TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.deworming_medications IS '구충제 마스터 데이터 테이블';

-- 반려동물 백신 마스터 데이터
CREATE TABLE IF NOT EXISTS public.pet_vaccine_master (
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

COMMENT ON TABLE public.pet_vaccine_master IS '반려동물 백신 마스터 데이터 - AVMA/AAHA 기준 강아지/고양이 필수 백신 정보';

-- 생애주기별 예방주사 마스터 데이터
CREATE TABLE IF NOT EXISTS public.lifecycle_vaccination_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_name TEXT NOT NULL,
    vaccine_code TEXT,
    target_age_min_months INTEGER,
    target_age_max_months INTEGER,
    priority TEXT NOT NULL CHECK (priority IN ('required', 'recommended', 'optional')),
    dose_number INTEGER NOT NULL,
    total_doses INTEGER NOT NULL,
    interval_days INTEGER,
    gender_requirement TEXT CHECK (gender_requirement IN ('male', 'female', 'all')),
    description TEXT,
    source TEXT DEFAULT 'kcdc',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.lifecycle_vaccination_schedules IS '생애주기별 예방주사 마스터 데이터 테이블';

-- ============================================================================
-- 2단계: 사용자 기본 테이블
-- ============================================================================

-- 사용자 기본 정보 (중앙 허브 테이블)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT,
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
COMMENT ON COLUMN public.users.clerk_id IS 'Clerk 사용자 ID (Unique)';
COMMENT ON COLUMN public.users.is_premium IS '프리미엄 구독 여부';
COMMENT ON COLUMN public.users.trial_used_at IS '14일 무료 체험을 시작한 시각(사용자당 1회 제한용)';
COMMENT ON COLUMN public.users.bio IS '사용자 소개글';
COMMENT ON COLUMN public.users.profile_image_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.users.follower_count IS '팔로워 수 (자동 업데이트)';
COMMENT ON COLUMN public.users.following_count IS '팔로잉 수 (자동 업데이트)';
COMMENT ON COLUMN public.users.post_count IS '작성한 게시글 수 (자동 업데이트)';
COMMENT ON COLUMN public.users.game_settings IS '캐릭터창 게임 설정 (게임 활성화, 자동 이동, 사운드, 알림 등)';
COMMENT ON COLUMN public.users.home_customization IS '홈페이지 커스텀 설정 (테마, 배경, 섹션 순서 등)';

-- ============================================================================
-- 3단계: 사용자 확장 테이블 (users 의존)
-- ============================================================================

-- 사용자 건강 프로필
CREATE TABLE IF NOT EXISTS public.user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    disliked_ingredients TEXT[] DEFAULT '{}',
    excluded_ingredients JSONB DEFAULT '[]'::jsonb,
    premium_features TEXT[] DEFAULT '{}',
    height_cm INTEGER,
    weight_kg NUMERIC,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
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
    birth_date DATE,
    CONSTRAINT user_health_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_health_profiles IS '사용자 건강 프로필 - users와 1:1 관계 (UNIQUE 제약조건)';
COMMENT ON COLUMN public.user_health_profiles.gender IS '성별: male, female, other';
COMMENT ON COLUMN public.user_health_profiles.activity_level IS '활동 수준: sedentary, light, moderate, active, very_active';
COMMENT ON COLUMN public.user_health_profiles.calorie_calculation_method IS '칼로리 계산 방식 (auto: 자동 계산, manual: 수동 설정)';
COMMENT ON COLUMN public.user_health_profiles.manual_target_calories IS '사용자가 직접 설정한 목표 칼로리';
COMMENT ON COLUMN public.user_health_profiles.show_calculation_formula IS '칼로리 계산 공식 표시 여부';
COMMENT ON COLUMN public.user_health_profiles.vaccination_history IS '과거 접종 이력 요약 (JSONB 배열)';
COMMENT ON COLUMN public.user_health_profiles.last_health_checkup_date IS '마지막 건강검진 일자';
COMMENT ON COLUMN public.user_health_profiles.region IS '거주 지역 (시/도 단위)';
COMMENT ON COLUMN public.user_health_profiles.diseases IS '사용자 질병 목록 (JSON 배열)';
COMMENT ON COLUMN public.user_health_profiles.allergies IS '사용자 알레르기 목록 (JSON 배열)';
COMMENT ON COLUMN public.user_health_profiles.preferred_ingredients IS '선호 식재료 목록';
COMMENT ON COLUMN public.user_health_profiles.dietary_preferences IS '프리미엄 식단 타입 (도시락, 헬스, 다이어트, 비건 등)';
COMMENT ON COLUMN public.user_health_profiles.birth_date IS '사용자 생년월일 - 생애주기별 건강 알림을 위해 필요';

-- 사용자 구독 관리
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'single', 'premium', 'enterprise')),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_subscriptions IS '사용자 구독 관리 테이블 (레거시)';

-- 사용자 게임화 데이터
CREATE TABLE IF NOT EXISTS public.user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    last_completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_gamification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_gamification IS '사용자 게임화 데이터 테이블 - 알림 완료 포인트, 연속 완료 일수, 배지 관리';
COMMENT ON COLUMN public.user_gamification.total_points IS '총 포인트 (알림 완료 시 적립)';
COMMENT ON COLUMN public.user_gamification.streak_days IS '연속 완료 일수';
COMMENT ON COLUMN public.user_gamification.badges IS '획득한 배지 ID 배열';

-- 사용자 알림 설정
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    periodic_services_enabled BOOLEAN DEFAULT true,
    periodic_services_reminder_days INTEGER DEFAULT 7,
    deworming_reminders_enabled BOOLEAN DEFAULT true,
    vaccination_reminders_enabled BOOLEAN DEFAULT true,
    checkup_reminders_enabled BOOLEAN DEFAULT true,
    infection_risk_alerts_enabled BOOLEAN DEFAULT true,
    travel_risk_alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_notification_settings IS '사용자 알림 설정 테이블 (프리미엄 기능)';
COMMENT ON COLUMN public.user_notification_settings.periodic_services_enabled IS '주기적 서비스 알림 활성화';
COMMENT ON COLUMN public.user_notification_settings.periodic_services_reminder_days IS '알림 일수 전 (기본값 7일)';
COMMENT ON COLUMN public.user_notification_settings.deworming_reminders_enabled IS '구충제 복용 알림 활성화';

-- 사용자 푸시 알림 토큰
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_id TEXT,
    app_version TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    CONSTRAINT user_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_push_tokens IS '사용자 푸시 알림 토큰 테이블';
COMMENT ON COLUMN public.user_push_tokens.user_id IS '사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN public.user_push_tokens.token IS '푸시 알림 토큰 (FCM, APNs 등)';
COMMENT ON COLUMN public.user_push_tokens.device_type IS '디바이스 유형: ios, android, web';
COMMENT ON COLUMN public.user_push_tokens.device_id IS '디바이스 고유 ID (선택)';
COMMENT ON COLUMN public.user_push_tokens.app_version IS '앱 버전 (선택)';
COMMENT ON COLUMN public.user_push_tokens.active IS '토큰 활성화 여부';
COMMENT ON COLUMN public.user_push_tokens.last_used_at IS '마지막 사용 시간';

-- 사용자 API 키
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    api_type TEXT NOT NULL,
    api_key TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_api_keys IS '사용자가 발급받은 외부 API 키를 저장하는 테이블';
COMMENT ON COLUMN public.user_api_keys.api_type IS 'API 종류: gemini, naver_map, naver_geocoding, naver_search, pharmacy, food_safety, kcdc, weather';
COMMENT ON COLUMN public.user_api_keys.api_key IS 'API 키 값 (향후 암호화 권장)';
COMMENT ON COLUMN public.user_api_keys.metadata IS '추가 정보 (Client ID, Secret 등)';
COMMENT ON COLUMN public.user_api_keys.status IS '키 상태: active(활성), inactive(비활성)';
COMMENT ON COLUMN public.user_api_keys.last_used_at IS '마지막 사용 시간';

-- ============================================================================
-- 인덱스 생성
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id ON public.user_health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON public.user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

-- ============================================================================
-- Part 1 완료
-- ============================================================================
-- 다음 단계: Part 2 - 가족 구성원 및 레시피 테이블 실행
-- ============================================================================

