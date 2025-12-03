-- 프리미엄 식단 고급 기능 테이블 생성
-- 작성일: 2025-11-29
-- 설명: 즐겨찾기, 밀키트, 특수 식단 기능을 위한 테이블

-- =============================================
-- 1. favorite_meals (즐겨찾기한 식단)
-- =============================================
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 식단 정보 (레시피 또는 식단 플랜)
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_title TEXT NOT NULL, -- 레시피 제목 (레시피 삭제 시에도 유지)
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- 영양 정보 (스냅샷)
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  
  -- 메타데이터
  notes TEXT, -- 사용자 메모
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 중복 방지: 같은 사용자가 같은 레시피를 중복 저장하지 않도록
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

-- 인덱스
CREATE INDEX idx_favorite_meals_user_id ON favorite_meals(user_id);
CREATE INDEX idx_favorite_meals_recipe_id ON favorite_meals(recipe_id);
CREATE INDEX idx_favorite_meals_created_at ON favorite_meals(created_at DESC);

-- =============================================
-- 2. meal_kits (수동 등록 밀키트 제품)
-- =============================================
CREATE TABLE IF NOT EXISTS meal_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 제품 정보
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL, -- 원 단위
  serving_size INTEGER DEFAULT 1, -- 인분 수
  
  -- 영양 정보
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  
  -- 카테고리
  category TEXT, -- 'korean', 'western', 'japanese', 'chinese' 등
  meal_type TEXT[] DEFAULT '{}', -- ['breakfast', 'lunch', 'dinner']
  
  -- 구매 링크
  purchase_url TEXT, -- 쿠팡 링크 또는 기타 마켓플레이스 링크
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT true, -- 프리미엄 전용 여부
  
  -- 메타데이터
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 관리자 ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_meal_kits_is_active ON meal_kits(is_active) WHERE is_active = true;
CREATE INDEX idx_meal_kits_category ON meal_kits(category);
CREATE INDEX idx_meal_kits_meal_type ON meal_kits USING GIN(meal_type);

-- =============================================
-- 3. meal_kit_products (쿠팡 API 제품 캐시)
-- =============================================
CREATE TABLE IF NOT EXISTS meal_kit_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 쿠팡 제품 정보
  coupang_product_id TEXT UNIQUE NOT NULL, -- 쿠팡 제품 ID
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER, -- 할인 전 가격
  discount_rate INTEGER, -- 할인율 (%)
  
  -- 링크
  product_url TEXT NOT NULL, -- 쿠팡 제품 페이지 URL
  affiliate_link TEXT, -- 제휴 링크 (쿠팡 파트너스)
  
  -- 영양 정보 (제품 설명에서 추출 또는 수동 입력)
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  
  -- 카테고리
  category TEXT,
  meal_type TEXT[] DEFAULT '{}',
  
  -- 캐시 정보
  last_synced_at TIMESTAMPTZ DEFAULT now(), -- 마지막 API 동기화 시간
  sync_status TEXT DEFAULT 'success', -- 'success', 'failed', 'pending'
  sync_error TEXT, -- 동기화 실패 시 에러 메시지
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true, -- 재고 여부
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_meal_kit_products_coupang_id ON meal_kit_products(coupang_product_id);
CREATE INDEX idx_meal_kit_products_is_active ON meal_kit_products(is_active) WHERE is_active = true;
CREATE INDEX idx_meal_kit_products_last_synced ON meal_kit_products(last_synced_at);
CREATE INDEX idx_meal_kit_products_category ON meal_kit_products(category);
CREATE INDEX idx_meal_kit_products_meal_type ON meal_kit_products USING GIN(meal_type);

-- =============================================
-- 4. updated_at 트리거 함수 (이미 존재할 수 있음)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_favorite_meals_updated_at
  BEFORE UPDATE ON favorite_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_kits_updated_at
  BEFORE UPDATE ON meal_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_kit_products_updated_at
  BEFORE UPDATE ON meal_kit_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. RLS 비활성화 (개발 환경)
-- =============================================
ALTER TABLE favorite_meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_kit_products DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. 권한 부여
-- =============================================
GRANT ALL ON TABLE favorite_meals TO anon, authenticated, service_role;
GRANT ALL ON TABLE meal_kits TO anon, authenticated, service_role;
GRANT ALL ON TABLE meal_kit_products TO anon, authenticated, service_role;

















