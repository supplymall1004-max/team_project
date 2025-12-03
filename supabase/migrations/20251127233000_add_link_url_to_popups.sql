-- popup_announcements 테이블에 link_url 컬럼 추가
-- 팝업 클릭 시 이동할 URL

-- 1. link_url 컬럼 추가
ALTER TABLE popup_announcements
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- 2. 컬럼 추가 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'popup_announcements'
  AND column_name IN ('image_url', 'link_url');

























