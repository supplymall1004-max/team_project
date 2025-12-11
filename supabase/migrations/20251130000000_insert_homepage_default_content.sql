-- 홈페이지 콘텐츠 기본값 삽입 마이그레이션
-- 모든 TEXT_SLOTS의 기본값을 admin_copy_blocks 테이블에 삽입
-- 이미 존재하는 슬롯은 건너뛰기 (ON CONFLICT DO NOTHING)

-- Hero 섹션
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-badge', 'ko', '{"text": "Flavor Archive Beta"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-title', 'ko', '{"title": "잊혀진 손맛을 연결하는 디지털 식탁", "subtitle": "전통과 현대를 잇는 레시피 아카이브"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-description', 'ko', '{"text": "명인의 전통 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요."}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-search-placeholder', 'ko', '{"text": "레시피, 명인, 재료를 검색해보세요"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-search-button', 'ko', '{"text": "검색"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('hero-background-image', 'ko', '{"imageUrl": null}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- 빠른 시작 카드
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('quick-start-legacy', 'ko', '{"title": "🎬 레거시 아카이브", "description": "명인 인터뷰와 전통 조리법을 고화질로 감상하세요.", "href": "/legacy"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('quick-start-recipe', 'ko', '{"title": "📚 현대 레시피 북", "description": "별점과 난이도로 정리된 최신 레시피를 확인해요.", "href": "/recipes"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('quick-start-diet', 'ko', '{"title": "🤖 건강 맞춤 식단", "description": "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.", "href": "/diet"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('quick-start-weekly', 'ko', '{"title": "📅 주간 식단", "description": "7일간의 식단을 한눈에 확인하고 장보기 리스트를 관리하세요.", "href": "/diet/weekly"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- Footer 섹션
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('footer-company-menu', 'ko', '{"links": [{"label": "회사소개", "href": "/about"}, {"label": "이용약관", "href": "/terms"}, {"label": "개인정보처리방침", "href": "/privacy"}, {"label": "문의하기", "href": "mailto:hello@flavor-archive.com"}]}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('footer-disclaimer', 'ko', '{"text": "의료 면책 조항: 본 서비스는 건강 관리 보조 수단이며 전문적인 진료를 대체하지 않습니다. 자세한 내용은 전문의와 상담해 주세요."}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('footer-copyright', 'ko', '{"text": "맛의 아카이브 (Flavor Archive)"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- Recipe Section
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('recipe-section-title', 'ko', '{"title": "🍴 현대 레시피 북"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('recipe-section-description', 'ko', '{"description": "별점과 난이도로 정리된 최신 레시피를 확인해보세요"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('recipe-section-button', 'ko', '{"text": "레시피 북 전체 보기"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- Diet Section
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('diet-section-title', 'ko', '{"title": "🧠 건강 맞춤 식단 큐레이션"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('diet-section-description', 'ko', '{"description": "건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- Legacy Section
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('legacy-section-title', 'ko', '{"title": "레거시 아카이브"}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO admin_copy_blocks (slug, locale, content, updated_by)
VALUES
  ('legacy-section-description', 'ko', '{"description": "명인의 인터뷰, 전문 기록, 대체재료 가이드를 한 번에 살펴보세요."}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;


