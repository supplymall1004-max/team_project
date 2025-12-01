-- popup_announcements 테이블 Primary Key 수정
-- PGRST301 에러 해결: "No suitable key or wrong key type"

-- 1. 기존 테이블 삭제 후 재생성
DROP TABLE IF EXISTS popup_announcements CASCADE;

-- 2. 테이블 재생성 (Primary Key 명시적으로 설정)
CREATE TABLE popup_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority INTEGER DEFAULT 0,
  target_segments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Primary Key 명시적 설정
  CONSTRAINT popup_announcements_pkey PRIMARY KEY (id)
);

-- 3. 인덱스 재생성
CREATE INDEX idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX idx_popup_announcements_active_from ON popup_announcements(active_from);
CREATE INDEX idx_popup_announcements_active_until ON popup_announcements(active_until);
CREATE INDEX idx_popup_announcements_priority ON popup_announcements(priority DESC);
CREATE INDEX idx_popup_announcements_updated_at ON popup_announcements(updated_at DESC);

-- 4. RLS 비활성화
ALTER TABLE popup_announcements DISABLE ROW LEVEL SECURITY;

-- 5. 권한 부여
GRANT ALL ON popup_announcements TO postgres;
GRANT ALL ON popup_announcements TO anon;
GRANT ALL ON popup_announcements TO authenticated;
GRANT ALL ON popup_announcements TO service_role;

-- 6. updated_at 트리거 재설정
DROP TRIGGER IF EXISTS update_popup_announcements_updated_at ON popup_announcements;
CREATE TRIGGER update_popup_announcements_updated_at
  BEFORE UPDATE ON popup_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 더미 데이터 삽입
INSERT INTO popup_announcements (
  title,
  body,
  active_from,
  active_until,
  status,
  priority,
  target_segments,
  metadata,
  created_by,
  updated_by
) VALUES
(
  '🎉 서비스 오픈 기념 이벤트',
  '맛의 아카이브가 정식 오픈했습니다! 지금 가입하시면 프리미엄 기능을 1개월 무료로 이용하실 수 있습니다.',
  now(),
  now() + interval '30 days',
  'published',
  100,
  '["all"]'::jsonb,
  '{"theme": "success", "showCloseButton": true}'::jsonb,
  'system',
  'system'
),
(
  '📢 신규 레시피 업데이트',
  '전통 음식 명인 10분의 인터뷰와 레시피가 추가되었습니다. 지금 바로 확인해보세요!',
  now(),
  now() + interval '7 days',
  'published',
  80,
  '["premium", "standard"]'::jsonb,
  '{"theme": "info", "showCloseButton": true}'::jsonb,
  'system',
  'system'
),
(
  '🔔 정기 점검 안내 (임시저장)',
  '매주 월요일 새벽 2시~4시 정기 점검이 진행됩니다.',
  now() + interval '3 days',
  null,
  'draft',
  50,
  '["all"]'::jsonb,
  '{"theme": "warning", "showCloseButton": false}'::jsonb,
  'system',
  'system'
);

-- 8. 데이터 확인
SELECT
  id,
  title,
  status,
  priority,
  active_from,
  created_at
FROM popup_announcements
ORDER BY priority DESC, created_at DESC;

