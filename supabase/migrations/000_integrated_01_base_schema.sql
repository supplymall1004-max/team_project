-- ============================================================================
-- 통합 마이그레이션 01: 기본 스키마
-- ============================================================================
-- 작성일: 2025-12-02
-- 설명: 사용자, 스토리지 등 기본 인프라 테이블
-- ============================================================================

-- ============================================================================
-- 1. 사용자 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT false,
    premium_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    mfa_secret TEXT,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_backup_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.users OWNER TO postgres;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON public.users(mfa_enabled) WHERE mfa_enabled = true;

-- ============================================================================
-- 2. Storage 버킷 설정
-- ============================================================================
-- uploads 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  6291456,  -- 6MB 제한
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 6291456;

-- popup-images 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 (uploads)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- Storage RLS 정책 (popup-images)
DROP POLICY IF EXISTS "Public Access for Popup Images" ON storage.objects;
CREATE POLICY "Public Access for Popup Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'popup-images');

DROP POLICY IF EXISTS "Authenticated users can upload popup images" ON storage.objects;
CREATE POLICY "Authenticated users can upload popup images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'popup-images');

DROP POLICY IF EXISTS "Authenticated users can update popup images" ON storage.objects;
CREATE POLICY "Authenticated users can update popup images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'popup-images')
WITH CHECK (bucket_id = 'popup-images');

DROP POLICY IF EXISTS "Authenticated users can delete popup images" ON storage.objects;
CREATE POLICY "Authenticated users can delete popup images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'popup-images');

-- ============================================================================
-- 3. 공통 함수: updated_at 자동 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_at 컬럼을 자동으로 업데이트하는 트리거 함수';


