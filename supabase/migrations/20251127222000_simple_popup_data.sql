-- 간단한 팝업 더미 데이터 (타입 안전)

-- 기존 데이터 모두 삭제
TRUNCATE TABLE public.popup_announcements CASCADE;

-- 단일 팝업 데이터 삽입 (테스트용)
INSERT INTO public.popup_announcements (
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
) VALUES (
  '겨울 건강 관리 팝업',
  '겨울철 건강 관리를 위한 식단 추천을 확인하세요.',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'published',
  10,
  '["all"]',
  '{}',
  'system',
  'system'
);

-- 결과 확인
SELECT 
  id,
  title,
  status,
  priority,
  target_segments::text as segments,
  created_at
FROM public.popup_announcements;

