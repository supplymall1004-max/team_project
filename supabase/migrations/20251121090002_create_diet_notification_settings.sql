-- 식단 알림 설정 테이블 생성
-- 사용자별 알림 설정 및 마지막 알림 기록 관리

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.diet_notification_settings CASCADE;

CREATE TABLE public.diet_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 알림 설정
  popup_enabled BOOLEAN DEFAULT true, -- 웹사이트 팝업 알림 활성화
  browser_enabled BOOLEAN DEFAULT false, -- 브라우저 알림 활성화
  notification_time TIME DEFAULT '05:00:00', -- 알림 시간 (KST)

  -- 알림 상태
  last_notification_date DATE, -- 마지막 알림 표시 날짜 (중복 방지)
  last_dismissed_date DATE, -- 마지막으로 알림 닫은 날짜

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_diet_notification_settings_user_id ON public.diet_notification_settings(user_id);
CREATE UNIQUE INDEX idx_diet_notification_settings_user_unique ON public.diet_notification_settings(user_id);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.diet_notification_settings DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.diet_notification_settings TO anon, authenticated, service_role;

-- 기본 설정으로 모든 사용자에게 설정 생성 (기존 사용자용)
-- 이 쿼리는 마이그레이션 실행 후 수동으로 실행하거나,
-- 애플리케이션에서 사용자 생성 시 자동으로 설정 생성하도록 구현
