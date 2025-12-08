-- 팝업 데이터 확인용 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'popup_announcements'
) AS table_exists;

-- 2. RLS 상태 확인
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'popup_announcements';

-- 3. 데이터 개수 확인
SELECT COUNT(*) AS total_rows
FROM popup_announcements;

-- 4. 실제 데이터 확인
SELECT
  id,
  title,
  status,
  active_from,
  active_until,
  priority,
  created_at
FROM popup_announcements
ORDER BY priority DESC, created_at DESC
LIMIT 10;

-- 5. 권한 확인
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'popup_announcements';

