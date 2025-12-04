-- ============================================================================
-- 통합 마이그레이션 05: 결제 및 프리미엄 기능
-- ============================================================================
-- 작성일: 2025-12-02
-- 설명: 구독, 결제, 프로모션 코드, 프리미엄 식단 기능
-- ============================================================================

-- ============================================================================
-- 1. 사용자 구독 관리 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions(is_active);

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.user_subscriptions TO anon, authenticated, service_role;

-- 기본 구독 생성 트리거
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created_create_subscription ON public.users;
CREATE TRIGGER on_user_created_create_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- ============================================================================
-- 2. 구독 정보 테이블 (결제 시스템)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan_type TEXT NOT NULL,
  billing_key TEXT,
  payment_method TEXT,
  last_four_digits TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  price_per_month INTEGER NOT NULL,
  total_paid INTEGER,
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'cancelled', 'paused')),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE subscriptions TO anon, authenticated, service_role;

-- ============================================================================
-- 3. 결제 내역 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  pg_provider TEXT NOT NULL DEFAULT 'toss_payments',
  pg_transaction_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL,
  payment_method TEXT,
  card_info JSONB,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('subscription', 'one_time', 'refund'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_pg_id ON payment_transactions(pg_transaction_id);

ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE payment_transactions TO anon, authenticated, service_role;

-- ============================================================================
-- 4. 프로모션 코드 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  applicable_plans TEXT[],
  new_users_only BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_discount CHECK (discount_value > 0),
  CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial'))
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);

ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE promo_codes TO anon, authenticated, service_role;

-- ============================================================================
-- 5. 프로모션 사용 내역 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

ALTER TABLE promo_code_uses DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE promo_code_uses TO anon, authenticated, service_role;

-- 프로모션 코드 사용 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_promo_code_uses(promo_code_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = promo_code_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. 즐겨찾기 식단 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  recipe_title TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_meals_user_id ON favorite_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_recipe_id ON favorite_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorite_meals_created_at ON favorite_meals(created_at DESC);

DROP TRIGGER IF EXISTS update_favorite_meals_updated_at ON favorite_meals;
CREATE TRIGGER update_favorite_meals_updated_at
  BEFORE UPDATE ON favorite_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE favorite_meals DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE favorite_meals TO anon, authenticated, service_role;

-- ============================================================================
-- 7. 밀키트 제품 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  serving_size INTEGER DEFAULT 1,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  category TEXT,
  meal_type TEXT[] DEFAULT '{}',
  purchase_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_kits_is_active ON meal_kits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_meal_kits_category ON meal_kits(category);
CREATE INDEX IF NOT EXISTS idx_meal_kits_meal_type ON meal_kits USING GIN(meal_type);

DROP TRIGGER IF EXISTS update_meal_kits_updated_at ON meal_kits;
CREATE TRIGGER update_meal_kits_updated_at
  BEFORE UPDATE ON meal_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE meal_kits DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE meal_kits TO anon, authenticated, service_role;

-- ============================================================================
-- 8. 쿠팡 API 제품 캐시 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_kit_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupang_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  discount_rate INTEGER,
  product_url TEXT NOT NULL,
  affiliate_link TEXT,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  category TEXT,
  meal_type TEXT[] DEFAULT '{}',
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_status TEXT DEFAULT 'success',
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_kit_products_coupang_id ON meal_kit_products(coupang_product_id);
CREATE INDEX IF NOT EXISTS idx_meal_kit_products_is_active ON meal_kit_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_meal_kit_products_last_synced ON meal_kit_products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_meal_kit_products_category ON meal_kit_products(category);
CREATE INDEX IF NOT EXISTS idx_meal_kit_products_meal_type ON meal_kit_products USING GIN(meal_type);

DROP TRIGGER IF EXISTS update_meal_kit_products_updated_at ON meal_kit_products;
CREATE TRIGGER update_meal_kit_products_updated_at
  BEFORE UPDATE ON meal_kit_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE meal_kit_products DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE meal_kit_products TO anon, authenticated, service_role;

-- ============================================================================
-- 코멘트 추가
-- ============================================================================
COMMENT ON TABLE subscriptions IS '사용자 구독 정보';
COMMENT ON TABLE payment_transactions IS '결제 내역';
COMMENT ON TABLE promo_codes IS '프로모션 코드';
COMMENT ON TABLE favorite_meals IS '즐겨찾기한 식단';
COMMENT ON TABLE meal_kits IS '수동 등록 밀키트 제품';
COMMENT ON TABLE meal_kit_products IS '쿠팡 API 제품 캐시';

