-- admin_copy_blocks 테이블 최적화 및 제약조건 설정

-- 1. 테이블 코멘트
COMMENT ON TABLE admin_copy_blocks IS '페이지 문구 관리 테이블 - 관리자가 수정할 수 있는 콘텐츠만 저장. 정적 콘텐츠는 actions/admin/copy/slots.ts의 기본값을 우선 사용.';

COMMENT ON COLUMN admin_copy_blocks.slug IS '콘텐츠 슬롯 식별자 (예: hero-title, footer-about). actions/admin/copy/slots.ts에 정의된 TEXT_SLOTS의 slug와 일치해야 함.';

COMMENT ON COLUMN admin_copy_blocks.content IS '구조화된 콘텐츠 데이터 (JSONB). 데이터베이스에 없으면 actions/admin/copy/slots.ts의 defaultContent를 사용.';

-- 2. UNIQUE 제약조건 (slug + locale 조합)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_copy_blocks_slug_locale_unique'
    AND conrelid = 'admin_copy_blocks'::regclass
  ) THEN
    ALTER TABLE admin_copy_blocks
    ADD CONSTRAINT admin_copy_blocks_slug_locale_unique UNIQUE (slug, locale);
  END IF;
END $$;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_locale ON admin_copy_blocks(locale);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug_locale ON admin_copy_blocks(slug, locale);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_updated_at ON admin_copy_blocks(updated_at DESC);

-- 4. RLS 비활성화
ALTER TABLE admin_copy_blocks DISABLE ROW LEVEL SECURITY;

-- 5. 권한 부여
GRANT ALL ON TABLE admin_copy_blocks TO anon, authenticated, service_role;
