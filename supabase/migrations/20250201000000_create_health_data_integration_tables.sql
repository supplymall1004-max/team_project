-- ============================================================================
-- 건강정보 자동 연동 및 예방주사 알림 서비스 데이터베이스 스키마 확장
-- 작성일: 2025-02-01
-- 설명: Phase 1 - 건강정보 자동 연동 및 예방주사 알림 관련 테이블 생성
-- 기존 스키마 관계도 유지: users → family_members, user_health_profiles
-- ============================================================================

-- ============================================================================
-- 1. 건강정보 자동 연동 관련 테이블
-- ============================================================================

-- 건강정보 데이터 소스 연결 테이블
-- 사용자가 연동한 데이터 소스 정보 저장 (마이데이터, 건강정보고속도로 등)
CREATE TABLE IF NOT EXISTS health_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('mydata', 'health_highway', 'manual')),
    source_name TEXT NOT NULL,
    connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'connected', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('daily', 'weekly', 'monthly', 'manual')),
    connection_metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT health_data_sources_user_source_unique UNIQUE(user_id, source_type, source_name)
);

COMMENT ON TABLE health_data_sources IS '건강정보 데이터 소스 연결 테이블';
COMMENT ON COLUMN health_data_sources.source_type IS '데이터 소스 유형: mydata(마이데이터), health_highway(건강정보고속도로), manual(수동입력)';
COMMENT ON COLUMN health_data_sources.connection_status IS '연결 상태: pending(대기), connected(연결됨), disconnected(연결 해제), error(오류)';
COMMENT ON COLUMN health_data_sources.connection_metadata IS '연결 메타데이터 (API 키, 토큰 등 암호화된 정보)';

-- 병원 방문 기록 테이블
-- 병원 방문 기록 저장 (진료일, 병원명, 진단명, 처방약물 등)
CREATE TABLE IF NOT EXISTS hospital_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    hospital_name TEXT NOT NULL,
    hospital_code TEXT,
    department TEXT,
    diagnosis TEXT[] DEFAULT '{}',
    diagnosis_codes TEXT[] DEFAULT '{}',
    prescribed_medications JSONB DEFAULT '[]'::jsonb,
    treatment_summary TEXT,
    data_source_id UUID REFERENCES health_data_sources(id) ON DELETE SET NULL,
    is_auto_synced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE hospital_records IS '병원 방문 기록 테이블';
COMMENT ON COLUMN hospital_records.diagnosis IS '진단명 배열';
COMMENT ON COLUMN hospital_records.diagnosis_codes IS '진단 코드 배열 (ICD-10 등)';
COMMENT ON COLUMN hospital_records.prescribed_medications IS '처방약물 정보 배열 [{name, dosage, frequency, duration}]';
COMMENT ON COLUMN hospital_records.is_auto_synced IS '자동 동기화 여부 (true: 자동 연동, false: 수동 입력)';

-- 약물 복용 기록 테이블
-- 약물 복용 기록 저장 (약물명, 복용 시작일, 종료일, 복용 시간, 용법 등)
CREATE TABLE IF NOT EXISTS medication_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    medication_code TEXT,
    active_ingredient TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    reminder_times TIME[] DEFAULT '{}',
    reminder_enabled BOOLEAN DEFAULT true,
    hospital_record_id UUID REFERENCES hospital_records(id) ON DELETE SET NULL,
    data_source_id UUID REFERENCES health_data_sources(id) ON DELETE SET NULL,
    is_auto_synced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT medication_records_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE medication_records IS '약물 복용 기록 테이블';
COMMENT ON COLUMN medication_records.reminder_times IS '복용 알림 시간 배열 (예: ["08:00", "20:00"])';
COMMENT ON COLUMN medication_records.hospital_record_id IS '처방받은 병원 기록 참조';
COMMENT ON COLUMN medication_records.is_auto_synced IS '자동 동기화 여부';

-- 질병 진단 기록 테이블
-- 질병 진단 기록 저장 (진단일, 질병명, 병원명, 현재 상태 등)
CREATE TABLE IF NOT EXISTS disease_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    disease_name TEXT NOT NULL,
    disease_code TEXT REFERENCES diseases(code) ON DELETE SET NULL,
    diagnosis_date DATE NOT NULL,
    hospital_name TEXT,
    hospital_record_id UUID REFERENCES hospital_records(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cured', 'chronic', 'monitoring')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    treatment_plan TEXT,
    data_source_id UUID REFERENCES health_data_sources(id) ON DELETE SET NULL,
    is_auto_synced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE disease_records IS '질병 진단 기록 테이블';
COMMENT ON COLUMN disease_records.status IS '질병 상태: active(치료 중), cured(완치), chronic(만성), monitoring(관찰 중)';
COMMENT ON COLUMN disease_records.disease_code IS '질병 코드 (diseases 테이블 참조)';
COMMENT ON COLUMN disease_records.hospital_record_id IS '진단받은 병원 기록 참조';

-- 건강정보 동기화 로그 테이블
-- 데이터 동기화 로그 저장 (동기화 시간, 성공/실패, 에러 메시지 등)
CREATE TABLE IF NOT EXISTS health_data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES health_data_sources(id) ON DELETE SET NULL,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'partial')),
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

COMMENT ON TABLE health_data_sync_logs IS '건강정보 동기화 로그 테이블';
COMMENT ON COLUMN health_data_sync_logs.sync_type IS '동기화 유형: full(전체), incremental(증분), manual(수동)';
COMMENT ON COLUMN health_data_sync_logs.sync_status IS '동기화 상태: success(성공), failed(실패), partial(부분 성공)';

-- ============================================================================
-- 2. 예방주사 알림 서비스 스키마 확장
-- ============================================================================

-- 예방주사 알림 로그 테이블
-- 예방주사 알림 발송 로그 저장
CREATE TABLE IF NOT EXISTS vaccination_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    vaccination_schedule_id UUID REFERENCES user_vaccination_schedules(id) ON DELETE CASCADE,
    vaccination_record_id UUID REFERENCES user_vaccination_records(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('scheduled', 'reminder', 'overdue')),
    notification_channel TEXT NOT NULL CHECK (notification_channel IN ('push', 'sms', 'email', 'in_app')),
    scheduled_date DATE NOT NULL,
    notification_sent_at TIMESTAMPTZ,
    notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sent', 'failed', 'dismissed')),
    reminder_days_before INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE vaccination_notification_logs IS '예방주사 알림 로그 테이블';
COMMENT ON COLUMN vaccination_notification_logs.notification_type IS '알림 유형: scheduled(예정), reminder(리마인더), overdue(연체)';
COMMENT ON COLUMN vaccination_notification_logs.notification_channel IS '알림 채널: push(푸시), sms(SMS), email(이메일), in_app(앱 내)';

-- 생애주기별 예방주사 마스터 데이터 테이블
-- 연령대별 필수/권장 예방주사 정보 (KCDC 데이터 기반)
CREATE TABLE IF NOT EXISTS lifecycle_vaccination_schedules (
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

COMMENT ON TABLE lifecycle_vaccination_schedules IS '생애주기별 예방주사 마스터 데이터 테이블';
COMMENT ON COLUMN lifecycle_vaccination_schedules.target_age_min_months IS '대상 연령 최소 (개월)';
COMMENT ON COLUMN lifecycle_vaccination_schedules.target_age_max_months IS '대상 연령 최대 (개월)';
COMMENT ON COLUMN lifecycle_vaccination_schedules.interval_days IS '접종 간격 (일)';

-- ============================================================================
-- 3. 기존 테이블 확장
-- ============================================================================

-- user_vaccination_schedules 테이블에 알림 관련 필드 추가
ALTER TABLE user_vaccination_schedules
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_channel TEXT DEFAULT 'push' CHECK (notification_channel IN ('push', 'sms', 'email', 'in_app')),
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

COMMENT ON COLUMN user_vaccination_schedules.notification_sent_at IS '마지막 알림 발송 시간';
COMMENT ON COLUMN user_vaccination_schedules.notification_channel IS '알림 채널';
COMMENT ON COLUMN user_vaccination_schedules.reminder_count IS '리마인더 발송 횟수';

-- user_vaccination_records 테이블에 알림 관련 필드 확인 및 추가 (이미 존재할 수 있음)
-- reminder_enabled, reminder_days_before는 이미 존재하므로 추가 확인 불필요

-- ============================================================================
-- 4. 인덱스 생성
-- ============================================================================

-- health_data_sources 인덱스
CREATE INDEX IF NOT EXISTS idx_health_data_sources_user_id ON health_data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_sources_source_type ON health_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_health_data_sources_connection_status ON health_data_sources(connection_status);
CREATE INDEX IF NOT EXISTS idx_health_data_sources_last_synced_at ON health_data_sources(last_synced_at DESC);

-- hospital_records 인덱스
CREATE INDEX IF NOT EXISTS idx_hospital_records_user_id ON hospital_records(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_records_family_member_id ON hospital_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_hospital_records_visit_date ON hospital_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_records_hospital_name ON hospital_records(hospital_name);
CREATE INDEX IF NOT EXISTS idx_hospital_records_data_source_id ON hospital_records(data_source_id);
CREATE INDEX IF NOT EXISTS idx_hospital_records_is_auto_synced ON hospital_records(is_auto_synced);

-- medication_records 인덱스
CREATE INDEX IF NOT EXISTS idx_medication_records_user_id ON medication_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_family_member_id ON medication_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_start_date ON medication_records(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_medication_records_end_date ON medication_records(end_date);
CREATE INDEX IF NOT EXISTS idx_medication_records_hospital_record_id ON medication_records(hospital_record_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_is_auto_synced ON medication_records(is_auto_synced);
-- 활성 약물 조회는 애플리케이션 레벨에서 end_date IS NULL OR end_date >= CURRENT_DATE 조건으로 필터링
CREATE INDEX IF NOT EXISTS idx_medication_records_end_date_null ON medication_records(user_id, end_date) WHERE end_date IS NULL;

-- disease_records 인덱스
CREATE INDEX IF NOT EXISTS idx_disease_records_user_id ON disease_records(user_id);
CREATE INDEX IF NOT EXISTS idx_disease_records_family_member_id ON disease_records(family_member_id);
CREATE INDEX IF NOT EXISTS idx_disease_records_disease_code ON disease_records(disease_code);
CREATE INDEX IF NOT EXISTS idx_disease_records_diagnosis_date ON disease_records(diagnosis_date DESC);
CREATE INDEX IF NOT EXISTS idx_disease_records_status ON disease_records(status);
CREATE INDEX IF NOT EXISTS idx_disease_records_hospital_record_id ON disease_records(hospital_record_id);
CREATE INDEX IF NOT EXISTS idx_disease_records_is_auto_synced ON disease_records(is_auto_synced);

-- health_data_sync_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_health_data_sync_logs_user_id ON health_data_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_logs_data_source_id ON health_data_sync_logs(data_source_id);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_logs_synced_at ON health_data_sync_logs(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_logs_sync_status ON health_data_sync_logs(sync_status);

-- vaccination_notification_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_user_id ON vaccination_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_family_member_id ON vaccination_notification_logs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_vaccination_schedule_id ON vaccination_notification_logs(vaccination_schedule_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_notification_sent_at ON vaccination_notification_logs(notification_sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_notification_status ON vaccination_notification_logs(notification_status);
CREATE INDEX IF NOT EXISTS idx_vaccination_notification_logs_scheduled_date ON vaccination_notification_logs(scheduled_date);

-- lifecycle_vaccination_schedules 인덱스
CREATE INDEX IF NOT EXISTS idx_lifecycle_vaccination_schedules_vaccine_code ON lifecycle_vaccination_schedules(vaccine_code);
CREATE INDEX IF NOT EXISTS idx_lifecycle_vaccination_schedules_priority ON lifecycle_vaccination_schedules(priority);
CREATE INDEX IF NOT EXISTS idx_lifecycle_vaccination_schedules_target_age ON lifecycle_vaccination_schedules(target_age_min_months, target_age_max_months);
CREATE INDEX IF NOT EXISTS idx_lifecycle_vaccination_schedules_is_active ON lifecycle_vaccination_schedules(is_active) WHERE is_active = true;

-- user_vaccination_schedules 인덱스 (알림 관련)
CREATE INDEX IF NOT EXISTS idx_user_vaccination_schedules_notification_sent_at ON user_vaccination_schedules(notification_sent_at) WHERE notification_sent_at IS NOT NULL;

-- ============================================================================
-- 5. 트리거 생성
-- ============================================================================

-- health_data_sources 트리거
DROP TRIGGER IF EXISTS trigger_health_data_sources_updated_at ON health_data_sources;
CREATE TRIGGER trigger_health_data_sources_updated_at
    BEFORE UPDATE ON health_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- hospital_records 트리거
DROP TRIGGER IF EXISTS trigger_hospital_records_updated_at ON hospital_records;
CREATE TRIGGER trigger_hospital_records_updated_at
    BEFORE UPDATE ON hospital_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- medication_records 트리거
DROP TRIGGER IF EXISTS trigger_medication_records_updated_at ON medication_records;
CREATE TRIGGER trigger_medication_records_updated_at
    BEFORE UPDATE ON medication_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- disease_records 트리거
DROP TRIGGER IF EXISTS trigger_disease_records_updated_at ON disease_records;
CREATE TRIGGER trigger_disease_records_updated_at
    BEFORE UPDATE ON disease_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- lifecycle_vaccination_schedules 트리거
DROP TRIGGER IF EXISTS trigger_lifecycle_vaccination_schedules_updated_at ON lifecycle_vaccination_schedules;
CREATE TRIGGER trigger_lifecycle_vaccination_schedules_updated_at
    BEFORE UPDATE ON lifecycle_vaccination_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. RLS 비활성화 (개발 환경)
-- ============================================================================

ALTER TABLE health_data_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE disease_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_sync_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_vaccination_schedules DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. 권한 부여
-- ============================================================================

GRANT ALL ON TABLE health_data_sources TO anon, authenticated, service_role;
GRANT ALL ON TABLE hospital_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE medication_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE disease_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE health_data_sync_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE vaccination_notification_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE lifecycle_vaccination_schedules TO anon, authenticated, service_role;

-- ============================================================================
-- 8. 관계도 요약
-- ============================================================================
-- 
-- users (id)
--   ├── health_data_sources (user_id) → users(id) CASCADE
--   ├── hospital_records (user_id) → users(id) CASCADE
--   │   └── medication_records (hospital_record_id) → hospital_records(id) SET NULL
--   │   └── disease_records (hospital_record_id) → hospital_records(id) SET NULL
--   ├── medication_records (user_id) → users(id) CASCADE
--   ├── disease_records (user_id) → users(id) CASCADE
--   │   └── disease_records (disease_code) → diseases(code) SET NULL
--   ├── health_data_sync_logs (user_id) → users(id) CASCADE
--   ├── vaccination_notification_logs (user_id) → users(id) CASCADE
--   │   └── vaccination_notification_logs (vaccination_schedule_id) → user_vaccination_schedules(id) CASCADE
--   │   └── vaccination_notification_logs (vaccination_record_id) → user_vaccination_records(id) SET NULL
--   └── user_vaccination_schedules (user_id) → users(id) CASCADE (기존)
--       └── user_vaccination_schedules (family_member_id) → family_members(id) CASCADE (기존)
--
-- family_members (id)
--   ├── hospital_records (family_member_id) → family_members(id) SET NULL
--   ├── medication_records (family_member_id) → family_members(id) SET NULL
--   ├── disease_records (family_member_id) → family_members(id) SET NULL
--   └── vaccination_notification_logs (family_member_id) → family_members(id) SET NULL
--
-- diseases (code)
--   └── disease_records (disease_code) → diseases(code) SET NULL
--
-- health_data_sources (id)
--   ├── hospital_records (data_source_id) → health_data_sources(id) SET NULL
--   ├── medication_records (data_source_id) → health_data_sources(id) SET NULL
--   ├── disease_records (data_source_id) → health_data_sources(id) SET NULL
--   └── health_data_sync_logs (data_source_id) → health_data_sources(id) SET NULL
--
-- ============================================================================

