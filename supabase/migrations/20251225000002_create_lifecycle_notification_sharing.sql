-- ============================================================================
-- 생애주기별 알림 공유 테이블 생성
-- 작성일: 2025-12-25
-- 설명: 가족 구성원 간 알림 공유 및 완료 상태 공유를 위한 테이블
-- ============================================================================

-- 생애주기별 알림 공유 테이블
CREATE TABLE IF NOT EXISTS lifecycle_notification_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  
  -- 공유 설정
  share_completion_status BOOLEAN DEFAULT true, -- 완료 상태 공유 여부
  share_reminders BOOLEAN DEFAULT false, -- 리마인더 공유 여부
  
  -- 공유 상태
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 중복 공유 방지
  UNIQUE(notification_id, shared_with_user_id)
);

COMMENT ON TABLE lifecycle_notification_shares IS '생애주기별 알림 공유 테이블 - 가족 구성원 간 알림 및 완료 상태 공유';
COMMENT ON COLUMN lifecycle_notification_shares.share_completion_status IS '완료 상태 공유 여부 (예: "엄마가 약물 복용 완료")';
COMMENT ON COLUMN lifecycle_notification_shares.share_reminders IS '리마인더 공유 여부 (공유받은 사람도 리마인더 받음)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lifecycle_shares_notification_id ON lifecycle_notification_shares(notification_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_shares_shared_by ON lifecycle_notification_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_shares_shared_with ON lifecycle_notification_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_shares_status ON lifecycle_notification_shares(status) WHERE status = 'active';

-- updated_at 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_lifecycle_shares_updated_at'
  ) THEN
    CREATE TRIGGER update_lifecycle_shares_updated_at
      BEFORE UPDATE ON lifecycle_notification_shares
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS 비활성화 (개발 환경)
ALTER TABLE lifecycle_notification_shares DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE lifecycle_notification_shares TO anon, authenticated, service_role;

