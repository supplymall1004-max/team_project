-- ============================================================================
-- 생애주기별 알림 리마인더 설정 테이블 생성
-- 작성일: 2025-12-25
-- 설명: 생애주기별 알림의 개별 리마인더 설정을 관리하는 테이블
--       - 여러 리마인더 시간 설정 (7일 전, 3일 전, 당일 등)
--       - 알림 방법 선택 (브라우저/이메일/SMS)
--       - 조용한 시간대 설정
-- ============================================================================

-- 생애주기별 알림 리마인더 설정 테이블
CREATE TABLE IF NOT EXISTS lifecycle_notification_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  
  -- 리마인더 활성화 여부
  reminder_enabled BOOLEAN DEFAULT true,
  
  -- 여러 리마인더 시간 설정 (일 단위 배열, 예: [0, 1, 7, 30] = 당일, 1일 전, 7일 전, 30일 전)
  reminder_days_before INTEGER[] DEFAULT ARRAY[0, 1, 7],
  
  -- 알림 방법 선택 (배열, 여러 개 선택 가능)
  notification_channels TEXT[] DEFAULT ARRAY['in_app', 'push'],
  CHECK (notification_channels <@ ARRAY['in_app', 'push', 'email', 'sms']),
  
  -- 조용한 시간대 설정
  quiet_hours_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- 알림별 개별 설정 (JSONB)
  -- 예: {"event_code": {"reminder_days_before": [0, 7], "channels": ["push"]}}
  per_notification_settings JSONB DEFAULT '{}'::jsonb,
  
  -- 타임존
  timezone TEXT DEFAULT 'Asia/Seoul',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 사용자별로 하나의 설정만 (family_member_id가 NULL이면 본인 설정)
  UNIQUE(user_id, family_member_id)
);

COMMENT ON TABLE lifecycle_notification_reminder_settings IS '생애주기별 알림 리마인더 설정 테이블 - 개별 리마인더 시간, 알림 방법, 조용한 시간대 설정';
COMMENT ON COLUMN lifecycle_notification_reminder_settings.reminder_days_before IS '리마인더 일수 배열 (예: [0, 1, 7] = 당일, 1일 전, 7일 전)';
COMMENT ON COLUMN lifecycle_notification_reminder_settings.notification_channels IS '알림 채널 배열 (in_app, push, email, sms 중 선택)';
COMMENT ON COLUMN lifecycle_notification_reminder_settings.quiet_hours_start IS '조용한 시간대 시작 시간 (HH:MM:SS)';
COMMENT ON COLUMN lifecycle_notification_reminder_settings.quiet_hours_end IS '조용한 시간대 종료 시간 (HH:MM:SS)';
COMMENT ON COLUMN lifecycle_notification_reminder_settings.per_notification_settings IS '알림별 개별 설정 (JSONB, event_code별로 다른 설정 가능)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lifecycle_reminder_settings_user_id ON lifecycle_notification_reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_reminder_settings_family_member_id ON lifecycle_notification_reminder_settings(family_member_id) WHERE family_member_id IS NOT NULL;

-- updated_at 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_lifecycle_reminder_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_lifecycle_reminder_settings_updated_at
      BEFORE UPDATE ON lifecycle_notification_reminder_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS 비활성화 (개발 환경)
ALTER TABLE lifecycle_notification_reminder_settings DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE lifecycle_notification_reminder_settings TO anon, authenticated, service_role;

