-- 퀘스트 시스템 테이블 생성

-- 퀘스트 정의 테이블
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL, -- 'daily', 'weekly', 'achievement', 'event'
  category TEXT, -- 'medication', 'feeding', 'health', 'game', 'social'
  target_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  reward_experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 퀘스트 진행 상황 테이블
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ, -- 보상 수령 시간
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, family_member_id)
);

-- 퀘스트 완료 기록 테이블
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_quest_id UUID NOT NULL REFERENCES user_quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_family_member_id ON user_quests(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_completed ON user_quests(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active) WHERE is_active = true;

-- 기본 퀘스트 데이터 삽입
INSERT INTO quests (title, description, quest_type, category, target_count, reward_points, reward_experience) VALUES
  ('하루 약 복용', '오늘 약을 3번 복용하세요', 'daily', 'medication', 3, 50, 30),
  ('분유 시간', '오늘 분유를 5번 주세요', 'daily', 'feeding', 5, 40, 25),
  ('건강 관리', '이번 주 건강 검진을 예약하세요', 'weekly', 'health', 1, 100, 50),
  ('게임 플레이', '게임을 10분 이상 플레이하세요', 'daily', 'game', 1, 30, 20),
  ('가족과 함께', '가족 구성원과 상호작용하세요', 'daily', 'social', 3, 60, 40),
  ('100일 연속 약 복용', '100일 연속으로 약을 복용하세요', 'achievement', 'medication', 100, 500, 200),
  ('레벨 10 달성', '게임 레벨 10을 달성하세요', 'achievement', 'game', 10, 300, 150),
  ('모든 이벤트 완료', '모든 게임 이벤트를 완료하세요', 'achievement', 'game', 1, 400, 200)
ON CONFLICT DO NOTHING;

