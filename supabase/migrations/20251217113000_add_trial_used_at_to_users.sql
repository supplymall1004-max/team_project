-- ============================================
-- Add trial usage tracking to users
-- ============================================
--
-- 목적:
-- - "14일 무료 체험"을 사용자당 1회로 제한하기 위해
--   users.trial_used_at 컬럼을 추가합니다.
--
-- 주의:
-- - 개발 환경 규칙에 따라 RLS 관련 구문은 추가하지 않습니다.
--

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.trial_used_at IS '14일 무료 체험을 시작한 시각(사용자당 1회 제한용)';

