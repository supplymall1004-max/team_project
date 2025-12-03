-- notification_logs 테이블 생성
-- 알림 로그를 저장하는 테이블

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kcdc', 'diet-popup', 'system')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_triggered_at ON notification_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_actor ON notification_logs(actor) WHERE actor IS NOT NULL;

-- 3. RLS 비활성화 (개발 환경)
-- 프로덕션 환경에서는 적절한 RLS 정책을 설정해야 합니다.
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- 4. 더미 데이터 삽입 (개발 및 테스트용)
INSERT INTO notification_logs (type, status, payload, triggered_at, actor, error_message)
VALUES
  ('kcdc', 'success', '{"message": "KCDC 알림 전송 성공", "recipients": 150}', now() - interval '1 hour', 'user_35nQVzdkEwk1R7bJDYmL5I8nPEI', NULL),
  ('diet-popup', 'success', '{"popup_id": "abc123", "users_shown": 42}', now() - interval '2 hours', 'system', NULL),
  ('system', 'failed', '{"task": "backup", "reason": "disk full"}', now() - interval '3 hours', NULL, '디스크 공간 부족'),
  ('kcdc', 'pending', '{"scheduled_for": "2025-11-28T10:00:00Z"}', now() - interval '30 minutes', 'user_35nQVzdkEwk1R7bJDYmL5I8nPEI', NULL),
  ('diet-popup', 'success', '{"popup_id": "def456", "users_shown": 88}', now() - interval '4 hours', 'system', NULL),
  ('system', 'success', '{"task": "cleanup", "deleted_records": 1200}', now() - interval '5 hours', NULL, NULL),
  ('kcdc', 'failed', '{"message": "API 연결 실패"}', now() - interval '6 hours', 'user_35nQVzdkEwk1R7bJDYmL5I8nPEI', 'KCDC API 서버에 연결할 수 없습니다'),
  ('diet-popup', 'pending', '{"popup_id": "ghi789", "scheduled_for": "2025-11-28T12:00:00Z"}', now() - interval '15 minutes', 'system', NULL),
  ('system', 'success', '{"task": "sync", "synced_users": 350}', now() - interval '7 hours', NULL, NULL),
  ('kcdc', 'success', '{"message": "KCDC 데이터 동기화 완료", "records": 2500}', now() - interval '8 hours', 'system', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. 테이블 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 6. 데이터 확인
SELECT
  id,
  type,
  status,
  triggered_at,
  actor
FROM notification_logs
ORDER BY triggered_at DESC
LIMIT 5;

