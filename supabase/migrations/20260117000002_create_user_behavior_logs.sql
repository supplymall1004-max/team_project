-- 사용자 행동 로그 테이블
-- 개인화 추천 및 트렌딩 분석용

CREATE TABLE IF NOT EXISTS user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view', 'like', 'save', 'search', 'cook'
  target_type TEXT NOT NULL, -- 'recipe', 'post', 'diet', 'health_tip'
  target_id UUID,
  metadata JSONB DEFAULT '{}', -- 추가 정보 (검색어, 카테고리 등)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 성능 최적화 인덱스
CREATE INDEX idx_user_behavior_user_action 
  ON user_behavior_logs(user_id, action_type, created_at DESC);

CREATE INDEX idx_user_behavior_target 
  ON user_behavior_logs(target_type, target_id, created_at DESC);

CREATE INDEX idx_user_behavior_recent 
  ON user_behavior_logs(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';

-- 오래된 로그 자동 삭제 (90일 이상)
CREATE INDEX idx_user_behavior_cleanup 
  ON user_behavior_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';

-- RLS 비활성화 (개발 환경)
ALTER TABLE user_behavior_logs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE user_behavior_logs TO anon, authenticated, service_role;

COMMENT ON TABLE user_behavior_logs IS '사용자 행동 추적 로그 - 개인화 추천 및 트렌딩 분석에 활용';
COMMENT ON COLUMN user_behavior_logs.action_type IS '행동 유형: view(조회), like(좋아요), save(저장), search(검색), cook(조리)';
COMMENT ON COLUMN user_behavior_logs.target_type IS '대상 유형: recipe(레시피), post(게시글), diet(식단), health_tip(건강상식)';
COMMENT ON COLUMN user_behavior_logs.metadata IS '추가 정보 JSON: 검색어, 카테고리, 체류시간 등';

