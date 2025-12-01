-- 팝업 공지 더미 데이터 삽입
-- 테스트 및 개발 목적

-- 기존 더미 데이터 삭제 (개발 환경)
DELETE FROM public.popup_announcements WHERE title LIKE '% 팝업%';

-- 더미 팝업 데이터 삽입
INSERT INTO public.popup_announcements (
  id,
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
-- 1. 현재 활성 팝업
(
  gen_random_uuid(),
  '겨울 건강 관리 팝업',
  '겨울철 건강 관리를 위한 식단 추천을 확인하세요. 따뜻한 국물 요리와 비타민이 풍부한 음식으로 면역력을 높여보세요!',
  now() - interval '1 day',
  now() + interval '7 days',
  'published',
  10,
  '["all"]'::jsonb,
  '{"button_text": "식단 보러가기", "button_link": "/recipes"}'::jsonb,
  'system',
  'system'
),

-- 2. 곧 시작될 팝업
(
  gen_random_uuid(),
  '신년 특별 이벤트 팝업',
  '2025년 신년을 맞아 특별한 건강 식단 이벤트를 준비했습니다. 1월 1일부터 확인하세요!',
  now() + interval '5 days',
  now() + interval '35 days',
  'published',
  5,
  '["premium"]'::jsonb,
  '{"button_text": "자세히 보기", "button_link": "/events/new-year"}'::jsonb,
  'system',
  'system'
),

-- 3. 초안 상태 팝업
(
  gen_random_uuid(),
  '식단 알림 설정 안내 팝업',
  '매일 아침 5시에 오늘의 식단을 알림으로 받아보세요. 알림 설정을 통해 건강한 하루를 시작하세요.',
  now() + interval '10 days',
  now() + interval '40 days',
  'draft',
  3,
  '["all"]'::jsonb,
  '{"button_text": "설정하기", "button_link": "/settings/notifications"}'::jsonb,
  'system',
  'system'
),

-- 4. 만료된 팝업
(
  gen_random_uuid(),
  '추석 특별 레시피 팝업',
  '추석 명절을 맞아 전통 한식 레시피를 소개합니다. 가족과 함께 건강한 명절 음식을 즐겨보세요.',
  now() - interval '60 days',
  now() - interval '30 days',
  'archived',
  0,
  '["all"]'::jsonb,
  '{"button_text": "레시피 보기", "button_link": "/recipes/holiday"}'::jsonb,
  'system',
  'system'
);

-- 결과 확인
SELECT 
  id,
  title,
  status,
  active_from,
  active_until,
  priority
FROM public.popup_announcements
ORDER BY priority DESC, created_at DESC;

