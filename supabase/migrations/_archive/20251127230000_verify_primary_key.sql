-- Primary Key 상태 확인 및 Supabase API 갱신

-- 1. Primary Key 존재 여부 확인
SELECT
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'popup_announcements'::regclass
  AND c.contype = 'p'; -- Primary Key만

-- 2. 테이블 스키마 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'popup_announcements'
ORDER BY ordinal_position;

-- 3. PostgREST 스키마 캐시 갱신 (중요!)
NOTIFY pgrst, 'reload schema';

-- 4. 간단한 데이터 조회 테스트
SELECT
  id,
  title,
  status,
  priority
FROM popup_announcements
ORDER BY priority DESC
LIMIT 5;

