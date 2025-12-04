-- ============================================================================
-- 통합 마이그레이션 06: 관리자 및 레거시 아카이브
-- ============================================================================
-- 작성일: 2025-12-02
-- 설명: 관리자 콘솔, 레거시 아카이브, KCDC 알림 등
-- ============================================================================

-- ============================================================================
-- 1. 관리자 콘솔 테이블
-- ============================================================================

-- 페이지 문구 관리 테이블
CREATE TABLE IF NOT EXISTS admin_copy_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  locale TEXT DEFAULT 'ko',
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, locale)
);

CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_locale ON admin_copy_blocks(locale);
CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_updated_at ON admin_copy_blocks(updated_at DESC);

DROP TRIGGER IF EXISTS update_admin_copy_blocks_updated_at ON admin_copy_blocks;
CREATE TRIGGER update_admin_copy_blocks_updated_at
  BEFORE UPDATE ON admin_copy_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE admin_copy_blocks DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE admin_copy_blocks TO anon, authenticated, service_role;

-- 팝업 공지 관리 테이블
CREATE TABLE IF NOT EXISTS popup_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority INTEGER DEFAULT 0,
  target_segments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  link_url TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active_from ON popup_announcements(active_from);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active_until ON popup_announcements(active_until);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_priority ON popup_announcements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_popup_announcements_updated_at ON popup_announcements(updated_at DESC);

DROP TRIGGER IF EXISTS update_popup_announcements_updated_at ON popup_announcements;
CREATE TRIGGER update_popup_announcements_updated_at
  BEFORE UPDATE ON popup_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE popup_announcements DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE popup_announcements TO anon, authenticated, service_role;

-- 알림 로그 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kcdc', 'diet-popup', 'system')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_triggered_at ON notification_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_actor ON notification_logs(actor) WHERE actor IS NOT NULL;

ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE notification_logs TO anon, authenticated, service_role;

-- 보안 감사 로그 테이블
CREATE TABLE IF NOT EXISTS admin_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('password-change', 'mfa-enable', 'mfa-disable', 'session-revoke', 'admin-access')),
  user_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_security_audit_action ON admin_security_audit(action);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_user_id ON admin_security_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_created_at ON admin_security_audit(created_at DESC);

ALTER TABLE admin_security_audit DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE admin_security_audit TO anon, authenticated, service_role;

-- ============================================================================
-- 2. 레거시 아카이브 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.legacy_masters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    bio TEXT
);

ALTER TABLE public.legacy_masters OWNER TO postgres;
ALTER TABLE public.legacy_masters DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_masters TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_id UUID REFERENCES public.legacy_masters(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL,
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    premium_only BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_videos OWNER TO postgres;
ALTER TABLE public.legacy_videos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_videos TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.legacy_videos(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    source JSONB NOT NULL DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_documents OWNER TO postgres;
ALTER TABLE public.legacy_documents DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_documents TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_replacement_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    traditional JSONB NOT NULL,
    modern JSONB NOT NULL,
    tips TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_replacement_guides OWNER TO postgres;
ALTER TABLE public.legacy_replacement_guides DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_replacement_guides TO anon, authenticated, service_role;

-- ============================================================================
-- 3. KCDC 알림 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS kcdc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  flu_stage TEXT,
  flu_week TEXT,
  vaccine_name TEXT,
  target_age_group TEXT,
  recommended_date DATE,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_type ON kcdc_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active ON kcdc_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_published ON kcdc_alerts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_priority ON kcdc_alerts(priority DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active_priority ON kcdc_alerts(is_active, priority DESC, published_at DESC);

DROP TRIGGER IF EXISTS trigger_update_kcdc_alerts_updated_at ON kcdc_alerts;
CREATE TRIGGER trigger_update_kcdc_alerts_updated_at
  BEFORE UPDATE ON kcdc_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 만료된 알림 자동 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_kcdc_alerts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE kcdc_alerts
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE kcdc_alerts DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE kcdc_alerts TO anon, authenticated, service_role;

-- ============================================================================
-- 4. 이미지 캐시 관련 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS image_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path TEXT NOT NULL,
  food_name TEXT,
  source_type TEXT,
  access_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_usage_logs_image_path ON image_usage_logs(image_path);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_food_name ON image_usage_logs(food_name);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_source_type ON image_usage_logs(source_type);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_last_accessed ON image_usage_logs(last_accessed_at);

ALTER TABLE image_usage_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE image_usage_logs TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS image_cache_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_images INTEGER DEFAULT 0,
  static_images INTEGER DEFAULT 0,
  gemini_images INTEGER DEFAULT 0,
  placeholder_images INTEGER DEFAULT 0,
  total_access_count INTEGER DEFAULT 0,
  cache_hit_rate DECIMAL(5, 2),
  storage_size_mb DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_cache_stats_date ON image_cache_stats(stat_date);

DROP TRIGGER IF EXISTS trigger_update_image_cache_stats_updated_at ON image_cache_stats;
CREATE TRIGGER trigger_update_image_cache_stats_updated_at
  BEFORE UPDATE ON image_cache_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE image_cache_stats DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE image_cache_stats TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS image_cache_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_date TIMESTAMPTZ NOT NULL,
  images_removed INTEGER DEFAULT 0,
  space_freed_mb DECIMAL(10, 2),
  cleanup_duration_ms INTEGER,
  cleanup_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_cache_cleanup_logs_date ON image_cache_cleanup_logs(cleanup_date);

ALTER TABLE image_cache_cleanup_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE image_cache_cleanup_logs TO anon, authenticated, service_role;

-- 이미지 사용 로그 집계 함수
CREATE OR REPLACE FUNCTION aggregate_image_usage_stats(target_date DATE)
RETURNS void AS $$
DECLARE
  total_count INTEGER;
  static_count INTEGER;
  gemini_count INTEGER;
  placeholder_count INTEGER;
  access_sum INTEGER;
BEGIN
  SELECT 
    COUNT(DISTINCT image_path),
    COUNT(DISTINCT CASE WHEN source_type = 'static' THEN image_path END),
    COUNT(DISTINCT CASE WHEN source_type = 'gemini' THEN image_path END),
    COUNT(DISTINCT CASE WHEN source_type = 'placeholder' THEN image_path END),
    COALESCE(SUM(access_count), 0)
  INTO 
    total_count,
    static_count,
    gemini_count,
    placeholder_count,
    access_sum
  FROM image_usage_logs
  WHERE DATE(last_accessed_at) = target_date;

  INSERT INTO image_cache_stats (
    stat_date,
    total_images,
    static_images,
    gemini_images,
    placeholder_images,
    total_access_count
  ) VALUES (
    target_date,
    total_count,
    static_count,
    gemini_count,
    placeholder_count,
    access_sum
  )
  ON CONFLICT (stat_date) DO UPDATE SET
    total_images = EXCLUDED.total_images,
    static_images = EXCLUDED.static_images,
    gemini_images = EXCLUDED.gemini_images,
    placeholder_images = EXCLUDED.placeholder_images,
    total_access_count = EXCLUDED.total_access_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 코멘트 추가
-- ============================================================================
COMMENT ON TABLE admin_copy_blocks IS '페이지 문구 관리';
COMMENT ON TABLE popup_announcements IS '팝업 공지 관리';
COMMENT ON TABLE notification_logs IS '알림 로그';
COMMENT ON TABLE admin_security_audit IS '보안 감사 로그';
COMMENT ON TABLE kcdc_alerts IS '질병관리청(KCDC) 공지 및 알림 데이터';
COMMENT ON TABLE image_usage_logs IS '이미지 사용 로그';
COMMENT ON TABLE image_cache_stats IS '이미지 캐시 통계 스냅샷';

