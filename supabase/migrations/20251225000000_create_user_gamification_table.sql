-- ============================================================================
-- 사용자 게임화 데이터 테이블 생성
-- 작성일: 2025-12-25
-- 설명: 알림 완료 시 포인트 적립, 연속 완료 일수, 배지 시스템을 위한 테이블
-- ============================================================================

-- 사용자 게임화 데이터 테이블
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  last_completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_gamification IS '사용자 게임화 데이터 테이블 - 알림 완료 포인트, 연속 완료 일수, 배지 관리';
COMMENT ON COLUMN user_gamification.total_points IS '총 포인트 (알림 완료 시 적립)';
COMMENT ON COLUMN user_gamification.streak_days IS '연속 완료 일수';
COMMENT ON COLUMN user_gamification.badges IS '획득한 배지 ID 배열';
COMMENT ON COLUMN user_gamification.last_completed_date IS '마지막 알림 완료 날짜';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_points ON user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_streak_days ON user_gamification(streak_days DESC);

-- updated_at 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_gamification_updated_at'
  ) THEN
    CREATE TRIGGER update_user_gamification_updated_at
      BEFORE UPDATE ON user_gamification
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS 비활성화 (개발 환경)
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE user_gamification TO anon, authenticated, service_role;

