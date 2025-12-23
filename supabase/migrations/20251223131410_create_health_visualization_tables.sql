-- ============================================================================
-- 건강 시각화 통합 대시보드 데이터베이스 스키마
-- 작성일: 2025-12-23
-- 설명: 수면, 활동량, 혈압/혈당, 체중 기록 테이블 생성
-- ============================================================================

-- ============================================================================
-- 1. 수면 기록 테이블
-- ============================================================================

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

COMMENT ON TABLE sleep_logs IS '수면 기록 테이블';
COMMENT ON COLUMN sleep_logs.sleep_duration_minutes IS '수면 시간 (분)';
COMMENT ON COLUMN sleep_logs.sleep_quality_score IS '수면 품질 점수 (1-10)';
COMMENT ON COLUMN sleep_logs.deep_sleep_minutes IS '깊은 수면 시간 (분)';
COMMENT ON COLUMN sleep_logs.light_sleep_minutes IS '얕은 수면 시간 (분)';
COMMENT ON COLUMN sleep_logs.rem_sleep_minutes IS 'REM 수면 시간 (분)';
COMMENT ON COLUMN sleep_logs.source IS '데이터 출처: manual(수동 입력), fitbit, apple_health, samsung_health';

-- 수면 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_family_member_id ON sleep_logs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);

-- ============================================================================
-- 2. 활동량 기록 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    exercise_minutes INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    activity_type TEXT, -- 'walking', 'running', 'cycling', 'swimming', etc.
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_fit', 'apple_health', 'samsung_health')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT activity_logs_unique UNIQUE(user_id, family_member_id, date)
);

COMMENT ON TABLE activity_logs IS '활동량 기록 테이블';
COMMENT ON COLUMN activity_logs.steps IS '걸음 수';
COMMENT ON COLUMN activity_logs.exercise_minutes IS '운동 시간 (분)';
COMMENT ON COLUMN activity_logs.calories_burned IS '소모 칼로리';
COMMENT ON COLUMN activity_logs.activity_type IS '운동 유형: walking, running, cycling, swimming 등';
COMMENT ON COLUMN activity_logs.source IS '데이터 출처: manual(수동 입력), google_fit, apple_health, samsung_health';

-- 활동량 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_family_member_id ON activity_logs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, date DESC);

-- ============================================================================
-- 3. 혈압/혈당 기록 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ NOT NULL,
    systolic_bp INTEGER, -- 수축기 혈압 (mmHg)
    diastolic_bp INTEGER, -- 이완기 혈압 (mmHg)
    fasting_glucose INTEGER, -- 공복 혈당 (mg/dL)
    postprandial_glucose INTEGER, -- 식후 혈당 (mg/dL)
    heart_rate INTEGER, -- 심박수 (bpm)
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'health_checkup', 'health_highway', 'mydata')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE vital_signs IS '혈압/혈당 등 생체 신호 기록 테이블';
COMMENT ON COLUMN vital_signs.systolic_bp IS '수축기 혈압 (mmHg)';
COMMENT ON COLUMN vital_signs.diastolic_bp IS '이완기 혈압 (mmHg)';
COMMENT ON COLUMN vital_signs.fasting_glucose IS '공복 혈당 (mg/dL)';
COMMENT ON COLUMN vital_signs.postprandial_glucose IS '식후 혈당 (mg/dL)';
COMMENT ON COLUMN vital_signs.heart_rate IS '심박수 (bpm)';
COMMENT ON COLUMN vital_signs.source IS '데이터 출처: manual(수동 입력), health_checkup(건강검진), health_highway, mydata';

-- 생체 신호 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_id ON vital_signs(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_family_member_id ON vital_signs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_measured_at ON vital_signs(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_measured ON vital_signs(user_id, measured_at DESC);

-- ============================================================================
-- 4. 체중 기록 테이블
-- ============================================================================

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

COMMENT ON TABLE weight_logs IS '체중 기록 테이블';
COMMENT ON COLUMN weight_logs.weight_kg IS '체중 (kg)';
COMMENT ON COLUMN weight_logs.body_fat_percentage IS '체지방률 (%)';
COMMENT ON COLUMN weight_logs.muscle_mass_kg IS '근육량 (kg)';

-- 체중 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_family_member_id ON weight_logs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date DESC);

-- ============================================================================
-- 5. 업데이트 트리거
-- ============================================================================

-- 수면 기록 업데이트 트리거
CREATE OR REPLACE FUNCTION update_sleep_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sleep_logs_updated_at
    BEFORE UPDATE ON sleep_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_logs_updated_at();

-- 활동량 기록 업데이트 트리거
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_logs_updated_at();

-- 생체 신호 기록 업데이트 트리거
CREATE OR REPLACE FUNCTION update_vital_signs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vital_signs_updated_at
    BEFORE UPDATE ON vital_signs
    FOR EACH ROW
    EXECUTE FUNCTION update_vital_signs_updated_at();

-- 체중 기록 업데이트 트리거
CREATE OR REPLACE FUNCTION update_weight_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_weight_logs_updated_at
    BEFORE UPDATE ON weight_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_weight_logs_updated_at();
