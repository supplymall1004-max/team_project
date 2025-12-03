-- popup_announcements 테이블에 image_url 컬럼 추가
-- 팝업에 이미지를 첨부할 수 있도록 확장

-- 1. image_url 컬럼 추가
ALTER TABLE popup_announcements
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 이미지 URL에 대한 인덱스 생성 (선택적, 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_popup_announcements_image_url 
ON popup_announcements(image_url) 
WHERE image_url IS NOT NULL;

-- 3. 컬럼 추가 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'popup_announcements'
  AND column_name = 'image_url';

























