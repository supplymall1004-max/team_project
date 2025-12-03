-- 관리자 콘솔 관련 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화하여 권한 에러 방지

-- 페이지 문구 관리 테이블
CREATE TABLE IF NOT EXISTS admin_copy_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL, -- 식별자 (예: 'hero-title', 'footer-about')
  locale TEXT DEFAULT 'ko', -- 언어 코드
  content JSONB NOT NULL, -- 구조화된 콘텐츠 데이터
  version INTEGER DEFAULT 1, -- 버전 번호
  updated_by TEXT NOT NULL, -- Clerk 사용자 ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- slug + locale 유니크 제약조건
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_copy_blocks_slug_locale_unique'
    AND conrelid = 'admin_copy_blocks'::regclass
  ) THEN
    ALTER TABLE admin_copy_blocks
    ADD CONSTRAINT admin_copy_blocks_slug_locale_unique
    UNIQUE (slug, locale);
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_locale ON admin_copy_blocks(locale);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_updated_at ON admin_copy_blocks(updated_at DESC);

-- 팝업 공지 관리 테이블
CREATE TABLE IF NOT EXISTS popup_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority INTEGER DEFAULT 0, -- 우선순위 (높을수록 중요)
  target_segments JSONB DEFAULT '[]'::jsonb, -- 대상 세그먼트 (예: ['premium', 'new_user'])
  metadata JSONB DEFAULT '{}'::jsonb, -- 추가 메타데이터
  created_by TEXT NOT NULL, -- Clerk 사용자 ID
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active_from ON popup_announcements(active_from);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active_until ON popup_announcements(active_until);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_priority ON popup_announcements(priority DESC);

-- 알림 로그 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kcdc', 'diet-popup', 'system')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  payload JSONB NOT NULL, -- 이벤트 데이터
  triggered_at TIMESTAMPTZ NOT NULL,
  actor TEXT, -- 실행자 (사용자 ID 또는 시스템)
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_triggered_at ON notification_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_actor ON notification_logs(actor);

-- 보안 감사 로그 테이블
CREATE TABLE IF NOT EXISTS admin_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('password-change', 'mfa-enable', 'mfa-disable', 'session-revoke', 'admin-access')),
  user_id TEXT NOT NULL, -- Clerk 사용자 ID
  details JSONB DEFAULT '{}'::jsonb, -- 액션 상세 정보
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_action ON admin_security_audit(action);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_user_id ON admin_security_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_created_at ON admin_security_audit(created_at DESC);

-- RLS 비활성화 (개발 단계)
ALTER TABLE admin_copy_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE popup_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_audit DISABLE ROW LEVEL SECURITY;

-- 트리거 설정 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_admin_copy_blocks_updated_at ON admin_copy_blocks;
CREATE TRIGGER update_admin_copy_blocks_updated_at
  BEFORE UPDATE ON admin_copy_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_popup_announcements_updated_at ON popup_announcements;
CREATE TRIGGER update_popup_announcements_updated_at
  BEFORE UPDATE ON popup_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by) VALUES
('hero-title', 'ko', '{"title": "잊혀진 손맛을 연결하는 디지털 식탁", "subtitle": "전통과 현대를 잇는 레시피 아카이브"}', 'system'),
('hero-description', 'ko', '{"text": "명인 인터뷰, 현대 레시피, AI 식단 추천을 한 곳에서 확인하세요."}', 'system'),
('footer-about', 'ko', '{"text": "맛의 아카이브는 전통 요리 문화의 보존과 현대인의 건강한 식생활을 위한 플랫폼입니다."}', 'system')
ON CONFLICT (slug, locale) DO NOTHING;
