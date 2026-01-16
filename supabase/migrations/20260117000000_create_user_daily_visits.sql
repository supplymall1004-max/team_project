-- 사용자 일일 방문 기록 테이블
-- 연속 방문 일수 (스트릭) 추적용

CREATE TABLE IF NOT EXISTS user_daily_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1, -- 연속 방문 일수
  total_visits INTEGER DEFAULT 1, -- 총 방문 일수
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, visit_date)
);

-- 인덱스
CREATE INDEX idx_user_daily_visits_user_date ON user_daily_visits(user_id, visit_date DESC);
CREATE INDEX idx_user_daily_visits_streak ON user_daily_visits(user_id, streak_count DESC);

-- RLS 비활성화 (개발 환경)
ALTER TABLE user_daily_visits DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE user_daily_visits TO anon, authenticated, service_role;

COMMENT ON TABLE user_daily_visits IS '사용자 일일 방문 기록 - 연속 방문 일수 추적';
COMMENT ON COLUMN user_daily_visits.streak_count IS '연속 방문 일수 (하루라도 빠지면 1로 리셋)';
COMMENT ON COLUMN user_daily_visits.total_visits IS '누적 총 방문 일수';

