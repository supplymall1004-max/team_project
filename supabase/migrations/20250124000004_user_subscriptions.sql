-- 사용자 구독 관리 테이블 생성
-- 구독 플랜별 가족 구성원 제한 관리

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  subscription_plan TEXT NOT NULL DEFAULT 'free' 
    CHECK (subscription_plan IN ('free', 'single', 'premium', 'enterprise')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan ON public.user_subscriptions(subscription_plan);
CREATE INDEX idx_user_subscriptions_active ON public.user_subscriptions(is_active);

-- updated_at 트리거
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.user_subscriptions TO anon, authenticated, service_role;

-- 기본 구독 생성 트리거 (사용자 생성 시 자동으로 free 플랜 할당)
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_plan)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제
DROP TRIGGER IF EXISTS on_user_created_create_subscription ON public.users;

CREATE TRIGGER on_user_created_create_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

