-- 알림 설정을 위한 컬럼 추가
-- 사용자별 팝업 및 알림 수신 설정을 저장

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "healthPopups": false,
  "kcdcAlerts": false,
  "generalNotifications": false
}'::jsonb;

-- 인덱스 추가 (JSONB 필드 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_notification_settings
ON public.users USING GIN (notification_settings);

-- 코멘트 추가
COMMENT ON COLUMN public.users.notification_settings IS '사용자 알림 설정 (건강 팝업, 질병청 알림, 일반 알림 등)';
