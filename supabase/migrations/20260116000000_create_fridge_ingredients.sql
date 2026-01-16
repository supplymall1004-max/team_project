-- 냉장고 식재료 관리 테이블
-- 유통기한 추적 및 알림 시스템용

CREATE TABLE IF NOT EXISTS fridge_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  purchase_date DATE,
  expiry_date DATE NOT NULL,
  quantity TEXT,
  category TEXT,
  image_url TEXT,
  notification_sent_3days BOOLEAN DEFAULT FALSE,
  notification_sent_1day BOOLEAN DEFAULT FALSE,
  notification_sent_today BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_fridge_user_expiry ON fridge_ingredients(user_id, expiry_date);
CREATE INDEX idx_fridge_expiry_check ON fridge_ingredients(expiry_date) 
  WHERE expiry_date >= CURRENT_DATE;
CREATE INDEX idx_fridge_user_created ON fridge_ingredients(user_id, created_at DESC);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_fridge_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fridge_ingredients_updated_at
  BEFORE UPDATE ON fridge_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_fridge_ingredients_updated_at();

-- RLS 비활성화 (개발 환경)
ALTER TABLE fridge_ingredients DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE fridge_ingredients TO anon, authenticated, service_role;

COMMENT ON TABLE fridge_ingredients IS '냉장고 식재료 관리 - 유통기한 추적 및 알림';
COMMENT ON COLUMN fridge_ingredients.notification_sent_3days IS '3일 전 알림 발송 여부';
COMMENT ON COLUMN fridge_ingredients.notification_sent_1day IS '1일 전 알림 발송 여부';
COMMENT ON COLUMN fridge_ingredients.notification_sent_today IS '당일 알림 발송 여부';

