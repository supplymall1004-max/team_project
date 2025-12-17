-- 간단한 팝업 더미 데이터 (안전)
--
-- ⚠️ 주의:
-- - TRUNCATE/DELETE/DROP은 기존 팝업 데이터를 날려버릴 수 있어 위험합니다.
-- - 따라서 "비어있을 때만" 1건을 삽입하는 안전한 마이그레이션으로 유지합니다.

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
)
SELECT
  '겨울 건강 관리 팝업',
  '겨울철 건강 관리를 위한 식단 추천을 확인하세요.',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'published',
  10,
  '["all"]'::jsonb,
  '{}'::jsonb,
  'system',
  'system'
WHERE NOT EXISTS (SELECT 1 FROM public.popup_announcements);
