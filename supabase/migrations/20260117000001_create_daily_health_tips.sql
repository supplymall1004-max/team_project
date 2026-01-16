-- 오늘의 건강 상식 테이블
-- 날짜 기반 로테이션으로 매일 다른 건강 상식 표시

CREATE TABLE IF NOT EXISTS daily_health_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'nutrition', 'exercise', 'sleep', 'mental'
  icon TEXT, -- 이모지 또는 아이콘 이름
  source TEXT, -- 출처
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_daily_health_tips_active ON daily_health_tips(is_active, display_order);

-- RLS 비활성화 (개발 환경)
ALTER TABLE daily_health_tips DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE daily_health_tips TO anon, authenticated, service_role;

-- 기본 건강 상식 데이터 삽입
INSERT INTO daily_health_tips (title, content, category, icon, display_order) VALUES
('물 마시기', '하루 8잔의 물을 마시면 신진대사가 활발해집니다. 특히 아침에 일어나자마자 물 한 잔을 마시면 하루를 상쾌하게 시작할 수 있습니다.', 'nutrition', '💧', 1),
('스트레칭', '하루 10분 스트레칭으로 몸의 유연성을 높이세요. 장시간 앉아있는 분들은 특히 목과 어깨 스트레칭이 중요합니다.', 'exercise', '🤸', 2),
('충분한 수면', '7-8시간의 충분한 수면은 건강의 기본입니다. 규칙적인 수면 패턴을 유지하면 면역력이 강화됩니다.', 'sleep', '😴', 3),
('명상', '하루 5분 명상으로 마음의 평화를 찾으세요. 깊은 호흡과 함께하면 스트레스 해소에 도움이 됩니다.', 'mental', '🧘', 4),
('균형잡힌 식사', '채소, 단백질, 탄수화물을 골고루 섭취하세요. 다양한 색깔의 채소를 먹으면 더 많은 영양소를 섭취할 수 있습니다.', 'nutrition', '🥗', 5),
('걷기 운동', '하루 30분 걷기는 심혈관 건강에 좋습니다. 엘리베이터 대신 계단을 이용하는 것부터 시작해보세요.', 'exercise', '🚶', 6),
('햇빛 쬐기', '하루 15분 햇빛을 쬐면 비타민D 합성에 도움이 됩니다. 오전 10시~오후 3시 사이가 가장 좋습니다.', 'nutrition', '☀️', 7),
('스마트폰 줄이기', '잠들기 1시간 전에는 스마트폰을 멀리하세요. 블루라이트가 수면의 질을 떨어뜨립니다.', 'sleep', '📱', 8),
('감사 일기', '하루에 감사한 일 3가지를 적어보세요. 긍정적인 마인드는 정신 건강에 큰 도움이 됩니다.', 'mental', '📝', 9),
('물 대신 차', '녹차나 허브차는 항산화 성분이 풍부합니다. 카페인이 부담스럽다면 루이보스차를 추천합니다.', 'nutrition', '🍵', 10),
('근력 운동', '일주일에 2-3회 근력 운동으로 근육량을 유지하세요. 맨몸 운동부터 시작해도 충분합니다.', 'exercise', '💪', 11),
('규칙적인 생활', '매일 같은 시간에 일어나고 자는 습관을 들이세요. 생체 리듬이 안정되면 건강이 좋아집니다.', 'sleep', '⏰', 12),
('심호흡', '스트레스를 받을 때 깊게 숨을 들이마시고 천천히 내쉬세요. 3-4회 반복하면 마음이 진정됩니다.', 'mental', '🌬️', 13),
('발효 식품', '김치, 요거트 같은 발효 식품은 장 건강에 좋습니다. 프로바이오틱스가 면역력을 높여줍니다.', 'nutrition', '🥬', 14),
('자세 교정', '바른 자세는 척추 건강의 기본입니다. 1시간마다 일어나서 몸을 펴주세요.', 'exercise', '🧍', 15)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE daily_health_tips IS '오늘의 건강 상식 - 날짜 기반 로테이션';

