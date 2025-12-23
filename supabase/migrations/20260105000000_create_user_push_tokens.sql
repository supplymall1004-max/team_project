-- ============================================================================
-- 사용자 푸시 토큰 테이블 생성
-- 작성일: 2025-01-05
-- 설명: 푸시 알림 발송을 위한 사용자 디바이스 토큰 저장 테이블
-- ============================================================================

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

COMMENT ON TABLE user_push_tokens IS '사용자 푸시 알림 토큰 테이블';
COMMENT ON COLUMN user_push_tokens.user_id IS '사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN user_push_tokens.token IS '푸시 알림 토큰 (FCM, APNs 등)';
COMMENT ON COLUMN user_push_tokens.device_type IS '디바이스 유형: ios, android, web';
COMMENT ON COLUMN user_push_tokens.device_id IS '디바이스 고유 ID (선택)';
COMMENT ON COLUMN user_push_tokens.app_version IS '앱 버전 (선택)';
COMMENT ON COLUMN user_push_tokens.active IS '토큰 활성화 여부';
COMMENT ON COLUMN user_push_tokens.last_used_at IS '마지막 사용 시간';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_active ON user_push_tokens(user_id, active) WHERE active = true;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_push_tokens_updated_at
    BEFORE UPDATE ON user_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_user_push_tokens_updated_at();

