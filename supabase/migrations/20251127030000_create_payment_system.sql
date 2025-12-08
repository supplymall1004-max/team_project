-- 프리미엄 결제 시스템 테이블 생성
-- 작성일: 2025-11-27
-- 설명: 구독, 결제 내역, 프로모션 코드 관리

-- =============================================
-- 1. subscriptions (구독 정보)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 구독 상태
  status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, cancelled, paused
  plan_type TEXT NOT NULL, -- monthly, yearly
  
  -- 결제 정보
  billing_key TEXT, -- PG사 빌링키 (시뮬레이션에서는 더미 값)
  payment_method TEXT, -- card, kakaopay, naverpay
  last_four_digits TEXT, -- 카드 마지막 4자리
  
  -- 구독 기간
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- 가격
  price_per_month INTEGER NOT NULL, -- 월 환산 가격 (원)
  total_paid INTEGER, -- 실제 결제 금액 (원)
  
  -- 메타
  is_test_mode BOOLEAN DEFAULT true, -- 실제 결제 vs 시뮬레이션 구분
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'cancelled', 'paused')),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('monthly', 'yearly'))
);

-- 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- =============================================
-- 2. payment_transactions (결제 내역)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 결제 상태
  status TEXT NOT NULL, -- pending, completed, failed, refunded
  transaction_type TEXT NOT NULL, -- subscription, one_time, refund
  
  -- PG 정보
  pg_provider TEXT NOT NULL DEFAULT 'toss_payments',
  pg_transaction_id TEXT UNIQUE, -- PG사 거래 ID (시뮬레이션에서는 mock ID)
  
  -- 금액
  amount INTEGER NOT NULL, -- 결제 금액 (원)
  tax_amount INTEGER DEFAULT 0, -- 세금 (부가세)
  net_amount INTEGER NOT NULL, -- 순액
  
  -- 결제 수단
  payment_method TEXT, -- card, kakaopay, naverpay
  card_info JSONB, -- { "issuer": "신한", "last_four": "1234", "type": "credit" }
  
  -- 날짜
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- 메타
  metadata JSONB, -- 추가 정보 (영수증 번호, 프로모션 코드 등)
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('subscription', 'one_time', 'refund'))
);

-- 인덱스
CREATE INDEX idx_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_pg_id ON payment_transactions(pg_transaction_id);

-- =============================================
-- 3. promo_codes (프로모션 코드)
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- "LAUNCH2025", "FRIEND20"
  
  -- 할인 정보
  discount_type TEXT NOT NULL, -- percentage, fixed_amount, free_trial
  discount_value INTEGER NOT NULL, -- 20 (%), 5000 (원), 30 (일)
  
  -- 사용 제한
  max_uses INTEGER, -- NULL이면 무제한
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- 적용 조건
  applicable_plans TEXT[], -- ['monthly', 'yearly'] 또는 NULL (모두)
  new_users_only BOOLEAN DEFAULT false,
  
  -- 메타
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_discount CHECK (discount_value > 0),
  CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial'))
);

-- 인덱스
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until);

-- =============================================
-- 4. promo_code_uses (프로모션 사용 내역)
-- =============================================
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  used_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(promo_code_id, user_id) -- 사용자당 1회만 사용 가능
);

-- =============================================
-- 5. users 테이블 확장
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- =============================================
-- 6. 초기 프로모션 코드 생성 (테스트용)
-- =============================================
INSERT INTO promo_codes (code, discount_type, discount_value, valid_from, valid_until, description, new_users_only)
VALUES 
  ('LAUNCH2025', 'percentage', 30, now(), now() + interval '90 days', '런칭 기념 30% 할인', true),
  ('TEST50', 'percentage', 50, now(), now() + interval '365 days', '테스트용 50% 할인', false)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 7. 자동 업데이트 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- =============================================
-- 8. RPC 함수: 프로모션 코드 사용 횟수 증가
-- =============================================
CREATE OR REPLACE FUNCTION increment_promo_code_uses(promo_code_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = promo_code_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 주석
-- =============================================
COMMENT ON TABLE subscriptions IS '사용자 구독 정보';
COMMENT ON TABLE payment_transactions IS '결제 내역';
COMMENT ON TABLE promo_codes IS '프로모션 코드';
COMMENT ON TABLE promo_code_uses IS '프로모션 사용 내역';
COMMENT ON COLUMN subscriptions.is_test_mode IS '실제 결제가 아닌 시뮬레이션 모드 여부';
COMMENT ON COLUMN payment_transactions.is_test_mode IS '실제 결제가 아닌 시뮬레이션 모드 여부';

