-- 냉장고 파수꾼 게임 점수 테이블 생성
-- 게임 점수, 통계, 랭킹 등을 저장합니다.

CREATE TABLE IF NOT EXISTS fridge_guardian_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fridge_guardian_scores_user_id ON fridge_guardian_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fridge_guardian_scores_score ON fridge_guardian_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_fridge_guardian_scores_played_at ON fridge_guardian_scores(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_fridge_guardian_scores_user_score ON fridge_guardian_scores(user_id, score DESC);

-- RLS 비활성화 (개발 환경)
ALTER TABLE fridge_guardian_scores DISABLE ROW LEVEL SECURITY;

-- 통계 조회를 위한 뷰 생성 (사용자별 최고 점수)
CREATE OR REPLACE VIEW fridge_guardian_user_high_scores AS
SELECT 
  user_id,
  MAX(score) as high_score,
  MAX(played_at) as last_played_at,
  COUNT(*) as total_plays
FROM fridge_guardian_scores
GROUP BY user_id;

-- 주간 랭킹 조회를 위한 함수
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(week_start DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  score INTEGER,
  played_at TIMESTAMPTZ,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fgs.user_id,
    u.name as user_name,
    fgs.score,
    fgs.played_at,
    ROW_NUMBER() OVER (ORDER BY fgs.score DESC) as rank
  FROM fridge_guardian_scores fgs
  JOIN users u ON u.id = fgs.user_id
  WHERE DATE(fgs.played_at) >= week_start
    AND DATE(fgs.played_at) < week_start + INTERVAL '7 days'
  ORDER BY fgs.score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 추가
COMMENT ON TABLE fridge_guardian_scores IS '냉장고 파수꾼 게임 점수 기록';
COMMENT ON COLUMN fridge_guardian_scores.stats IS '게임 통계 (JSONB): combo, maxCombo, itemsCaught, itemsMissed 등';
COMMENT ON VIEW fridge_guardian_user_high_scores IS '사용자별 최고 점수 및 통계';
COMMENT ON FUNCTION get_weekly_leaderboard IS '주간 랭킹 조회 함수';

