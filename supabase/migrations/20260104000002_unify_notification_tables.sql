-- 알림 로그 테이블 통합 및 제약조건 설정

-- 1. 통합 notifications 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'health', 'vaccination', 'medication', 'periodic_service')),
  category TEXT CHECK (category IN ('kcdc', 'diet-popup', 'system', 'scheduled', 'reminder', 'overdue', 'checkup', 'appointment', 'general')),
  channel TEXT CHECK (channel IN ('push', 'sms', 'email', 'in_app')),
  title TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'dismissed', 'confirmed', 'missed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  context_data JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('vaccination_schedule', 'medication_record', 'periodic_service', 'health_checkup', 'appointment')),
  recipient TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 코멘트
COMMENT ON TABLE notifications IS '통합 알림 로그 테이블 - 모든 알림 타입을 하나의 테이블로 관리';
COMMENT ON COLUMN notifications.type IS '알림 타입: system, health, vaccination, medication, periodic_service';
COMMENT ON COLUMN notifications.category IS '세부 카테고리: kcdc, diet-popup, scheduled, reminder, overdue, checkup, appointment, general';
COMMENT ON COLUMN notifications.channel IS '알림 채널: push, sms, email, in_app';
COMMENT ON COLUMN notifications.status IS '상태: pending, sent, failed, dismissed, confirmed, missed, cancelled';
COMMENT ON COLUMN notifications.priority IS '우선순위: low, normal, high, urgent';

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_family_member_id ON notifications(family_member_id) WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel) WHERE channel IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at DESC) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type) WHERE related_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status) WHERE user_id IS NOT NULL;

-- 4. updated_at 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 5. 기존 테이블 데이터 마이그레이션
INSERT INTO notifications (
  id, user_id, type, category, channel, title, message, status, priority,
  context_data, scheduled_at, sent_at, error_message, created_at
)
SELECT 
  id,
  NULL as user_id,
  'system' as type,
  type as category,
  NULL as channel,
  NULL as title,
  payload->>'message' as message,
  CASE 
    WHEN status = 'success' THEN 'sent'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'pending' THEN 'pending'
    ELSE 'pending'
  END as status,
  'normal' as priority,
  payload as context_data,
  triggered_at as scheduled_at,
  CASE WHEN status = 'success' THEN triggered_at ELSE NULL END as sent_at,
  error_message,
  created_at
FROM notification_logs
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id, user_id, family_member_id, type, category, channel, title, message,
  status, priority, context_data, scheduled_at, sent_at, read_at, recipient,
  error_message, retry_count, is_test, created_at
)
SELECT 
  id,
  user_id,
  family_member_id,
  'health' as type,
  type as category,
  channel,
  title,
  message,
  status,
  priority,
  context_data,
  scheduled_at,
  sent_at,
  read_at,
  recipient,
  error_message,
  retry_count,
  is_test,
  created_at
FROM health_notifications
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id, user_id, family_member_id, type, category, channel, title, message,
  status, priority, context_data, scheduled_at, sent_at, related_id, related_type,
  error_message, created_at
)
SELECT 
  id,
  user_id,
  family_member_id,
  'vaccination' as type,
  notification_type as category,
  notification_channel as channel,
  NULL as title,
  NULL as message,
  CASE 
    WHEN notification_status = 'sent' THEN 'sent'
    WHEN notification_status = 'failed' THEN 'failed'
    WHEN notification_status = 'dismissed' THEN 'dismissed'
    ELSE 'pending'
  END as status,
  CASE 
    WHEN notification_type = 'overdue' THEN 'high'
    ELSE 'normal'
  END as priority,
  jsonb_build_object(
    'scheduled_date', scheduled_date,
    'reminder_days_before', reminder_days_before,
    'vaccination_schedule_id', vaccination_schedule_id,
    'vaccination_record_id', vaccination_record_id
  ) as context_data,
  scheduled_date::timestamptz as scheduled_at,
  notification_sent_at as sent_at,
  vaccination_schedule_id as related_id,
  'vaccination_schedule' as related_type,
  error_message,
  created_at
FROM vaccination_notification_logs
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id, user_id, family_member_id, type, category, channel, title, message,
  status, priority, context_data, scheduled_at, sent_at, confirmed_at,
  related_id, related_type, created_at
)
SELECT 
  mrl.id,
  mr.user_id,
  mr.family_member_id,
  'medication' as type,
  'reminder' as category,
  'in_app' as channel,
  NULL as title,
  NULL as message,
  CASE 
    WHEN mrl.status = 'confirmed' THEN 'confirmed'
    WHEN mrl.status = 'notified' THEN 'sent'
    WHEN mrl.status = 'missed' THEN 'missed'
    ELSE 'pending'
  END as status,
  'normal' as priority,
  jsonb_build_object(
    'medication_record_id', mrl.medication_record_id,
    'medication_name', mr.medication_name
  ) as context_data,
  mrl.scheduled_time as scheduled_at,
  mrl.notified_at as sent_at,
  mrl.confirmed_at as confirmed_at,
  mrl.medication_record_id as related_id,
  'medication_record' as related_type,
  mrl.created_at
FROM medication_reminder_logs mrl
LEFT JOIN medication_records mr ON mrl.medication_record_id = mr.id
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id, user_id, type, category, channel, title, message, status, priority,
  context_data, scheduled_at, sent_at, related_id, related_type, created_at
)
SELECT 
  id,
  user_id,
  'periodic_service' as type,
  'reminder' as category,
  reminder_type as channel,
  NULL as title,
  NULL as message,
  CASE 
    WHEN status = 'sent' THEN 'sent'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'dismissed' THEN 'dismissed'
    ELSE 'pending'
  END as status,
  'normal' as priority,
  jsonb_build_object(
    'service_id', service_id,
    'reminder_date', reminder_date,
    'service_due_date', service_due_date
  ) as context_data,
  reminder_date::timestamptz as scheduled_at,
  CASE WHEN status = 'sent' THEN reminder_date::timestamptz ELSE NULL END as sent_at,
  service_id as related_id,
  'periodic_service' as related_type,
  created_at
FROM user_periodic_service_reminders
ON CONFLICT (id) DO NOTHING;

-- 6. 기존 테이블 deprecated 표시
COMMENT ON TABLE notification_logs IS 'DEPRECATED: notifications 테이블로 통합됨. 데이터는 마이그레이션 완료.';
COMMENT ON TABLE health_notifications IS 'DEPRECATED: notifications 테이블로 통합됨. 데이터는 마이그레이션 완료.';
COMMENT ON TABLE vaccination_notification_logs IS 'DEPRECATED: notifications 테이블로 통합됨. 데이터는 마이그레이션 완료.';
COMMENT ON TABLE medication_reminder_logs IS 'DEPRECATED: notifications 테이블로 통합됨. 데이터는 마이그레이션 완료.';
COMMENT ON TABLE user_periodic_service_reminders IS 'DEPRECATED: notifications 테이블로 통합됨. 데이터는 마이그레이션 완료.';

-- 7. RLS 비활성화
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 8. 권한 부여
GRANT ALL ON TABLE notifications TO anon, authenticated, service_role;
