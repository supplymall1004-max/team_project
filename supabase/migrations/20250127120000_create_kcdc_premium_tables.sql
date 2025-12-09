-- ============================================================================
-- KCDC 프리미엄 기능 데이터베이스 스키마 확장 마이그레이션
-- 작성일: 2025-01-27
-- 설명: Phase 1과 Phase 9 요구사항에 따른 KCDC 프리미엄 기능 테이블 생성 및 기존 테이블 확장
-- ============================================================================

-- ============================================================================
-- 1. 새 테이블 생성 (Phase 1)
-- ============================================================================

-- 사용자 감염병 위험 지수 테이블
CREATE TABLE IF NOT EXISTS user_infection_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
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

COMMENT ON TABLE user_infection_risk_scores IS '사용자별 감염병 위험 지수 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_infection_risk_scores.risk_score IS '위험 지수 (0-100)';
COMMENT ON COLUMN user_infection_risk_scores.risk_level IS '위험 등급: low, moderate, high, critical';
COMMENT ON COLUMN user_infection_risk_scores.factors IS '위험 요인 상세 (기저질환, 백신 접종 여부, 연령대 등)';
COMMENT ON COLUMN user_infection_risk_scores.recommendations IS '구체적 행동 지침 배열';

-- 사용자 예방접종 기록 테이블
CREATE TABLE IF NOT EXISTS user_vaccination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
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

COMMENT ON TABLE user_vaccination_records IS '사용자별 예방접종 기록 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_vaccination_records.dose_number IS '접종 차수 (예: 1차, 2차)';
COMMENT ON COLUMN user_vaccination_records.total_doses IS '총 접종 차수';

-- 사용자 예방접종 일정 테이블
CREATE TABLE IF NOT EXISTS user_vaccination_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    recommended_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('required', 'recommended', 'optional')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    source TEXT NOT NULL DEFAULT 'kcdc' CHECK (source IN ('kcdc', 'user_input')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_vaccination_schedules IS '예방접종 일정 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_vaccination_schedules.priority IS '우선순위: required(필수), recommended(권장), optional(선택)';
COMMENT ON COLUMN user_vaccination_schedules.status IS '상태: pending(예정), completed(완료), skipped(건너뜀)';
COMMENT ON COLUMN user_vaccination_schedules.source IS '출처: kcdc(KCDC 권장), user_input(사용자 입력)';

-- 사용자 여행 위험도 평가 테이블
CREATE TABLE IF NOT EXISTS user_travel_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_country TEXT NOT NULL,
    destination_region TEXT,
    travel_start_date DATE NOT NULL,
    travel_end_date DATE NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    disease_alerts JSONB DEFAULT '[]'::jsonb,
    prevention_checklist JSONB DEFAULT '[]'::jsonb,
    vaccination_requirements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT travel_dates_valid CHECK (travel_end_date >= travel_start_date)
);

COMMENT ON TABLE user_travel_risk_assessments IS '여행 위험도 평가 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_travel_risk_assessments.disease_alerts IS '해당 지역 감염병 경보 정보';
COMMENT ON COLUMN user_travel_risk_assessments.prevention_checklist IS '예방 물품/행동 체크리스트';
COMMENT ON COLUMN user_travel_risk_assessments.vaccination_requirements IS '필수/권장 백신 목록';

-- 사용자 건강검진 기록 테이블
CREATE TABLE IF NOT EXISTS user_health_checkup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    checkup_type TEXT NOT NULL CHECK (checkup_type IN ('national', 'cancer', 'special')),
    checkup_date DATE NOT NULL,
    checkup_site TEXT,
    checkup_site_address TEXT,
    results JSONB DEFAULT '{}'::jsonb,
    next_recommended_date DATE,
    overdue_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_health_checkup_records IS '건강검진 기록 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_health_checkup_records.checkup_type IS '검진 유형: national(국가건강검진), cancer(암검진), special(특수검진)';
COMMENT ON COLUMN user_health_checkup_records.results IS '검진 결과 데이터 (항목별 수치)';
COMMENT ON COLUMN user_health_checkup_records.overdue_days IS '연체 일수 (NULL 가능)';

-- 사용자 건강검진 권장 일정 테이블
CREATE TABLE IF NOT EXISTS user_health_checkup_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    checkup_type TEXT NOT NULL,
    checkup_name TEXT NOT NULL,
    recommended_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    overdue BOOLEAN DEFAULT false,
    last_checkup_date DATE,
    age_requirement TEXT,
    gender_requirement TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_health_checkup_recommendations IS '건강검진 권장 일정 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_health_checkup_recommendations.priority IS '우선순위: high(높음), medium(보통), low(낮음)';
COMMENT ON COLUMN user_health_checkup_recommendations.overdue IS '연체 여부';

-- KCDC 감염병 발생 정보 캐시 테이블 (확장)
CREATE TABLE IF NOT EXISTS kcdc_disease_outbreaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_name TEXT NOT NULL,
    disease_code TEXT,
    region TEXT NOT NULL,
    outbreak_date DATE NOT NULL,
    case_count INTEGER DEFAULT 0,
    severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
    alert_level TEXT,
    description TEXT,
    source_url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kcdc_disease_outbreaks IS '감염병 발생 정보 캐시 테이블 (KCDC API 확장)';
COMMENT ON COLUMN kcdc_disease_outbreaks.alert_level IS '경보 단계';
COMMENT ON COLUMN kcdc_disease_outbreaks.is_active IS '활성 상태 (만료된 데이터는 false)';

-- KCDC 건강검진 통계 캐시 테이블
CREATE TABLE IF NOT EXISTS kcdc_health_checkup_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkup_type TEXT NOT NULL,
    age_group TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'all')),
    year INTEGER NOT NULL,
    average_values JSONB DEFAULT '{}'::jsonb,
    normal_ranges JSONB DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT kcdc_health_checkup_statistics_unique UNIQUE(checkup_type, age_group, gender, year)
);

COMMENT ON TABLE kcdc_health_checkup_statistics IS '건강검진 통계 캐시 테이블 (KCDC API 확장)';
COMMENT ON COLUMN kcdc_health_checkup_statistics.average_values IS '평균 수치 (콜레스테롤, 혈압 등)';
COMMENT ON COLUMN kcdc_health_checkup_statistics.normal_ranges IS '정상 범위';

-- ============================================================================
-- 2. Phase 9: 주기적 건강 관리 서비스 테이블
-- ============================================================================

-- 사용자 주기적 건강 관리 서비스 테이블
CREATE TABLE IF NOT EXISTS user_periodic_health_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('vaccination', 'checkup', 'deworming', 'disease_management', 'other')),
    service_name TEXT NOT NULL,
    cycle_type TEXT NOT NULL CHECK (cycle_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    cycle_days INTEGER,
    last_service_date DATE,
    next_service_date DATE,
    reminder_days_before INTEGER DEFAULT 7,
    reminder_enabled BOOLEAN DEFAULT true,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT cycle_days_required CHECK (
        (cycle_type = 'custom' AND cycle_days IS NOT NULL) OR
        (cycle_type != 'custom')
    )
);

COMMENT ON TABLE user_periodic_health_services IS '주기적 건강 관리 서비스 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_periodic_health_services.service_type IS '서비스 유형: vaccination(예방접종), checkup(건강검진), deworming(구충제), disease_management(질병관리), other(기타)';
COMMENT ON COLUMN user_periodic_health_services.cycle_type IS '주기 유형: daily(일), weekly(주), monthly(월), quarterly(분기), yearly(연), custom(사용자 정의)';
COMMENT ON COLUMN user_periodic_health_services.cycle_days IS '주기 일수 (custom인 경우 필수)';

-- 사용자 구충제 복용 기록 테이블
CREATE TABLE IF NOT EXISTS user_deworming_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
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

COMMENT ON TABLE user_deworming_records IS '구충제 복용 기록 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_deworming_records.cycle_days IS '복용 주기 (일반적으로 90일 또는 180일)';
COMMENT ON COLUMN user_deworming_records.prescribed_by IS '처방 의사/기관 (NULL 가능)';

-- 구충제 마스터 데이터 테이블
CREATE TABLE IF NOT EXISTS deworming_medications (
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

COMMENT ON TABLE deworming_medications IS '구충제 마스터 데이터 테이블';
COMMENT ON COLUMN deworming_medications.target_parasites IS '대상 기생충 배열';
COMMENT ON COLUMN deworming_medications.contraindications IS '금기 사항 배열';

-- 사용자 주기적 서비스 알림 로그 테이블
CREATE TABLE IF NOT EXISTS user_periodic_service_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES user_periodic_health_services(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('push', 'email', 'sms', 'in_app')),
    reminder_date DATE NOT NULL,
    service_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_periodic_service_reminders IS '주기적 서비스 알림 로그 테이블';
COMMENT ON COLUMN user_periodic_service_reminders.reminder_type IS '알림 유형: push(푸시), email(이메일), sms(SMS), in_app(앱 내 알림)';
COMMENT ON COLUMN user_periodic_service_reminders.status IS '상태: sent(전송됨), failed(실패), dismissed(무시됨)';

-- ============================================================================
-- 3. 사용자 알림 설정 테이블 생성 (Phase 9)
-- ============================================================================

-- 사용자 알림 설정 테이블 (새로 생성)
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    periodic_services_enabled BOOLEAN DEFAULT true,
    periodic_services_reminder_days INTEGER DEFAULT 7,
    deworming_reminders_enabled BOOLEAN DEFAULT true,
    vaccination_reminders_enabled BOOLEAN DEFAULT true,
    checkup_reminders_enabled BOOLEAN DEFAULT true,
    infection_risk_alerts_enabled BOOLEAN DEFAULT true,
    travel_risk_alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_notification_settings_user_id_unique UNIQUE(user_id)
);

COMMENT ON TABLE user_notification_settings IS '사용자 알림 설정 테이블 (프리미엄 기능)';
COMMENT ON COLUMN user_notification_settings.periodic_services_enabled IS '주기적 서비스 알림 활성화';
COMMENT ON COLUMN user_notification_settings.periodic_services_reminder_days IS '알림 일수 전 (기본값 7일)';
COMMENT ON COLUMN user_notification_settings.deworming_reminders_enabled IS '구충제 복용 알림 활성화';

-- ============================================================================
-- 4. 기존 테이블 확장
-- ============================================================================

-- user_health_profiles 테이블 확장
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS vaccination_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_health_checkup_date DATE,
ADD COLUMN IF NOT EXISTS region TEXT;

COMMENT ON COLUMN user_health_profiles.vaccination_history IS '과거 접종 이력 요약 (JSONB 배열)';
COMMENT ON COLUMN user_health_profiles.last_health_checkup_date IS '마지막 건강검진 일자';
COMMENT ON COLUMN user_health_profiles.region IS '거주 지역 (시/도 단위)';

-- family_members 테이블 확장
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS vaccination_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_health_checkup_date DATE;

COMMENT ON COLUMN family_members.vaccination_history IS '과거 접종 이력 (JSONB 배열)';
COMMENT ON COLUMN family_members.last_health_checkup_date IS '마지막 건강검진 일자';

-- ============================================================================
-- 5. 인덱스 생성
-- ============================================================================

-- user_infection_risk_scores 인덱스
CREATE INDEX IF NOT EXISTS idx_user_infection_risk_scores_user_id ON user_infection_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_infection_risk_scores_family_member_id ON user_infection_risk_scores(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_infection_risk_scores_calculated_at ON user_infection_risk_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_infection_risk_scores_expires_at ON user_infection_risk_scores(expires_at) WHERE expires_at IS NOT NULL;

-- user_vaccination_records 인덱스
CREATE INDEX IF NOT EXISTS idx_user_vaccination_records_user_id ON user_vaccination_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_records_family_member_id ON user_vaccination_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_records_completed_date ON user_vaccination_records(completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_records_scheduled_date ON user_vaccination_records(scheduled_date);

-- user_vaccination_schedules 인덱스
CREATE INDEX IF NOT EXISTS idx_user_vaccination_schedules_user_id ON user_vaccination_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_schedules_family_member_id ON user_vaccination_schedules(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_schedules_recommended_date ON user_vaccination_schedules(recommended_date);
CREATE INDEX IF NOT EXISTS idx_user_vaccination_schedules_status ON user_vaccination_schedules(status);

-- user_travel_risk_assessments 인덱스
CREATE INDEX IF NOT EXISTS idx_user_travel_risk_assessments_user_id ON user_travel_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_travel_risk_assessments_travel_start_date ON user_travel_risk_assessments(travel_start_date);

-- user_health_checkup_records 인덱스
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_records_user_id ON user_health_checkup_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_records_family_member_id ON user_health_checkup_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_records_checkup_date ON user_health_checkup_records(checkup_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_records_next_recommended_date ON user_health_checkup_records(next_recommended_date);

-- user_health_checkup_recommendations 인덱스
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_recommendations_user_id ON user_health_checkup_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_recommendations_family_member_id ON user_health_checkup_recommendations(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_recommendations_recommended_date ON user_health_checkup_recommendations(recommended_date);
CREATE INDEX IF NOT EXISTS idx_user_health_checkup_recommendations_overdue ON user_health_checkup_recommendations(overdue) WHERE overdue = true;

-- kcdc_disease_outbreaks 인덱스
CREATE INDEX IF NOT EXISTS idx_kcdc_disease_outbreaks_region ON kcdc_disease_outbreaks(region);
CREATE INDEX IF NOT EXISTS idx_kcdc_disease_outbreaks_outbreak_date ON kcdc_disease_outbreaks(outbreak_date DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_disease_outbreaks_is_active ON kcdc_disease_outbreaks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kcdc_disease_outbreaks_disease_code ON kcdc_disease_outbreaks(disease_code) WHERE disease_code IS NOT NULL;

-- kcdc_health_checkup_statistics 인덱스
CREATE INDEX IF NOT EXISTS idx_kcdc_health_checkup_statistics_checkup_type ON kcdc_health_checkup_statistics(checkup_type);
CREATE INDEX IF NOT EXISTS idx_kcdc_health_checkup_statistics_age_group ON kcdc_health_checkup_statistics(age_group);
CREATE INDEX IF NOT EXISTS idx_kcdc_health_checkup_statistics_year ON kcdc_health_checkup_statistics(year DESC);

-- user_periodic_health_services 인덱스
CREATE INDEX IF NOT EXISTS idx_user_periodic_health_services_user_id ON user_periodic_health_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_periodic_health_services_family_member_id ON user_periodic_health_services(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_periodic_health_services_next_service_date ON user_periodic_health_services(next_service_date);
CREATE INDEX IF NOT EXISTS idx_user_periodic_health_services_is_active ON user_periodic_health_services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_periodic_health_services_service_type ON user_periodic_health_services(service_type);

-- user_deworming_records 인덱스
CREATE INDEX IF NOT EXISTS idx_user_deworming_records_user_id ON user_deworming_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deworming_records_family_member_id ON user_deworming_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_deworming_records_taken_date ON user_deworming_records(taken_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_deworming_records_next_due_date ON user_deworming_records(next_due_date);

-- user_periodic_service_reminders 인덱스
CREATE INDEX IF NOT EXISTS idx_user_periodic_service_reminders_user_id ON user_periodic_service_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_periodic_service_reminders_service_id ON user_periodic_service_reminders(service_id);
CREATE INDEX IF NOT EXISTS idx_user_periodic_service_reminders_reminder_date ON user_periodic_service_reminders(reminder_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_periodic_service_reminders_status ON user_periodic_service_reminders(status);

-- user_notification_settings 인덱스
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);

-- ============================================================================
-- 6. 트리거 및 함수 생성
-- ============================================================================

-- updated_at 자동 업데이트 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_infection_risk_scores 트리거
DROP TRIGGER IF EXISTS trigger_user_infection_risk_scores_updated_at ON user_infection_risk_scores;
CREATE TRIGGER trigger_user_infection_risk_scores_updated_at
    BEFORE UPDATE ON user_infection_risk_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_vaccination_records 트리거
DROP TRIGGER IF EXISTS trigger_user_vaccination_records_updated_at ON user_vaccination_records;
CREATE TRIGGER trigger_user_vaccination_records_updated_at
    BEFORE UPDATE ON user_vaccination_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_vaccination_schedules 트리거
DROP TRIGGER IF EXISTS trigger_user_vaccination_schedules_updated_at ON user_vaccination_schedules;
CREATE TRIGGER trigger_user_vaccination_schedules_updated_at
    BEFORE UPDATE ON user_vaccination_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_travel_risk_assessments 트리거
DROP TRIGGER IF EXISTS trigger_user_travel_risk_assessments_updated_at ON user_travel_risk_assessments;
CREATE TRIGGER trigger_user_travel_risk_assessments_updated_at
    BEFORE UPDATE ON user_travel_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_health_checkup_records 트리거
DROP TRIGGER IF EXISTS trigger_user_health_checkup_records_updated_at ON user_health_checkup_records;
CREATE TRIGGER trigger_user_health_checkup_records_updated_at
    BEFORE UPDATE ON user_health_checkup_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_health_checkup_recommendations 트리거
DROP TRIGGER IF EXISTS trigger_user_health_checkup_recommendations_updated_at ON user_health_checkup_recommendations;
CREATE TRIGGER trigger_user_health_checkup_recommendations_updated_at
    BEFORE UPDATE ON user_health_checkup_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- kcdc_disease_outbreaks 트리거
DROP TRIGGER IF EXISTS trigger_kcdc_disease_outbreaks_updated_at ON kcdc_disease_outbreaks;
CREATE TRIGGER trigger_kcdc_disease_outbreaks_updated_at
    BEFORE UPDATE ON kcdc_disease_outbreaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- kcdc_health_checkup_statistics 트리거
DROP TRIGGER IF EXISTS trigger_kcdc_health_checkup_statistics_updated_at ON kcdc_health_checkup_statistics;
CREATE TRIGGER trigger_kcdc_health_checkup_statistics_updated_at
    BEFORE UPDATE ON kcdc_health_checkup_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_periodic_health_services 트리거
DROP TRIGGER IF EXISTS trigger_user_periodic_health_services_updated_at ON user_periodic_health_services;
CREATE TRIGGER trigger_user_periodic_health_services_updated_at
    BEFORE UPDATE ON user_periodic_health_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_deworming_records 트리거
DROP TRIGGER IF EXISTS trigger_user_deworming_records_updated_at ON user_deworming_records;
CREATE TRIGGER trigger_user_deworming_records_updated_at
    BEFORE UPDATE ON user_deworming_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_notification_settings 트리거
DROP TRIGGER IF EXISTS trigger_user_notification_settings_updated_at ON user_notification_settings;
CREATE TRIGGER trigger_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. RLS 비활성화 (개발 환경)
-- ============================================================================

ALTER TABLE user_infection_risk_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_vaccination_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_vaccination_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_travel_risk_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_checkup_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_checkup_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcdc_disease_outbreaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcdc_health_checkup_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_periodic_health_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_deworming_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE deworming_medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_periodic_service_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. 권한 부여
-- ============================================================================

GRANT ALL ON TABLE user_infection_risk_scores TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_vaccination_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_vaccination_schedules TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_travel_risk_assessments TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_health_checkup_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_health_checkup_recommendations TO anon, authenticated, service_role;
GRANT ALL ON TABLE kcdc_disease_outbreaks TO anon, authenticated, service_role;
GRANT ALL ON TABLE kcdc_health_checkup_statistics TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_periodic_health_services TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_deworming_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE deworming_medications TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_periodic_service_reminders TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_notification_settings TO anon, authenticated, service_role;

