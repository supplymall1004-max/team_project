-- 게임 요소 테이블 생성
-- 킬링타임 게임 요소를 위한 테이블들
-- 개발 환경: RLS 비활성화 (프로덕션 배포 전 활성화 필요)

-- 퀘스트 시스템
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quest_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

COMMENT ON TABLE daily_quests IS '일일 퀘스트 시스템 - 사용자별 일일 퀘스트 진행 상황 추적';
COMMENT ON COLUMN daily_quests.quest_id IS '퀘스트 식별자 (예: daily_exercise, daily_medication)';
COMMENT ON COLUMN daily_quests.progress IS '현재 진행도';
COMMENT ON COLUMN daily_quests.target IS '목표 달성 수치';

-- 레벨 시스템
CREATE TABLE IF NOT EXISTS character_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  experience_to_next_level INTEGER DEFAULT 100,
  last_level_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

COMMENT ON TABLE character_levels IS '캐릭터 레벨 시스템 - 사용자 또는 가족 구성원별 레벨 및 경험치 관리';
COMMENT ON COLUMN character_levels.family_member_id IS '가족 구성원 ID (NULL이면 사용자 본인)';
COMMENT ON COLUMN character_levels.experience_to_next_level IS '다음 레벨까지 필요한 경험치';

-- 컬렉션 시스템
CREATE TABLE IF NOT EXISTS character_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT false,
  UNIQUE(user_id, family_member_id, skin_id)
);

COMMENT ON TABLE character_skins IS '캐릭터 스킨 컬렉션 - 획득한 스킨 및 활성 스킨 관리';
COMMENT ON COLUMN character_skins.skin_id IS '스킨 식별자 (예: spring_outfit, winter_outfit)';
COMMENT ON COLUMN character_skins.is_active IS '현재 착용 중인 스킨 여부';

-- 랜덤 이벤트
CREATE TABLE IF NOT EXISTS random_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('daily', 'family', 'special', 'seasonal')),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  triggered_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_points INTEGER DEFAULT 0,
  UNIQUE(user_id, event_id, triggered_date)
);

COMMENT ON TABLE random_events IS '랜덤 이벤트 시스템 - 일일/가족/특별/계절 이벤트 관리';
COMMENT ON COLUMN random_events.event_type IS '이벤트 유형: daily(일일), family(가족), special(특별), seasonal(계절)';
COMMENT ON COLUMN random_events.reward_points IS '완료 시 획득 포인트 (user_gamification.total_points에 반영)';

-- 가족 친밀도
CREATE TABLE IF NOT EXISTS family_intimacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  intimacy_score INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

COMMENT ON TABLE family_intimacy IS '가족 친밀도 시스템 - 사용자와 가족 구성원 간의 친밀도 점수 관리';
COMMENT ON COLUMN family_intimacy.intimacy_score IS '친밀도 점수 (0-100)';
COMMENT ON COLUMN family_intimacy.last_interaction_at IS '마지막 상호작용 시간';

-- 가족 챌린지
CREATE TABLE IF NOT EXISTS family_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('weekly', 'monthly', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE family_challenges IS '가족 챌린지 시스템 - 주간/월간/특별 챌린지 진행 상황 추적';
COMMENT ON COLUMN family_challenges.challenge_type IS '챌린지 유형: weekly(주간), monthly(월간), special(특별)';
COMMENT ON COLUMN family_challenges.reward_points IS '완료 시 획득 포인트 (user_gamification.total_points에 반영)';

-- 미니게임 기록
CREATE TABLE IF NOT EXISTS minigame_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('medication_memory', 'exercise_timing', 'nutrition_puzzle')),
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  reward_points INTEGER DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE minigame_records IS '미니게임 기록 - 약물 기억력, 운동 타이밍, 영양 퍼즐 게임 기록';
COMMENT ON COLUMN minigame_records.game_type IS '게임 유형: medication_memory(약물 기억력), exercise_timing(운동 타이밍), nutrition_puzzle(영양 퍼즐)';
COMMENT ON COLUMN minigame_records.reward_points IS '게임 완료 시 획득 포인트 (user_gamification.total_points에 반영)';

-- 퀴즈 기록
CREATE TABLE IF NOT EXISTS quiz_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  reward_points INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE quiz_records IS '건강 퀴즈 기록 - 건강 관련 퀴즈 답변 기록';
COMMENT ON COLUMN quiz_records.quiz_id IS '퀴즈 식별자 (예: health_quiz_001)';
COMMENT ON COLUMN quiz_records.reward_points IS '정답 시 획득 포인트 (user_gamification.total_points에 반영)';

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_quest_date ON daily_quests(quest_date);
CREATE INDEX IF NOT EXISTS idx_daily_quests_completed ON daily_quests(completed) WHERE completed = false;

CREATE INDEX IF NOT EXISTS idx_character_levels_user_id ON character_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_character_levels_family_member_id ON character_levels(family_member_id);

CREATE INDEX IF NOT EXISTS idx_character_skins_user_id ON character_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_character_skins_family_member_id ON character_skins(family_member_id);
CREATE INDEX IF NOT EXISTS idx_character_skins_active ON character_skins(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_random_events_user_id ON random_events(user_id);
CREATE INDEX IF NOT EXISTS idx_random_events_event_type ON random_events(event_type);
CREATE INDEX IF NOT EXISTS idx_random_events_triggered_at ON random_events(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_family_intimacy_user_id ON family_intimacy(user_id);
CREATE INDEX IF NOT EXISTS idx_family_intimacy_family_member_id ON family_intimacy(family_member_id);

CREATE INDEX IF NOT EXISTS idx_family_challenges_user_id ON family_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_family_challenges_challenge_type ON family_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_family_challenges_dates ON family_challenges(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_minigame_records_user_id ON minigame_records(user_id);
CREATE INDEX IF NOT EXISTS idx_minigame_records_game_type ON minigame_records(game_type);
CREATE INDEX IF NOT EXISTS idx_minigame_records_played_at ON minigame_records(played_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_records_user_id ON quiz_records(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_records_quiz_id ON quiz_records(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_records_answered_at ON quiz_records(answered_at DESC);

-- RLS 비활성화 (개발 환경)
ALTER TABLE daily_quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_skins DISABLE ROW LEVEL SECURITY;
ALTER TABLE random_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_intimacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE minigame_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_records DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (updated_at 자동 업데이트)
DROP TRIGGER IF EXISTS update_character_levels_updated_at ON character_levels;
CREATE TRIGGER update_character_levels_updated_at
  BEFORE UPDATE ON character_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_intimacy_updated_at ON family_intimacy;
CREATE TRIGGER update_family_intimacy_updated_at
  BEFORE UPDATE ON family_intimacy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 권한 부여
GRANT ALL ON TABLE daily_quests TO anon, authenticated, service_role;
GRANT ALL ON TABLE character_levels TO anon, authenticated, service_role;
GRANT ALL ON TABLE character_skins TO anon, authenticated, service_role;
GRANT ALL ON TABLE random_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE family_intimacy TO anon, authenticated, service_role;
GRANT ALL ON TABLE family_challenges TO anon, authenticated, service_role;
GRANT ALL ON TABLE minigame_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE quiz_records TO anon, authenticated, service_role;

