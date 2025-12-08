-- 팝업 테이블 제약조건 제거 및 더미 데이터 삽입

-- 기존 외래 키 제약조건이 있다면 제거
-- (없을 경우 오류가 발생하지만 무시됨)
ALTER TABLE public.popup_announcements 
  DROP CONSTRAINT IF EXISTS popup_announcements_created_by_fkey;

ALTER TABLE public.popup_announcements 
  DROP CONSTRAINT IF EXISTS popup_announcements_updated_by_fkey;

-- 기존 데이터 삭제
DELETE FROM public.popup_announcements;

-- 단순한 더미 데이터 삽입
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
  updated_by,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '겨울 건강 관리 팝업',
  '겨울철 건강 관리를 위한 식단 추천을 확인하세요. 따뜻한 국물 요리와 비타민이 풍부한 음식으로 면역력을 높여보세요!',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'published',
  10,
  '["all"]'::jsonb,
  '{"button_text": "식단 보러가기", "button_link": "/recipes"}'::jsonb,
  'system',
  'system',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '신년 특별 이벤트',
  '2025년 신년을 맞아 특별한 건강 식단 이벤트를 준비했습니다.',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '35 days',
  'published',
  5,
  '["premium"]'::jsonb,
  '{}'::jsonb,
  'system',
  'system',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '식단 알림 설정 안내',
  '매일 아침 5시에 오늘의 식단을 알림으로 받아보세요.',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '40 days',
  'draft',
  3,
  '["all"]'::jsonb,
  '{}'::jsonb,
  'system',
  'system',
  NOW(),
  NOW()
);

-- 결과 확인
SELECT 
  id,
  title,
  status,
  priority,
  active_from,
  active_until
FROM public.popup_announcements
ORDER BY priority DESC;

