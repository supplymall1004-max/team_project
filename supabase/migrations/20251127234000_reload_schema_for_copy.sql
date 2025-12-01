-- admin_copy_blocks 테이블의 Primary Key 확인 및 PostgREST 스키마 reload
-- 이미 PRIMARY KEY가 정의되어 있지만, PostgREST가 인식하지 못할 수 있음

-- 1. Primary Key 확인
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admin_copy_blocks'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 2. PostgREST 스키마 reload
NOTIFY pgrst, 'reload schema';

-- 3. RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'admin_copy_blocks';

