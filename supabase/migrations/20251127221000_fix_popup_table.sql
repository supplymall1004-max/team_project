-- 팝업 공지 테이블 수정 및 RLS 확인

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.popup_announcements DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.popup_announcements TO anon, authenticated, service_role;

-- 기존 데이터 조회하여 확인
SELECT 
  id,
  title,
  status,
  active_from,
  active_until,
  priority,
  target_segments,
  metadata
FROM public.popup_announcements
ORDER BY priority DESC, created_at DESC;

