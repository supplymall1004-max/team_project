-- 팝업 이미지를 위한 Supabase Storage 버킷 생성

-- 1. popup-images 버킷 생성 (public 접근 가능)
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책 설정 (기존 정책이 있으면 먼저 삭제)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public Access for Popup Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload popup images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own popup images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own popup images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update popup images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete popup images" ON storage.objects;

-- 2-1. 모든 사용자가 이미지를 볼 수 있도록 (SELECT)
CREATE POLICY "Public Access for Popup Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'popup-images');

-- 2-2. 인증된 사용자만 업로드 가능 (INSERT)
CREATE POLICY "Authenticated users can upload popup images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'popup-images');

-- 2-3. 인증된 사용자는 모든 팝업 이미지 업데이트 가능 (UPDATE)
-- 관리자만 팝업을 관리하므로 간소화
CREATE POLICY "Authenticated users can update popup images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'popup-images')
WITH CHECK (bucket_id = 'popup-images');

-- 2-4. 인증된 사용자는 모든 팝업 이미지 삭제 가능 (DELETE)
-- 관리자만 팝업을 관리하므로 간소화
CREATE POLICY "Authenticated users can delete popup images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'popup-images');

-- 3. 버킷 확인
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'popup-images';

