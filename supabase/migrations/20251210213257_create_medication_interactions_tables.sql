-- ============================================================================
-- 약물 상호작용 및 복용 알림 시스템 데이터베이스 스키마
-- 작성일: 2025-12-10
-- 설명: 약물 상호작용 체크 및 복용 알림 시스템 관련 테이블 생성
-- ============================================================================

-- ============================================================================
-- 1. 약물 상호작용 테이블
-- ============================================================================

-- 약물 상호작용 정보 테이블
-- 두 약물 간의 상호작용 정보를 저장
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

COMMENT ON TABLE medication_interactions IS '약물 상호작용 정보 테이블';
COMMENT ON COLUMN medication_interactions.medication_a IS '첫 번째 약물명';
COMMENT ON COLUMN medication_interactions.medication_b IS '두 번째 약물명';
COMMENT ON COLUMN medication_interactions.interaction_level IS '상호작용 위험도: severe(위험), moderate(주의), mild(경미), info(정보)';
COMMENT ON COLUMN medication_interactions.description IS '상호작용 설명';
COMMENT ON COLUMN medication_interactions.recommendation IS '권장사항';
COMMENT ON COLUMN medication_interactions.source IS '데이터 출처: mfds(식약처), manual(수동 입력), external_api(외부 API)';

-- 약물 상호작용 인덱스 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_medication_interactions_medication_a ON medication_interactions(medication_a);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_medication_b ON medication_interactions(medication_b);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_level ON medication_interactions(interaction_level);

-- ============================================================================
-- 2. 약물 복용 알림 로그 테이블
-- ============================================================================

-- 약물 복용 알림 로그 테이블
-- 약물 복용 알림 히스토리 및 복용 확인 기록 저장
CREATE TABLE IF NOT EXISTS medication_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_record_id UUID NOT NULL REFERENCES medication_records(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    notified_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'confirmed', 'missed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE medication_reminder_logs IS '약물 복용 알림 로그 테이블';
COMMENT ON COLUMN medication_reminder_logs.scheduled_time IS '예정된 복용 시간';
COMMENT ON COLUMN medication_reminder_logs.notified_at IS '알림 발송 시간';
COMMENT ON COLUMN medication_reminder_logs.confirmed_at IS '복용 확인 시간';
COMMENT ON COLUMN medication_reminder_logs.status IS '상태: pending(대기), notified(알림 발송), confirmed(복용 확인), missed(누락)';

-- 약물 복용 알림 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_medication_reminder_logs_medication_record_id ON medication_reminder_logs(medication_record_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminder_logs_scheduled_time ON medication_reminder_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_reminder_logs_status ON medication_reminder_logs(status);

-- ============================================================================
-- 3. 건강 대시보드 캐시 테이블
-- ============================================================================

-- 건강 대시보드 캐시 테이블
-- 대시보드 데이터 캐싱을 위한 테이블
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

COMMENT ON TABLE health_dashboard_cache IS '건강 대시보드 캐시 테이블';
COMMENT ON COLUMN health_dashboard_cache.cache_key IS '캐시 키 (예: "dashboard_summary", "health_score")';
COMMENT ON COLUMN health_dashboard_cache.cache_data IS '캐시 데이터 (JSONB)';
COMMENT ON COLUMN health_dashboard_cache.expires_at IS '캐시 만료 시간';

-- 건강 대시보드 캐시 인덱스
CREATE INDEX IF NOT EXISTS idx_health_dashboard_cache_user_id ON health_dashboard_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_health_dashboard_cache_family_member_id ON health_dashboard_cache(family_member_id);
CREATE INDEX IF NOT EXISTS idx_health_dashboard_cache_expires_at ON health_dashboard_cache(expires_at);

-- ============================================================================
-- 4. 업데이트 트리거
-- ============================================================================

-- 약물 상호작용 테이블 업데이트 트리거
CREATE OR REPLACE FUNCTION update_medication_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_medication_interactions_updated_at
    BEFORE UPDATE ON medication_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_medication_interactions_updated_at();

-- 약물 복용 알림 로그 테이블 업데이트 트리거
CREATE OR REPLACE FUNCTION update_medication_reminder_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_medication_reminder_logs_updated_at
    BEFORE UPDATE ON medication_reminder_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_medication_reminder_logs_updated_at();

-- 건강 대시보드 캐시 테이블 업데이트 트리거
CREATE OR REPLACE FUNCTION update_health_dashboard_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_health_dashboard_cache_updated_at
    BEFORE UPDATE ON health_dashboard_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_health_dashboard_cache_updated_at();

-- ============================================================================
-- 5. RLS 정책 (개발 환경에서는 비활성화)
-- ============================================================================

-- 개발 환경에서는 RLS를 비활성화합니다
-- 프로덕션 배포 시 적절한 RLS 정책을 추가해야 합니다

-- ALTER TABLE medication_interactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE medication_reminder_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_dashboard_cache DISABLE ROW LEVEL SECURITY;

